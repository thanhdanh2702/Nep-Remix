import { useEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import { AN, accessoryAsset, garmentAsset, loadImage, type Direction } from './assets';

export const studioViews: { direction: Direction; label: string; filename: string }[] = [
  { direction: 'down', label: 'Chính diện', filename: 'chinh-dien' },
  { direction: 'left', label: 'Nghiêng trái', filename: 'nghieng-trai' },
  { direction: 'up', label: 'Sau lưng', filename: 'sau-lung' },
  { direction: 'right', label: 'Nghiêng phải', filename: 'nghieng-phai' },
];

// 64×96 modular garments are true pixel art. They are drawn as ONE band onto An's
// painted body with whole-number factors so every cloth pixel is an even block.
const GARMENT_BAND = { sy: 24, sh: 68 };
const FRONT_X = 3, SIDE_X = 2, FACTOR_Y = 4;
const GARMENT_TOP = 126; // where source row GARMENT_BAND.sy lands on An's cell
// Horizontal centres measured from An's sprite layers (outfit/skirt, head, shoes) per view;
// headwear and neck pieces follow the head, shoes follow the feet, everything else the garment.
const ANCHOR_X: Record<Direction, { garment: number; head: number; feet: number }> = {
  down: { garment: 94, head: 94, feet: 95 }, up: { garment: 94, head: 93, feet: 91 },
  left: { garment: 81, head: 83, feet: 72 }, right: { garment: 95, head: 92, feet: 104 },
};
// Accessory art shares the garment's origin by default; hats and shoes sit where An's head and feet are.
const ACCESSORY_TOP: Record<string, number> = { headwear: 13, footwear: 20 };
const KEYS = [224, 158, 97, 33];
const CACHE_LIMIT = 40;
// Recolored layers are cached (LRU, ~40 each) so changing outfit/colour repaints without
// re-scanning pixels. Small garment layers and large 176×416 outfit layers keep separate caches
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

/** Recolor a 64×96 garment layer (grey ramp 224/158/97/33 -> the four palette colors). Cached by path + palette. */
export function recolorLayer(image: HTMLImageElement, path: string, palette: readonly string[]) {
  return remember(garmentCache, `${path}|${palette.join('')}`, () => {
    const layer = document.createElement('canvas'); layer.width = 64; layer.height = 96;
    const ctx = layer.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, 64, 96);
    const colors = parsePalette(palette);
    for (let p = 0; p < pixels.data.length; p += 4) {
      if (!pixels.data[p + 3]) continue;
      const color = KEYS.indexOf(pixels.data[p]);
      if (color >= 0 && pixels.data[p] === pixels.data[p + 1] && pixels.data[p] === pixels.data[p + 2]) {
        colors[color].forEach((value, channel) => { pixels.data[p + channel] = value; });
      }
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
    const accessories = Object.entries(draft.equippedAccessories).filter((entry): entry is [string, string] => Boolean(entry[1]));
    const garmentPath = garmentAsset(draft.garmentId);
    const paths = [...nativePaths, garmentPath, ...accessories.map(([, id]) => accessoryAsset(id))];
    const canvas = ref.current!;
    canvas.dataset.ready = 'false';
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled) return;
      if (images.slice(0, nativePaths.length).some(img => img.width !== AN.columns * AN.cellWidth || img.height !== AN.rows * AN.cellHeight)) {
        throw new Error('Không thể ghép các hướng nhìn của An.');
      }
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const index = AN.directions[direction];
      const drawNative = (name: string) => {
        const at = nativeLayers.indexOf(name);
        if (name.startsWith('outfit_')) { ctx.drawImage(outfitLayer(images[at], nativePaths[at], index, draft.colorPalette), 0, 0); return; }
        ctx.drawImage(images[at], index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
          AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
      };
      nativeLayers.slice(0, 8).forEach(name => {
        if (direction === 'up' && name === 'hair_back') return;
        if (name === 'body') {
          // The native bare arms use a different pose from the modular sleeves.
          // Keep the neck; the chosen garment supplies the torso and sleeves.
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, AN.cellWidth, 151); ctx.clip();
          drawNative(name); ctx.restore();
        } else drawNative(name);
      });

      // One continuous band, whole-number factors, centred on An's body centre.
      // Side views use a narrower factor; smoothing stays off for the pixel layer.
      const side = direction === 'left' || direction === 'right';
      const factor = side ? SIDE_X : FRONT_X;
      const left = (x: number) => x - 64 * factor / 2;
      ctx.drawImage(recolorLayer(images[nativePaths.length], garmentPath, draft.colorPalette),
        0, GARMENT_BAND.sy, 64, GARMENT_BAND.sh, left(ANCHOR_X[direction].garment), GARMENT_TOP, 64 * factor, GARMENT_BAND.sh * FACTOR_Y);
      nativeLayers.slice(8).forEach(name => {
        drawNative(name);
        if (direction === 'up' && name === 'face') drawNative('hair_back');
      });

      accessories.forEach(([slot], i) => {
        // Handheld objects and front necklaces are hidden behind the wearer.
        if (direction === 'up' && (slot === 'handheld' || slot === 'jewelry')) return;
        // Same whole-number factors as the garment; only the anchor differs per slot.
        const anchor = ANCHOR_X[direction][slot === 'headwear' || slot === 'jewelry' ? 'head' : slot === 'footwear' ? 'feet' : 'garment'];
        ctx.drawImage(images[nativePaths.length + 1 + i], 0, 0, 64, 96,
          left(anchor), ACCESSORY_TOP[slot] ?? GARMENT_TOP - GARMENT_BAND.sy * FACTOR_Y, 64 * factor, 96 * FACTOR_Y);
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
