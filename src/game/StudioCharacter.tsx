import { useEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import { AN, accessoryAsset, assetRegistry, garmentAsset, loadImage, type Direction } from './assets';

export const studioViews: { direction: Direction; label: string; filename: string }[] = [
  { direction: 'down', label: 'Chính diện', filename: 'chinh-dien' },
  { direction: 'left', label: 'Nghiêng trái', filename: 'nghieng-trai' },
  { direction: 'up', label: 'Sau lưng', filename: 'sau-lung' },
  { direction: 'right', label: 'Nghiêng phải', filename: 'nghieng-phai' },
];

// Garments and accessories follow An's spec: a 528×416 strip of three 176×416 cells (front, side facing
// left, back) on An's own frame, so each cell is drawn 1:1 over her cell. `right` mirrors the side cell.
const STRIP_W = AN.cellWidth * 3;
const stripCell = (direction: Direction) => direction === 'down' ? 0 : direction === 'up' ? 2 : 1;
const CACHE_LIMIT = 40;
// Recolored layers are cached (LRU, ~40 each) so changing outfit/colour repaints without
// re-scanning pixels. Garment strips and An's own 176×416 outfit layers keep separate caches
// so the many wardrobe previews cannot evict the layers the model is using.
const garmentCache = new Map<string, HTMLCanvasElement>();
const outfitCache = new Map<string, HTMLCanvasElement>();

function remember(cache: Map<string, HTMLCanvasElement>, key: string, build: () => HTMLCanvasElement) {
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
  const made = build();
  cache.set(key, made);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return made;
}

function parsePalette(palette: readonly string[]) {
  return palette.map(hex => {
    const full = hex.length === 4 ? '#' + hex.slice(1).split('').map(c => c + c).join('') : hex;
    return [1, 3, 5].map(start => parseInt(full.slice(start, start + 2), 16));
  });
}

/** Gradient-map a grayscale garment strip: luminance runs through the palette dark -> light (the palette
 *  is stored light -> dark), alpha untouched. Returns the whole 528×416 strip. Cached by path + palette. */
export function recolorLayer(image: HTMLImageElement, path: string, palette: readonly string[]) {
  return remember(garmentCache, `${path}|${palette.join('')}`, () => {
    const layer = document.createElement('canvas'); layer.width = STRIP_W; layer.height = AN.cellHeight;
    const ctx = layer.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, layer.width, layer.height);
    const stops = parsePalette(palette).reverse();
    // 256-entry ramp: linear blend between the four stops keeps soft shading smooth.
    const ramp = Array.from({ length: 256 }, (_, v) => {
      const at = v / 255 * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(at)), f = at - i;
      return stops[i].map((c, ch) => Math.round(c + (stops[i + 1][ch] - c) * f));
    });
    const data = pixels.data;
    for (let p = 0; p < data.length; p += 4) {
      if (!data[p + 3]) continue;
      const color = ramp[Math.round(0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2])];
      data[p] = color[0]; data[p + 1] = color[1]; data[p + 2] = color[2];
    }
    ctx.putImageData(pixels, 0, 0);
    return layer;
  });
}

