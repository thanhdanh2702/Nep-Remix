import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Command, GameState, StudioDraft } from '../core';
import type { StylistOutfitSuggestion } from '../server/ai/stylist';
import { content } from './store';
import { callAi } from './ai-client';
import { AiStatusBadge, type AiBadgeStatus } from './AiStatusBadge';
import { Modal } from './Modal';
import { StudioActionIcon } from './StudioActionIcon';
import './studio-ai.css';

type StylistFallback = { suggestions?: StylistOutfitSuggestion[]; message?: string };
type Result = { status: AiBadgeStatus; suggestions: StylistOutfitSuggestion[]; message?: string };

const isHex = (value: string) => /^#[0-9a-f]{3,8}$/i.test(value);
const OFFLINE_TEXT = 'dùng gợi ý có sẵn';

/** "Gợi ý từ Gemini": asks /api/ai/stylist on click only, shows up to 3 cards, "Mặc thử" applies the unlocked part via studio/applyPreset. */
export function StudioStylist({ state, draft, update, notify }: { state: GameState; draft: StudioDraft; update: (cmd: Command) => void; notify: (message: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async () => {
    abortRef.current?.abort();
    const controller = abortRef.current = new AbortController();
    setLoading(true);
    const response = await callAi<{ suggestions: StylistOutfitSuggestion[] }, StylistFallback>('/api/ai/stylist', { eventId: draft.eventContextId }, controller.signal);
    if (controller.signal.aborted) return;
    setLoading(false);
    const list = response.status === 'fallback' ? response.fallback?.suggestions : response.data.suggestions;
    const suggestions = Array.isArray(list) ? list.slice(0, 3) : [];
    // A 'ok' response without usable suggestions is treated as offline too.
    const status: AiBadgeStatus = response.status === 'fallback' || !suggestions.length ? 'fallback' : response.status;
    setResult({ status, suggestions, message: response.status === 'fallback' ? response.fallback?.message : undefined });
    setOpen(true);
  };

  const unlockedGarment = (id: string) => content.garmentsById.has(id) && state.closet.unlockedGarmentIds.includes(id);
  const unlockedAccessory = (id: string) => content.accessoriesById.has(id) && state.closet.unlockedAccessoryIds.includes(id);

  const tryOn = (suggestion: StylistOutfitSuggestion) => {
    const garmentUnlocked = unlockedGarment(suggestion.garmentId);
    const garment = content.garmentsById.get(garmentUnlocked ? suggestion.garmentId : draft.garmentId)!;
    const equippedAccessories: Record<string, string> = {};
    for (const id of suggestion.accessoryIds) if (unlockedAccessory(id)) equippedAccessories[content.accessoriesById.get(id)!.category] = id;
    const colorPalette = suggestion.colorPalette.every(isHex) ? suggestion.colorPalette : garment.defaultColorPalette;
    update({ type: 'studio/applyPreset', payload: { preset: { garmentId: garment.id, silhouette: garment.silhouette, colorPalette, equippedAccessories } } });
    const locked = !garmentUnlocked || suggestion.accessoryIds.some(id => !unlockedAccessory(id));
    if (locked) notify('Một phần gợi ý chưa mở khóa, Nếp đã áp phần bạn đang có.');
    setOpen(false);
  };

  return <div className="studio-ai-row" ref={rowRef} aria-live="polite">
    <button className="studio-ai-button" aria-label="Gợi ý từ Gemini" disabled={loading} aria-busy={loading} onClick={ask}><StudioActionIcon kind="sparkle" /><span>{loading ? 'Đang hỏi…' : 'Gợi ý phối'}</span></button>
    {result && !loading && <AiStatusBadge status={result.status} offlineText={OFFLINE_TEXT} />}
    {open && result && createPortal(<Modal title="Gợi ý từ Nếp" className="studio-ai-modal" onClose={() => setOpen(false)}>
      <p className="studio-ai-note"><AiStatusBadge status={result.status} offlineText={OFFLINE_TEXT} /> {result.message}</p>
      {!result.suggestions.length && <p>Chưa kết nối được Gemini. Bạn thử lại sau ít phút nhé.</p>}
      <ul className="studio-ai-cards">{result.suggestions.map((s, i) => {
        const lockedGarment = !unlockedGarment(s.garmentId);
        return <li key={`${s.garmentId}-${i}`} className="studio-ai-card">
          <h3>{s.garmentName}{lockedGarment && <small className="studio-ai-lock"> · Chưa mở khóa</small>}</h3>
          <div className="studio-ai-swatches" aria-hidden="true">{s.colorPalette.map((color, k) => <span key={k} style={{ background: isHex(color) ? color : 'var(--c-disabled-bg)' }} />)}</div>
          <p className="studio-ai-accessories">{s.accessoryIds.length ? s.accessoryIds.map((id, k) => <span key={id}>{s.accessoryNames[k] ?? id}{!unlockedAccessory(id) && <small className="studio-ai-lock"> (Chưa mở khóa)</small>}{k < s.accessoryIds.length - 1 && ', '}</span>) : 'Không phụ kiện'}</p>
          <p className="studio-ai-comment">{s.catComment}</p>
          <button className="primary" onClick={() => tryOn(s)} aria-label={`Mặc thử ${s.garmentName}`}>Mặc thử</button>
        </li>;
      })}</ul>
    </Modal>, rowRef.current?.closest('.studio-room') ?? document.body)}
  </div>;
}
