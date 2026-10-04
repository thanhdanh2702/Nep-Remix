import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StudioDraft } from '../core';
import type { LookbookRequest, LookbookSuccessResponse } from '../server/ai/lookbook';
import { content } from './store';
import { asset } from './assets';
import { callAi } from './ai-client';
import { AiStatusBadge, type AiBadgeStatus } from './AiStatusBadge';
import './studio-ai.css';

type Mode = { kind: 'pixel' } | { kind: 'loading' } | { kind: 'ai'; status: AiBadgeStatus; data: LookbookSuccessResponse };

// Only embedded data: URLs (what the server builds) or same-origin paths are rendered as <img>.
const safeImage = (url: unknown): url is string => typeof url === 'string' && (url.startsWith('data:image/') || (url.startsWith('/') && !url.startsWith('//')));

const buildRequest = (draft: StudioDraft, eventTitle: string): LookbookRequest => {
  const garment = content.garmentsById.get(draft.garmentId);
  return {
    garmentId: draft.garmentId,
    garmentName: garment?.name ?? draft.garmentId,
    silhouette: draft.silhouette,
    colorPalette: [...draft.colorPalette],
    accessoryNames: Object.values(draft.equippedAccessories).filter((id): id is string => !!id).map(id => content.accessoriesById.get(id)?.name ?? id),
    eventTitle,
  };
};

/** Lookbook frame: pixel portraits (children) by default; "Chụp Lookbook AI" swaps in 4 Gemini photos, any failure keeps the pixel grid. */
export function StudioLookbookAi({ draft, eventTitle, children, actions }: { draft: StudioDraft; eventTitle: string; children: ReactNode; actions: ReactNode }) {
  const [mode, setMode] = useState<Mode>({ kind: 'pixel' });
  const [offline, setOffline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  // Photos describe the outfit at capture time: any outfit change drops back to the live pixel portraits.
  useEffect(() => { abortRef.current?.abort(); setMode({ kind: 'pixel' }); }, [draft]);

  const capture = async () => {
    abortRef.current?.abort();
    const controller = abortRef.current = new AbortController();
    setMode({ kind: 'loading' });
    const response = await callAi<LookbookSuccessResponse>('/api/ai/lookbook', buildRequest(draft, eventTitle), controller.signal);
    if (controller.signal.aborted) return;
    const images = response.status === 'fallback' ? [] : (response.data.images ?? []).filter(image => safeImage(image?.imageUrl)).slice(0, 4);
    if (response.status === 'fallback' || !images.length) { setOffline(true); setMode({ kind: 'pixel' }); return; }
    setOffline(false);
    setMode({ kind: 'ai', status: response.status, data: { ...response.data, images } });
  };

  const loading = mode.kind === 'loading';
  const ai = mode.kind === 'ai' ? mode : null;
  return <>
    <div className="studio-lookbook-board">
      <div className="studio-lookbook-art" aria-hidden="true"><img className="art-hires" src={asset('assets/screens/studio/lookbook-frame.png')} alt="" /></div>
      <div className="studio-lookbook-grid">{ai
        ? ai.data.images.map(image => <figure key={image.angle} className="studio-lookbook-card">
          <div className="studio-lookbook-portrait"><img className="studio-ai-photo" src={image.imageUrl} alt={`${image.angleLabel} - ảnh AI bộ phối ${content.garmentsById.get(draft.garmentId)?.name ?? ''}`} loading="lazy" /></div>
          <figcaption>{image.angleLabel}</figcaption>
        </figure>)
        : children}</div>
      <div className="studio-ai-lookbook-status" aria-live="polite">
        {loading && <span>Đang hỏi Gemini…</span>}
        {ai && <><AiStatusBadge status={ai.status} offlineText="ảnh pixel" /> <span>{ai.data.watermark}. {ai.data.disclosure}</span></>}
        {offline && !loading && !ai && <AiStatusBadge status="fallback" offlineText="dùng ảnh pixel" />}
      </div>
    </div>
    <div className="studio-actions" role="group" aria-label="Lưu và tùy chỉnh bộ phối">
      {actions}
      {ai
        ? <button className="studio-ai-capture" onClick={() => setMode({ kind: 'pixel' })}>Về ảnh pixel</button>
        : <button className="studio-ai-capture" disabled={loading} aria-busy={loading} onClick={capture}>{loading ? 'Đang hỏi Gemini…' : 'Chụp Lookbook AI'}</button>}
    </div>
  </>;
}