// Directional sleeve/side panels fill the gaps between the adult garment pattern
// and An's idle pose, using the selected fabric. Cached by path + direction + palette.
function outfitLayer(image: HTMLImageElement, path: string, index: number, palette: readonly string[]) {
  return remember(outfitCache, `${path}|${index}|${palette.join('')}`, () => {
    const layer = document.createElement('canvas');
    layer.width = AN.cellWidth; layer.height = AN.cellHeight;
    const ctx = layer.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(image, index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
      AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
    const pixels = ctx.getImageData(0, 0, layer.width, layer.height);
    const colors = parsePalette(palette);
    const data = pixels.data;
    for (let p = 0; p < data.length; p += 4) {
      if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const brightness = (r + g + b) / 3;
      // Only greyish pixels (the neutral fabric ramp) are recolored; skin, hair and trim keep their hue.
      if (brightness > 65 && Math.max(r, g, b) - Math.min(r, g, b) < 65) {
        const color = colors[brightness > 220 ? 0 : brightness > 160 ? 1 : brightness > 105 ? 2 : 3];
        data[p] = color[0]; data[p + 1] = color[1]; data[p + 2] = color[2];
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return layer;
  });
}

// Reuse An's directional idle poses, with the selected modular clothing on top.
// No animation clock or world movement is involved in the fitting room. The canvas
// keeps An's native 176×416 backing store; CSS only ever shows it at or below that size.
export function StudioCharacter({ draft, direction, preset, id = 'paperdoll', label }: {
  draft: StudioDraft; direction: Direction; preset: string; id?: string; label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const nativeLayers = ['shadow', 'hair_back', 'outfit_back', 'legs', 'shoes', 'body', 'bottom', 'outfit_main', 'head', 'face', 'hair_front', 'hands'];
    const nativePaths = nativeLayers.map(layer => `assets/characters/an/${
      preset.includes('bob') && layer.startsWith('hair_') ? `${layer}__bob` : layer
    }.png`);
    // Garment and accessory layers are being regenerated to An's spec; until one ships, An keeps
    // her own (recoloured) outfit and the missing accessory is simply not drawn.
    const accessories = Object.entries(draft.equippedAccessories)
      .filter((entry): entry is [string, string] => Boolean(entry[1]) && Boolean(assetRegistry[accessoryAsset(entry[1]!)]));
    const garmentPath = garmentAsset(draft.garmentId);
    const modular = Boolean(assetRegistry[garmentPath]);
    const paths = [...nativePaths, ...(modular ? [garmentPath] : []), ...accessories.map(([, id]) => accessoryAsset(id))];
    const canvas = ref.current!;
    canvas.dataset.ready = 'false';
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled) return;
      if (images.slice(0, nativePaths.length).some(img => img.width !== AN.columns * AN.cellWidth || img.height !== AN.rows * AN.cellHeight)) {
        throw new Error('Không thể ghép các hướng nhìn của An.');
      }
      for (const strip of images.slice(nativePaths.length)) {
        if (strip.width !== STRIP_W || strip.height !== AN.cellHeight) throw new Error('Lớp trang phục không đúng dải 528 × 416.');
      }
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false; // every layer is blitted 1:1 on An's grid
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const index = AN.directions[direction];
      const drawNative = (name: string) => {
        const at = nativeLayers.indexOf(name);
        if (name.startsWith('outfit_')) { ctx.drawImage(outfitLayer(images[at], nativePaths[at], index, draft.colorPalette), 0, 0); return; }
        ctx.drawImage(images[at], index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
          AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
      };
      // A strip cell sits exactly on An's cell; `right` is the side cell flipped about the cell centre.
      const drawStrip = (strip: CanvasImageSource) => {
        ctx.save();
        if (direction === 'right') { ctx.translate(AN.cellWidth, 0); ctx.scale(-1, 1); }
        ctx.drawImage(strip, stripCell(direction) * AN.cellWidth, 0, AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
        ctx.restore();
      };
      // A modular garment replaces An's own outfit layers.
      nativeLayers.slice(0, 8).forEach(name => {
        if (direction === 'up' && name === 'hair_back') return;
        if (modular && name.startsWith('outfit_')) return;
        drawNative(name);
      });
      if (modular) drawStrip(recolorLayer(images[nativePaths.length], garmentPath, draft.colorPalette));
      const firstAccessory = nativePaths.length + (modular ? 1 : 0);
      nativeLayers.slice(8).forEach(name => {
        drawNative(name);
        if (direction === 'up' && name === 'face') drawNative('hair_back');
      });

      accessories.forEach(([slot], i) => {
        // Handheld objects and front necklaces are hidden behind the wearer.
        if (direction === 'up' && (slot === 'handheld' || slot === 'jewelry')) return;
        drawStrip(images[firstAccessory + i]);
      });
      canvas.dataset.ready = 'true';
      setError('');
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [draft, direction, preset]);
  const view = studioViews.find(view => view.direction === direction)!;
  return <div className="studio-character-wrap">
    <canvas ref={ref} id={id} className="studio-character art-hires" width={AN.cellWidth} height={AN.cellHeight}
      role="img" data-direction={direction} data-foot-ratio={AN.anchor.y / AN.cellHeight}
      aria-label={`An mặc bộ trang phục đang phối, ${(label ?? view.label).toLowerCase()}`} />
    {error && <p role="alert">{error}</p>}
  </div>;
}
