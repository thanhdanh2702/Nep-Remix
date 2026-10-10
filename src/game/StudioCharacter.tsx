import { useEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import { AN, accessoryAsset, assetRegistry, garmentAsset, loadImage, studioBottomAsset, type Direction } from './assets';

export const studioViews: { direction: Direction; label: string; filename: string }[] = [
  { direction: 'down', label: 'Chính diện', filename: 'chinh-dien' },
  { direction: 'left', label: 'Nghiêng trái', filename: 'nghieng-trai' },
  { direction: 'up', label: 'Sau lưng', filename: 'sau-lung' },
  { direction: 'right', label: 'Nghiêng phải', filename: 'nghieng-phai' },
];

// Garments have a 3-view strip plus a separate right view, registered on An's own frame.
// Legacy accessories may still use the mirrored side cell until their right view ships.
const STRIP_W = AN.cellWidth * 3;
const stripCell = (direction: Direction) => direction === 'down' ? 0 : direction === 'up' ? 2 : 1;
const CACHE_LIMIT = 40;
// Recolored layers are cached (LRU, ~40 each) so changing outfit/colour repaints without
// re-scanning pixels. Garment strips and An's own 176×416 outfit layers keep separate caches
// so the many wardrobe previews cannot evict the layers the model is using.
const garmentCache = new Map<string, HTMLCanvasElement>();
const outfitCache = new Map<string, HTMLCanvasElement>();
const handCache = new Map<number, HTMLCanvasElement>();
// Native shoe cells also contain the old trouser hem line (and side-view floor strokes).
// Keep the actual feet when the narrower studio trousers replace that old silhouette.
const shoeBounds: Record<Direction, [number, number, number, number]> = {
  down: [66, 377, 64, 21], up: [66, 377, 64, 21],
  left: [37, 381, 75, 17], right: [64, 381, 75, 17],
};
export const defaultSkirtPalette = ['#85879A', '#4A4B60', '#292B40', '#101121'] as const;
export const defaultTrouserPalette = ['#625A68', '#3A3342', '#241D2A', '#110D17'] as const;

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

/** Shared fabric mapping for worn layers and hanging previews; coloured trim keeps its hue. */
export function recolorLayer(image: HTMLImageElement, path: string, palette: readonly string[]) {
  return remember(garmentCache, `${path}|${palette.join('')}`, () => {
    const layer = document.createElement('canvas'); layer.width = image.width; layer.height = image.height;
    const ctx = layer.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, layer.width, layer.height);
    const stops = parsePalette(palette).reverse();
    const data = pixels.data;
    for (let p = 0; p < data.length; p += 4) {
      if (!data[p + 3]) continue;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) > 18) continue;
      const at = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(at)), f = at - i;
      for (let ch = 0; ch < 3; ch++) data[p + ch] = Math.round(stops[i][ch] * (1 - f) + stops[i + 1][ch] * f);
    }
    ctx.putImageData(pixels, 0, 0);
    return layer;
  });
}

// Recolour An's original outfit and trousers without tinting skin or ornaments.
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
      if (path.endsWith('/bottom.png')) {
        // An's native trousers use a dark fabric ramp, unlike the pale blouse. Map that whole ramp.
        const at = Math.min(3, Math.max(0, (brightness - 12) / 85) * 3), low = Math.min(2, Math.floor(at)), f = at - low;
        for (let ch = 0; ch < 3; ch++) data[p + ch] = Math.round(colors[3 - low][ch] * (1 - f) + colors[2 - low][ch] * f);
        continue;
      }
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

