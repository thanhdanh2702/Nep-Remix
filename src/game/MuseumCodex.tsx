import { useMemo, useState } from 'react';
import type { GameState } from '../core';
import { content } from './store';
import { asset, itemAsset } from './assets';
import { Modal } from './Modal';
import { PixelIcon } from '../welcome/PixelIcon';
import { foundItems, metSpeakers, type CodexCharacter, type CodexItem } from './museum-codex-data';
import './museum-codex.css';

export type CodexKind = 'characters' | 'items';

// Item icons are 48×48 art: drawn at ×2 (96px) in CSS. Hi-res NPC sprites are smoothed.
function CharacterArt({ character }: { character: CodexCharacter }) {
  const { portrait, met } = character;
  const spriteSrc = portrait.kind === 'sprite' ? asset(portrait.path) : null;
  return <span className={`codex-art codex-portrait${met ? '' : ' is-locked'}`} aria-hidden="true">
    {spriteSrc ? <img src={spriteSrc} alt="" draggable={false} /> : <span className="codex-emblem"><PixelIcon kind="lotus" /></span>}
  </span>;
}

function ItemArt({ item }: { item: CodexItem }) {
  const path = itemAsset(item.id);
  return <span className={`codex-art codex-icon${item.found ? '' : ' is-locked'}`} aria-hidden="true">
    {path ? <img className="pixel-native" src={asset(path)} alt="" draggable={false} /> : <span className="codex-emblem"><PixelIcon kind="lotus" /></span>}
  </span>;
}

export function MuseumCodex({ kind, state, onClose }: { kind: CodexKind; state: GameState; onClose: () => void }) {
  const characters = useMemo(() => metSpeakers(state, content), [state]);
  const items = useMemo(() => foundItems(state, content), [state]);
  const [selected, setSelected] = useState<string | null>(null);
  const isCharacters = kind === 'characters';
  const entries = isCharacters
    ? characters.map(c => ({ key: c.name, unlocked: c.met, label: c.met ? c.name : '???', aria: c.met ? `${c.name} · ${c.chapterTitle}` : 'Nhân vật chưa gặp', detail: c.met ? `${c.name} · ${c.chapterTitle}` : 'Chưa gặp. Hãy tiếp tục câu chuyện để gặp nhân vật này.', art: <CharacterArt character={c} /> }))
    : items.map(i => ({ key: i.id, unlocked: i.found, label: i.found ? i.name : '???', aria: i.found ? `${i.name} · đã tìm thấy` : 'Kỷ vật chưa tìm thấy', detail: i.found ? `${i.name}. ${i.description}` : 'Chưa tìm thấy.', art: <ItemArt item={i} /> }));
  const unlocked = entries.filter(e => e.unlocked).length;
  const active = entries.find(e => e.key === selected);
  return <Modal title={isCharacters ? 'Nhân vật' : 'Kỷ vật'} wide className="museum-reader museum-codex" onClose={onClose}>
    <p className="codex-count" role="status">{unlocked}/{entries.length} {isCharacters ? 'đã gặp' : 'đã tìm thấy'}</p>
    <ul className="codex-grid" data-kind={kind}>
      {entries.map(entry => <li key={entry.key}>
        <button type="button" className={`codex-cell${entry.unlocked ? '' : ' is-locked'}${selected === entry.key ? ' is-selected' : ''}`} aria-label={entry.aria} aria-pressed={selected === entry.key} onClick={() => setSelected(entry.key)}>
          {entry.art}
          <span className="codex-label">{entry.label}</span>
        </button>
      </li>)}
    </ul>
    <p className="codex-detail" aria-live="polite">{active ? active.detail : 'Chọn một ô để xem chi tiết.'}</p>
  </Modal>;
}
