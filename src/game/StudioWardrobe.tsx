import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { GameState, StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import { integerScale } from '../ui/pixel-scale';
import { AN, asset, accessoryAsset, assetInfo, assetRegistry, garmentAsset, loadImage } from './assets';
import { content } from './store';
import { recolorLayer } from './StudioCharacter';

export type StudioPalette = { name: string; colors: [string, string, string, string] };
export type WardrobeTab = 'garment' | 'color' | 'accessory' | 'footwear';

// Whole-number scale for a pixel thumbnail: the largest multiple of its native height
// that fits the slot it is centred in (never fractional, so pixels stay square).
function useFitScale(nativeHeight: number, max = 2) {
  const slot = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = slot.current!;
    const measure = () => setScale(Math.min(max, integerScale(element.clientHeight, nativeHeight)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [nativeHeight, max]);
  return [slot, scale] as const;
}

// Painted garment thumbnails are shrunk (never upscaled) to the slot's height, so the slot height is measured, not rounded.
function useSlotHeight() {
  const slot = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const element = slot.current!;
    const measure = () => setHeight(element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [slot, height] as const;
}

function LockBadge({ hint }: { hint: string }) {
  return <span className="wardrobe-lock">
    <svg viewBox="0 0 8 10" width="16" height="20" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 0h4v1h1v3h1v6H0V4h1V1h1zm1 1v3h2V1zM3 6v2h2V6z" fill="currentColor" fillRule="evenodd" /></svg>
    <span>Chưa mở khóa · cần {hint}</span>
  </span>;
}

type PreviewProps = { garment: Garment; colors: StudioDraft['colorPalette']; locked?: boolean; hint?: string };

// Garment layers are being regenerated to An's spec; until one ships, show its catalogue icon.
function GarmentPreview(props: PreviewProps) {
  return assetRegistry[garmentAsset(props.garment.id)] ? <GarmentLayerPreview {...props} /> : <GarmentIconPreview {...props} />;
}

function GarmentIconPreview({ garment, locked = false, hint = '' }: PreviewProps) {
  const [slot, scale] = useFitScale(96);
  return <div ref={slot} className="wardrobe-thumb">
    <img className="pixel-native" src={asset(garmentAsset(garment.id, true))} alt="" width={96} height={96}
      style={{ width: 96 * scale, height: 96 * scale, filter: locked ? 'brightness(0) opacity(.55)' : undefined }} />
    {locked && <LockBadge hint={hint} />}
  </div>;
}

// Front cell (176×416) of the garment strip, cropped to the garment's bounds and drawn smoothed, shrunk to the slot.
function GarmentLayerPreview({ garment, colors, locked = false, hint = '' }: PreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const path = garmentAsset(garment.id);
  const [x0, y0, x1, y1] = assetInfo[path].bounds ?? [0, 0, AN.cellWidth, AN.cellHeight];
  const bx = Math.max(0, x0), by = y0, width = Math.max(1, Math.min(AN.cellWidth, x1) - bx), height = y1 - y0;
  const [slot, slotH] = useSlotHeight();
  const k = Math.min(1, slotH / height); // CSS px per art px
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const shownW = Math.round(width * k), shownH = Math.round(height * k);
  useEffect(() => {
    if (!shownH) return;
    let cancelled = false;
    const canvas = ref.current!;
    canvas.dataset.ready = 'false';
    loadImage(path).then(image => {
      if (cancelled) return;
      const preview = canvas.getContext('2d')!;
      preview.imageSmoothingEnabled = true; preview.imageSmoothingQuality = 'high';
      preview.clearRect(0, 0, canvas.width, canvas.height);
      preview.drawImage(recolorLayer(image, path, colors), bx, by, width, height, 0, 0, canvas.width, canvas.height);
      if (locked) {
        // Locked garments read as a dark silhouette of the real shape (spec §6.4).
        preview.globalCompositeOperation = 'source-in';
        preview.fillStyle = getComputedStyle(canvas).color;
        preview.fillRect(0, 0, canvas.width, canvas.height);
        preview.globalCompositeOperation = 'source-over';
      }
      canvas.dataset.ready = 'true';
    }).catch(() => { if (!cancelled) canvas.dataset.ready = 'error'; });
    return () => { cancelled = true; };
  }, [path, colors, locked, bx, by, width, height, shownH, dpr]);
  return <div ref={slot} className="wardrobe-thumb">
    <canvas ref={ref} className="wardrobe-garment art-hires" width={Math.max(1, Math.round(shownW * dpr))} height={Math.max(1, Math.round(shownH * dpr))}
      style={{ width: shownW, height: shownH }} aria-hidden="true" />
    {locked && <LockBadge hint={hint} />}
  </div>;
}

function AccessoryIcon({ id, locked, hint }: { id: string; locked: boolean; hint: string }) {
  const [slot, scale] = useFitScale(48);
  return <div ref={slot} className="wardrobe-thumb">
    <img className="pixel-native" src={asset(accessoryAsset(id, true))} alt="" width={48} height={48} style={{ width: 48 * scale, height: 48 * scale }} />
    {locked && <LockBadge hint={hint} />}
  </div>;
}

// The chapter whose reward hands out this garment.
function garmentHint(garmentId: string) {
  const chapter = Object.values(content.chapters).find(c => (c.chapter.reward.garmentIds as string[] | undefined)?.includes(garmentId));
  return chapter ? `Chương ${chapter.chapter.id.replace(/^c/, '')}` : 'hoàn thành cốt truyện';
}

const tabs: { id: WardrobeTab; label: string }[] = [
  { id: 'garment', label: 'Áo dài' }, { id: 'color', label: 'Màu vải' },
  { id: 'accessory', label: 'Phụ kiện' }, { id: 'footwear', label: 'Giày' },
];

export function StudioWardrobe({ state, draft, tab, onTab, palettes, onGarment, onColor, onAccessory, className, loanGarmentIds = [], loanAccessoryIds = [] }: {
  state: GameState; draft: StudioDraft; tab: WardrobeTab; onTab: (tab: WardrobeTab) => void;
  palettes: StudioPalette[]; onGarment: (garment: Garment) => void; onColor: (palette: StudioPalette) => void;
  onAccessory: (id: string) => void; className: string; loanGarmentIds?: string[]; loanAccessoryIds?: string[];
}) {
  const [page, setPage] = useState(0);
  const [fade, setFade] = useState<'none' | 'start' | 'end' | 'both'>('none');
  const scroller = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<WardrobeTab, HTMLButtonElement | null>>>({});
  const accessories = content.accessories.filter(a => tab === 'footwear' ? a.category === 'footwear' : a.category !== 'footwear');
  const count = tab === 'garment' ? content.garments.length : tab === 'color' ? palettes.length : accessories.length;
  const pages = Math.max(1, Math.ceil(count / 6));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * 6;
  const samePalette = (palette: StudioPalette) => palette.colors.every((color, i) => color === draft.colorPalette[i]);
  const chooseTab = (next: WardrobeTab) => { setPage(0); onTab(next); };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const target = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length].id;
    chooseTab(next); tabRefs.current[next]?.focus();
  };
  // Edge fades tell the player the dock scrolls sideways when the board is wider than the screen.
  useEffect(() => {
    const element = scroller.current!;
    const update = () => {
      const before = element.scrollLeft > 1, after = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
      setFade(before && after ? 'both' : before ? 'start' : after ? 'end' : 'none');
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update); observer.observe(element); observer.observe(element.firstElementChild!);
    return () => { element.removeEventListener('scroll', update); observer.disconnect(); };
  }, []);
  return <section className={`studio-wardrobe ${className}`} aria-label="Khay chọn trang phục">
    <div ref={scroller} className="wardrobe-scroll" data-fade={fade} tabIndex={0} aria-label="Các ô trang phục, cuộn ngang để xem thêm"><div className="wardrobe-board">
      <div className="wardrobe-art" aria-hidden="true"><img className="art-hires" src={asset('assets/screens/studio/wardrobe-frame--landscape.png')} alt="" /></div>
      <div className="wardrobe-tabs" role="tablist" aria-label="Danh mục phối đồ">{tabs.map((t, index) =>
        <button key={t.id} ref={element => { tabRefs.current[t.id] = element; }} role="tab" id={`wardrobe-tab-${t.id}`} aria-controls="wardrobe-panel"
          aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} onKeyDown={event => onTabKey(event, index)} onClick={() => chooseTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="wardrobe-pagination" role="group" aria-label="Trang danh mục">
        <button aria-label="Trang trang phục trước" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <span>{currentPage + 1}/{pages}</span>
        <button aria-label="Trang trang phục tiếp" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </div>
      <div className="wardrobe-cards" role="tabpanel" id="wardrobe-panel" aria-labelledby={`wardrobe-tab-${tab}`}>
        {Array.from({ length: 6 }, (_, index) => {
          const itemIndex = start + index;
          if (itemIndex >= count) return <div className="wardrobe-empty" key={index} aria-hidden="true" />;
          if (tab === 'garment') {
            const garment = content.garments[itemIndex];
            const owned = state.closet.unlockedGarmentIds.includes(garment.id) || loanGarmentIds.includes(garment.id);
            const equipped = garment.id === draft.garmentId;
            return <button key={garment.id} className={`wardrobe-card ${equipped ? 'is-selected' : ''} ${owned ? '' : 'is-locked'}`} aria-disabled={!owned || undefined} aria-pressed={equipped} onClick={() => { if (owned) onGarment(garment); }}>
              <GarmentPreview garment={garment} colors={garment.defaultColorPalette} locked={!owned} hint={garmentHint(garment.id)} /><span className="wardrobe-name">{garment.name}</span>{equipped && <small>Đang mặc</small>}{loanGarmentIds.includes(garment.id) && !state.closet.unlockedGarmentIds.includes(garment.id) && <small className="loan-tag">Đồ mượn</small>}
            </button>;
          }
          if (tab === 'color') {
            const palette = palettes[itemIndex];
            return <button key={palette.name} className={`wardrobe-card ${samePalette(palette) ? 'is-selected' : ''}`} aria-label={`Thử màu ${palette.name}`} aria-pressed={samePalette(palette)} onClick={() => onColor(palette)}>
              <GarmentPreview garment={content.garmentsById.get(draft.garmentId)!} colors={palette.colors} /><span className="wardrobe-name">{palette.name}</span>
            </button>;
          }
          const accessory = accessories[itemIndex];
          const owned = state.closet.unlockedAccessoryIds.includes(accessory.id) || loanAccessoryIds.includes(accessory.id);
          const selected = Object.values(draft.equippedAccessories).includes(accessory.id);
          return <button key={accessory.id} className={`wardrobe-card ${selected ? 'is-selected' : ''} ${owned ? '' : 'is-locked'}`} aria-disabled={!owned || undefined} aria-pressed={selected} onClick={() => { if (owned) onAccessory(accessory.id); }}>
            <AccessoryIcon id={accessory.id} locked={!owned} hint={`${accessory.senNgocPrice} Sen Ngọc`} /><span className="wardrobe-name">{accessory.name}</span>{loanAccessoryIds.includes(accessory.id) && !state.closet.unlockedAccessoryIds.includes(accessory.id) && <small className="loan-tag">Đồ mượn</small>}
          </button>;
        })}
      </div>
      <div className="wardrobe-colors"><strong>Màu sắc</strong><div>{palettes.map(palette => <button key={palette.name} aria-label={palette.name} aria-pressed={samePalette(palette)} title={palette.name} style={{ '--swatch': palette.colors[1] } as CSSProperties} onClick={() => onColor(palette)} />)}</div></div>
    </div></div>
  </section>;
}