/** Native hand sprites include small remnants of the original embroidered cuffs. */
function bareHands(image: HTMLImageElement, index: number) {
  const hit = handCache.get(index);
  if (hit) return hit;
  const layer = document.createElement('canvas');
  layer.width = AN.cellWidth; layer.height = AN.cellHeight;
  const ctx = layer.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
    AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
  const pixels = ctx.getImageData(0, 0, layer.width, layer.height), data = pixels.data;
  const skin = new Uint8Array(layer.width * layer.height), keep = new Uint8Array(skin.length);
  for (let p = 0; p < skin.length; p++) {
    const at = p * 4;
    skin[p] = Number(data[at + 3] > 32 && data[at] > 115 && data[at] - data[at + 1] > 25 && data[at + 1] - data[at + 2] > 5);
  }
  // Keep connected skin regions, excluding isolated gold embroidery flecks.
  for (let start = 0; start < skin.length; start++) {
    if (!skin[start]) continue;
    const region = [start]; skin[start] = 0;
    for (let i = 0; i < region.length; i++) {
      const p = region[i], x = p % layer.width, y = Math.floor(p / layer.width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= layer.width || ny < 0 || ny >= layer.height) continue;
        const next = ny * layer.width + nx;
        if (skin[next]) { skin[next] = 0; region.push(next); }
      }
    }
    if (region.length < 16) continue;
    for (const p of region) {
      const x = p % layer.width, y = Math.floor(p / layer.width);
      // Retain the original one-pixel dark hand contour and antialiasing.
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= layer.width || ny < 0 || ny >= layer.height) continue;
        const next = ny * layer.width + nx, at = next * 4;
        const darkContour = (data[at] + data[at + 1] + data[at + 2]) / 3 < 125;
        const warmSkin = data[at] - data[at + 1] > 25 && data[at + 1] - data[at + 2] > 5;
        if (darkContour || warmSkin) keep[next] = 1;
      }
    }
  }
  for (let p = 0; p < keep.length; p++) if (!keep[p]) data[p * 4 + 3] = 0;
  ctx.putImageData(pixels, 0, 0);
  handCache.set(index, layer);
  return layer;
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
    // Legacy accessory drafts may still lack a wearable; registered hats use full An frames.
    const accessories = Object.entries(draft.equippedAccessories)
      .filter((entry): entry is [string, string] => Boolean(entry[1]) && Boolean(assetRegistry[accessoryAsset(entry[1]!)]));
    const garmentBase = garmentAsset(draft.garmentId);
    const rightPath = garmentBase.replace('.png', '--right.png');
    const garmentPath = direction === 'right' && assetRegistry[rightPath] ? rightPath : garmentBase;
    const modular = Boolean(assetRegistry[garmentPath]);
    const neckPath = `assets/characters/an/studio-neck${direction === 'right' ? '--right' : ''}.png`;
    const cleanNeck = modular && Boolean(assetRegistry[neckPath]);
    const bottom = studioBottomAsset(draft.garmentId, direction);
    const bottomPath = bottom.native ? undefined : bottom.path;
    const paths = [...nativePaths, ...(modular ? [garmentPath] : []), ...(cleanNeck ? [neckPath] : []), ...(bottomPath ? [bottomPath] : []), ...accessories.map(([, id]) => accessoryAsset(id))];
    const canvas = ref.current!;
    canvas.dataset.ready = 'false';
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled) return;
      if (images.slice(0, nativePaths.length).some(img => img.width !== AN.columns * AN.cellWidth || img.height !== AN.rows * AN.cellHeight)) {
        throw new Error('Không thể ghép các hướng nhìn của An.');
      }
      const loaded = Object.fromEntries(paths.map((path, i) => [path, images[i]]));
      for (const strip of images.slice(nativePaths.length)) {
        if (![STRIP_W, AN.cellWidth].includes(strip.width) || strip.height !== AN.cellHeight) throw new Error('Lớp trang phục không khớp khung An.');
      }
      // Keep compositing deterministic between the frequently-read Studio previews
      // and a freshly opened Closet canvas (GPU premultiplied-alpha rounding differs).
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.imageSmoothingEnabled = false; // every layer is blitted 1:1 on An's grid
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const index = AN.directions[direction];
      const drawNative = (name: string) => {
        const at = nativeLayers.indexOf(name);
        if (name === 'hands' && modular) { ctx.drawImage(bareHands(images[at], index), 0, 0); return; }
        if (name.startsWith('outfit_')) { ctx.drawImage(outfitLayer(images[at], nativePaths[at], index, draft.colorPalette), 0, 0); return; }
        if (name === 'bottom' && draft.bottomPalette) { ctx.drawImage(outfitLayer(images[at], nativePaths[at], index, draft.bottomPalette), 0, 0); return; }
        const cleanShoes = name === 'shoes' && bottomPath && bottom.kind === 'trousers';
        if (cleanShoes) { ctx.save(); ctx.beginPath(); ctx.rect(...shoeBounds[direction]); ctx.clip(); }
        ctx.drawImage(images[at], index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
          AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
        if (cleanShoes) ctx.restore();
      };
      // Standalone right views are drawn directly, so asymmetric closures never change sides.
      const drawStrip = (strip: HTMLCanvasElement | HTMLImageElement) => {
        const single = strip.width === AN.cellWidth;
        ctx.save();
        if (direction === 'right' && !single) { ctx.translate(AN.cellWidth, 0); ctx.scale(-1, 1); }
        ctx.drawImage(strip, single ? 0 : stripCell(direction) * AN.cellWidth, 0, AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
        ctx.restore();
      };
      // A modular garment replaces An's own outfit layers.
      nativeLayers.slice(0, 8).forEach(name => {
        if (direction === 'up' && name === 'hair_back') return;
        if (modular && name.startsWith('outfit_')) return;
        if (bottomPath && name === 'bottom') return;
        // The trouser hems cover the ankles; native bare-leg pixels belong to the old outfit.
        if (bottomPath && bottom.kind === 'trousers' && name === 'legs') return;
        drawNative(name);
        if (name === 'body' && cleanNeck) drawStrip(loaded[neckPath]);
      });
      if (bottomPath) drawStrip(recolorLayer(loaded[bottomPath], bottomPath, draft.bottomPalette ??
        (bottom.kind === 'skirt' ? defaultSkirtPalette : defaultTrouserPalette)));
      if (modular) drawStrip(recolorLayer(loaded[garmentPath], garmentPath, draft.colorPalette));
      nativeLayers.slice(8).forEach(name => {
        if (name === 'hands' && modular && draft.garmentId === 'ao-ngu-than-tay-thung') return;
        drawNative(name);
        if (direction === 'up' && name === 'face') drawNative('hair_back');
      });

      accessories.forEach(([slot], i) => {
        // Handheld objects and front necklaces are hidden behind the wearer.
        if (direction === 'up' && (slot === 'handheld' || slot === 'jewelry')) return;
        drawStrip(loaded[accessoryAsset(accessories[i][1])]);
      });
      canvas.dataset.garmentLayer = modular ? garmentPath : 'native';
      canvas.dataset.bottomKind = bottom.kind;
      canvas.dataset.bottomLayer = bottom.path;
      canvas.dataset.accessoryLayers = JSON.stringify(accessories.map(([, id]) => accessoryAsset(id)));
      canvas.dataset.outfit = JSON.stringify({ garmentId: draft.garmentId, colors: draft.colorPalette, bottom: draft.bottomPalette, accessories: draft.equippedAccessories });
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
