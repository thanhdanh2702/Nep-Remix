import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { GameState, StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import { asset, accessoryAsset } from './assets';
import { content } from './store';
import { ClothingPreview } from './ClothingPreview';

export type StudioPalette = { name: string; colors: [string, string, string, string] };
export type WardrobeTab = 'garment' | 'color' | 'accessory' | 'footwear';
const tabs: { id: WardrobeTab; label: string }[] = [
  { id: 'garment', label: 'Áo' }, { id: 'color', label: 'Màu' },
  { id: 'accessory', label: 'Phụ kiện' }, { id: 'footwear', label: 'Giày' },
];
function LockBadge({ hint }: { hint: string }) {
  return <span className="wardrobe-lock" title={hint}>
    <svg viewBox="0 0 24 28" aria-hidden="true"><path d="M6 11V7a6 6 0 0 1 12 0v4M3 11h18v15H3z" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M12 17v4" stroke="currentColor" strokeWidth="3"/></svg>
    <span>Chưa mở khóa</span>
  </span>;
}
export function StudioWardrobe({ state, draft, tab, onTab, palettes, onGarment, onColor, onAccessory, className, loanGarmentIds = [], loanAccessoryIds = [] }: {
  state: GameState; draft: StudioDraft; tab: WardrobeTab; onTab: (tab: WardrobeTab) => void;
  palettes: StudioPalette[]; onGarment: (garment: Garment) => void; onColor: (palette: StudioPalette) => void;
  onAccessory: (id: string) => void; className: string; loanGarmentIds?: string[]; loanAccessoryIds?: string[];
}) {
  const [page, setPage] = useState(0), [pageSize, setPageSize] = useState(4);
  const container = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<WardrobeTab, HTMLButtonElement | null>>>({});
  useLayoutEffect(() => {
    const el = container.current!;
    const measure = () => setPageSize(4);
    const observer = new ResizeObserver(measure); observer.observe(el); measure();
    return () => observer.disconnect();
  }, []);
  const accessories = content.accessories.filter(a => tab === 'footwear' ? a.category === 'footwear' : a.category !== 'footwear');
  const count = tab === 'garment' ? content.garments.length : tab === 'color' ? palettes.length : accessories.length;
  const pages = Math.max(1, Math.ceil(count / pageSize)), currentPage = Math.min(page, pages - 1);
  const samePalette = (p: StudioPalette) => p.colors.every((color, i) => color === draft.colorPalette[i]);
  const chooseTab = (next: WardrobeTab) => { setPage(0); onTab(next); };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const at = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (at === null) return;
    event.preventDefault(); const next = tabs[(at + tabs.length) % tabs.length].id; chooseTab(next); tabRefs.current[next]?.focus();
  };
  return <section ref={container} className={`studio-wardrobe ${className}`} aria-label="Khay chọn trang phục"
    style={{ '--wardrobe-columns': pageSize, '--wardrobe-frame': `url("${asset('assets/screens/studio/catalog-cabinet--9slice-v2.png')}")`, '--wardrobe-card-frame': `url("${asset('assets/screens/studio/styling-tray--9slice-v2.png')}")` } as CSSProperties}>
    <div className="wardrobe-scroll"><div className="wardrobe-board">
      <div className="wardrobe-tabs" role="tablist" aria-label="Danh mục phối đồ">{tabs.map((t, index) =>
        <button key={t.id} ref={el => { tabRefs.current[t.id] = el; }} role="tab" aria-label={t.id === 'garment' ? 'Áo dài' : t.id === 'color' ? 'Màu vải' : t.label} id={`wardrobe-tab-${t.id}`} aria-controls="wardrobe-panel"
          aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} onKeyDown={e => onTabKey(e, index)} onClick={() => chooseTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="wardrobe-pagination" role="group" aria-label="Trang danh mục">
        <button aria-label="Trang trang phục trước" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>‹</button>
        <span aria-live="polite">{currentPage + 1}/{pages}</span>
        <button aria-label="Trang trang phục tiếp" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </div>
      <div className="wardrobe-cards" role="tabpanel" id="wardrobe-panel" aria-labelledby={`wardrobe-tab-${tab}`} data-page-size={pageSize}>
        {Array.from({ length: pageSize }, (_, i) => {
          const index = currentPage * pageSize + i;
          if (index >= count) return <div className="wardrobe-empty" key={i} aria-hidden="true"/>;
          if (tab === 'garment' || tab === 'color') {
            const g = tab === 'garment' ? content.garments[index] : content.garmentsById.get(draft.garmentId)!;
            const p = tab === 'color' ? palettes[index] : null;
            const owned = Boolean(p) || state.closet.unlockedGarmentIds.includes(g.id) || loanGarmentIds.includes(g.id);
            const selected = p ? samePalette(p) : g.id === draft.garmentId;
            const chapter = Object.values(content.chapters).find(c => c.chapter.reward.garmentIds?.includes(g.id));
            const hint = chapter ? `Hoàn thành ${chapter.chapter.title}` : 'Khám phá cốt truyện để mở áo';
            return <button key={p?.name ?? g.id} className={`wardrobe-card${selected ? ' is-selected' : ''}${owned ? '' : ' is-locked'}`}
              aria-label={p ? `Thử màu ${p.name}` : `${g.name}${owned ? '' : ` · Chưa mở khóa · ${hint}`}`} title={p?.name ?? g.name}
              aria-disabled={!owned || undefined} aria-pressed={selected} onClick={() => { if (p) onColor(p); else if (owned) onGarment(g); }}>
              <div className="wardrobe-preview"><ClothingPreview garment={g} colors={p?.colors ?? g.defaultColorPalette} showHanger={false}/>{!owned && <LockBadge hint={hint}/>}</div>
              <span className="wardrobe-name">{p?.name ?? g.name}</span>
              {selected && !p && <small>Đang mặc</small>}
              {loanGarmentIds.includes(g.id) && !state.closet.unlockedGarmentIds.includes(g.id) && <small className="loan-tag">Đồ mượn</small>}
            </button>;
          }
          const a = accessories[index], owned = state.closet.unlockedAccessoryIds.includes(a.id) || loanAccessoryIds.includes(a.id);
          const selected = Object.values(draft.equippedAccessories).includes(a.id);
          return <button key={a.id} className={`wardrobe-card${selected ? ' is-selected' : ''}${owned ? '' : ' is-locked'}`}
            aria-label={`${a.name}${owned ? '' : ` · Chưa mở khóa · ${a.senNgocPrice} Sen Ngọc`}`} title={a.name} aria-disabled={!owned || undefined} aria-pressed={selected} onClick={() => { if (owned) onAccessory(a.id); }}>
            <div className="wardrobe-preview"><img src={asset(accessoryAsset(a.id, true))} alt=""/>{!owned && <LockBadge hint={`${a.senNgocPrice} Sen Ngọc`}/>}</div>
            <span className="wardrobe-name">{a.name}</span>
            {loanAccessoryIds.includes(a.id) && !state.closet.unlockedAccessoryIds.includes(a.id) && <small className="loan-tag">Đồ mượn</small>}
          </button>;
        })}
      </div>
    </div></div>
  </section>;
}
