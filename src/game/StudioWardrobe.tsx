import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameState, StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import { asset, accessoryAsset, assetInfo, garmentAsset, loadImage } from './assets';
import { content } from './store';

export type StudioPalette = { name: string; colors: [string, string, string, string] };
export type WardrobeTab = 'garment' | 'color' | 'accessory' | 'footwear';

function GarmentPreview({ garment, colors }: { garment: Garment; colors: StudioDraft['colorPalette'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    ref.current!.dataset.ready = 'false';
    const path = garmentAsset(garment.id);
    loadImage(path).then(image => {
      if (cancelled) return;
      const layer = document.createElement('canvas'); layer.width = 64; layer.height = 96;
      const ctx = layer.getContext('2d')!; ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, 64, 96);
      const keys = [224, 158, 97, 33];
      const palette = colors.map(hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)));
      for (let p = 0; p < pixels.data.length; p += 4) {
        const color = keys.indexOf(pixels.data[p]);
        if (pixels.data[p + 3] && color >= 0 && pixels.data[p] === pixels.data[p + 1] && pixels.data[p] === pixels.data[p + 2]) {
          palette[color].forEach((value, channel) => { pixels.data[p + channel] = value; });
        }
      }
      ctx.putImageData(pixels, 0, 0);
      const bounds = assetInfo[path].bounds ?? [0, 0, 64, 96];
      const canvas = ref.current!;
      canvas.width = bounds[2] - bounds[0]; canvas.height = bounds[3] - bounds[1];
      const preview = canvas.getContext('2d')!; preview.imageSmoothingEnabled = false;
      preview.drawImage(layer, bounds[0], bounds[1], canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      canvas.dataset.ready = 'true';
    }).catch(() => { if (!cancelled) ref.current!.dataset.ready = 'error'; });
    return () => { cancelled = true; };
  }, [garment, colors]);
  return <canvas ref={ref} className="wardrobe-garment" aria-hidden="true" />;
}

export function StudioWardrobe({ state, draft, tab, onTab, palettes, onGarment, onColor, onAccessory, className }: {
  state: GameState; draft: StudioDraft; tab: WardrobeTab; onTab: (tab: WardrobeTab) => void;
  palettes: StudioPalette[]; onGarment: (garment: Garment) => void; onColor: (palette: StudioPalette) => void;
  onAccessory: (id: string) => void; className: string;
}) {
  const [page, setPage] = useState(0);
  const accessories = content.accessories.filter(a => tab === 'footwear' ? a.category === 'footwear' : a.category !== 'footwear');
  const count = tab === 'garment' ? content.garments.length : tab === 'color' ? palettes.length : accessories.length;
  const pages = Math.max(1, Math.ceil(count / 6));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * 6;
  const samePalette = (palette: StudioPalette) => palette.colors.every((color, i) => color === draft.colorPalette[i]);
  const chooseTab = (next: WardrobeTab) => { setPage(0); onTab(next); };
  const tabs: { id: WardrobeTab; label: string; accessible: string }[] = [
    { id: 'garment', label: 'Áo dài', accessible: 'Dáng áo' }, { id: 'color', label: 'Màu vải', accessible: 'Màu vải' },
    { id: 'accessory', label: 'Phụ kiện', accessible: 'Phụ kiện' }, { id: 'footwear', label: 'Giày', accessible: 'Giày' },
  ];
  return <section className={`studio-wardrobe ${className}`} aria-label="Khay chọn trang phục">
    <div className="wardrobe-scroll" tabIndex={0} aria-label="Các ô trang phục, cuộn ngang để xem thêm"><div className="wardrobe-board">
      <div className="wardrobe-art" aria-hidden="true"><img src={asset('assets/screens/studio/wardrobe-frame--landscape.png')} alt="" /></div>
      <div className="wardrobe-tabs" role="tablist" aria-label="Danh mục phối đồ">{tabs.map(t => <button key={t.id} role="tab" aria-label={t.accessible} aria-selected={tab === t.id} onClick={() => chooseTab(t.id)}>{t.label}</button>)}</div>
      <div className="wardrobe-pagination" role="group" aria-label="Trang danh mục">
        <button aria-label="Trang trang phục trước" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <span>{currentPage + 1}/{pages}</span>
        <button aria-label="Trang trang phục tiếp" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </div>
      <div className="wardrobe-cards" role="tabpanel" aria-label={tabs.find(t => t.id === tab)!.label}>
        {Array.from({ length: 6 }, (_, index) => {
          const itemIndex = start + index;
          if (itemIndex >= count) return <div className="wardrobe-empty" key={index} aria-hidden="true" />;
          if (tab === 'garment') {
            const garment = content.garments[itemIndex];
            const owned = state.closet.unlockedGarmentIds.includes(garment.id);
            return <button key={garment.id} className={`wardrobe-card ${garment.id === draft.garmentId ? 'is-selected' : ''}`} disabled={!owned} aria-pressed={garment.id === draft.garmentId} onClick={() => onGarment(garment)} title={garment.name}>
              <GarmentPreview garment={garment} colors={garment.defaultColorPalette} /><span>{garment.name}</span>{!owned && <small>Chưa mở khóa</small>}
            </button>;
          }
          if (tab === 'color') {
            const palette = palettes[itemIndex];
            return <button key={palette.name} className={`wardrobe-card ${samePalette(palette) ? 'is-selected' : ''}`} aria-label={`Thử màu ${palette.name}`} aria-pressed={samePalette(palette)} onClick={() => onColor(palette)}>
              <GarmentPreview garment={content.garmentsById.get(draft.garmentId)!} colors={palette.colors} /><span>{palette.name}</span>
            </button>;
          }
          const accessory = accessories[itemIndex];
          const owned = state.closet.unlockedAccessoryIds.includes(accessory.id);
          const selected = Object.values(draft.equippedAccessories).includes(accessory.id);
          return <button key={accessory.id} className={`wardrobe-card ${selected ? 'is-selected' : ''}`} disabled={!owned} aria-pressed={selected} onClick={() => onAccessory(accessory.id)} title={accessory.name}>
            <img src={asset(accessoryAsset(accessory.id, true))} alt="" /><span>{accessory.name}</span>{!owned && <small>Chưa sở hữu</small>}
          </button>;
        })}
      </div>
      <div className="wardrobe-colors"><strong>Màu sắc</strong><div>{palettes.map(palette => <button key={palette.name} aria-label={palette.name} aria-pressed={samePalette(palette)} title={palette.name} style={{ '--swatch': palette.colors[1] } as CSSProperties} onClick={() => onColor(palette)} />)}</div></div>
    </div></div>
  </section>;
}
