import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import { AN, assetRegistry, garmentAsset, loadImage, studioBottomAsset } from './assets';
import { recolorLayer } from './StudioCharacter';
import './clothing-preview.css';

const previewCache = new Map<string, HTMLCanvasElement>();

function preview(image: HTMLImageElement, path: string, colors: readonly string[], nativeBottom: boolean) {
  const key = `${path}|${colors.join(',')}`;
  const hit = previewCache.get(key); if (hit) return hit;
  // The same gradient mapper colours the actual worn garment and this hanging version.
  const colored = nativeBottom ? null : recolorLayer(image, path, colors);
  const frame = document.createElement('canvas');
  frame.width = nativeBottom ? AN.cellWidth : image.width === AN.cellWidth * 3 ? AN.cellWidth : image.width;
  frame.height = image.height === AN.rows * AN.cellHeight ? AN.cellHeight : image.height;
  const ctx = frame.getContext('2d', { willReadFrequently: true })!;
  if (nativeBottom) {
    // Native trousers have a dark ramp; keep the original trouser palette behaviour.
    ctx.drawImage(image, 0, 0, frame.width, frame.height, 0, 0, frame.width, frame.height);
    const pixels = ctx.getImageData(0, 0, frame.width, frame.height), data = pixels.data;
    const stops = colors.map(hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16))).reverse();
    for (let p = 0; p < data.length; p += 4) {
      if (!data[p + 3]) continue;
      const light = (data[p] + data[p + 1] + data[p + 2]) / 3;
      const at = Math.max(0, Math.min(1, (light - 12) / 85)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(at)), f = at - i;
      for (let ch = 0; ch < 3; ch++) data[p + ch] = Math.round(stops[i][ch] * (1 - f) + stops[i + 1][ch] * f);
    }
    ctx.putImageData(pixels, 0, 0);
  } else ctx.drawImage(colored!, 0, 0);
  const data = ctx.getImageData(0, 0, frame.width, frame.height).data;
  let x0 = frame.width, y0 = frame.height, x1 = 0, y1 = 0;
  for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) {
    if (data[(y * frame.width + x) * 4 + 3] < 24) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
  }
  const cropped = document.createElement('canvas'); cropped.width = Math.max(1, x1 - x0); cropped.height = Math.max(1, y1 - y0);
  cropped.getContext('2d')!.drawImage(frame, x0, y0, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  if (previewCache.size >= 60) previewCache.delete(previewCache.keys().next().value!);
  previewCache.set(key, cropped); return cropped;
}

export function ClothingPreview({ garment, colors, bottom = false, showHanger = true }: {
  garment: Garment; colors: StudioDraft['colorPalette']; bottom?: boolean;
  /** Hide only the decoration; retain the garment's size and placement. */
  showHanger?: boolean;
}) {
  const slot = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [artworkPending, setArtworkPending] = useState(false);
  useLayoutEffect(() => {
    const el = slot.current!, measure = () => { const box = el.getBoundingClientRect(); setSize({ width: box.width, height: box.height }); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(el); return () => observer.disconnect();
  }, []);
  const paletteKey = colors.join(',');
  useEffect(() => {
    if (!size.width || !size.height) return;
    let cancelled = false; const canvas = canvasRef.current!;
    const bottomAsset = studioBottomAsset(garment.id);
    const path = bottom ? bottomAsset.path
      : garmentAsset(garment.id).replace('.png', '--hanging.png');
    const nativeBottom = bottom && bottomAsset.native;
    setArtworkPending(false);
    canvas.dataset.ready = 'false';
    if (!assetRegistry[path]) { setArtworkPending(true); canvas.dataset.ready = 'error'; return; }
    loadImage(path).then(image => {
      if (cancelled) return;
      const artwork = preview(image, path, colors, nativeBottom);
      const availableHeight = Math.max(1, size.height - (bottom ? 0 : 18));
      const scale = Math.min(size.width / artwork.width, availableHeight / artwork.height);
      const w = Math.max(1, Math.floor(artwork.width * scale)), h = Math.max(1, Math.floor(artwork.height * scale)), dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(artwork, 0, 0, canvas.width, canvas.height);
      canvas.dataset.asset = path; canvas.dataset.ready = 'true';
    }).catch(() => { if (!cancelled) { canvas.dataset.ready = 'error'; setArtworkPending(true); } });
    return () => { cancelled = true; };
  }, [garment.id, paletteKey, bottom, size.width, size.height]);
  return <div className={`wardrobe-thumb ${bottom ? '' : 'wardrobe-hanging'}`} ref={slot}>
    {!bottom && showHanger && !artworkPending && <svg className="wardrobe-hanger" viewBox="0 0 80 32" aria-hidden="true"><path d="M35 8a5 5 0 1 1 8 4l-3 3v3L5 29h70L40 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    <canvas ref={canvasRef} className="wardrobe-garment art-hires" aria-hidden="true" hidden={artworkPending} />
    {artworkPending && <span className="garment-art-pending">Hiện đang hoàn thiện</span>}
  </div>;
}


