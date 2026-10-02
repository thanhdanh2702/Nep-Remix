import { useEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import { AN, accessoryAsset, garmentAsset, loadImage, type Direction } from './assets';

export const studioViews: { direction: Direction; label: string; filename: string }[] = [
  { direction: 'down', label: 'Chính diện', filename: 'chinh-dien' },
  { direction: 'left', label: 'Nghiêng trái', filename: 'nghieng-trai' },
  { direction: 'up', label: 'Sau lưng', filename: 'sau-lung' },
  { direction: 'right', label: 'Nghiêng phải', filename: 'nghieng-phai' },
];

// Reuse An's directional idle poses, with the selected modular clothing on top.
// No animation clock or world movement is involved in the fitting room.
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
    const paths = [...nativePaths, garmentAsset(draft.garmentId), ...accessories.map(([, id]) => accessoryAsset(id))];
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
      const colors = draft.colorPalette.map(hex => {
        const full = hex.length === 4 ? '#' + hex.slice(1).split('').map(c => c + c).join('') : hex;
        return [1, 3, 5].map(start => parseInt(full.slice(start, start + 2), 16));
      });
      const drawNative = (name: string) => {
        const img = images[nativeLayers.indexOf(name)];
        if (name.startsWith('outfit_')) {
          // Directional sleeve/side panels fill the gaps between the adult
          // garment pattern and An's idle pose, using the selected fabric.
          const layer = document.createElement('canvas');
          layer.width = AN.cellWidth; layer.height = AN.cellHeight;
          const layerCtx = layer.getContext('2d')!;
          layerCtx.drawImage(img, index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
            AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
          const pixels = layerCtx.getImageData(0, 0, layer.width, layer.height);
          for (let p = 0; p < pixels.data.length; p += 4) {
            if (!pixels.data[p + 3]) continue;
            const rgb = [pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]];
            const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
            if (brightness > 65 && Math.max(...rgb) - Math.min(...rgb) < 65) {
              const color = colors[brightness > 220 ? 0 : brightness > 160 ? 1 : brightness > 105 ? 2 : 3];
              color.forEach((value, channel) => { pixels.data[p + channel] = value; });
            }
          }
          layerCtx.putImageData(pixels, 0, 0);
          ctx.drawImage(layer, 0, 0);
          return;
        }
        ctx.drawImage(img, index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
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

      const garment = document.createElement('canvas');
      garment.width = 64; garment.height = 96;
      const garmentCtx = garment.getContext('2d')!;
      garmentCtx.drawImage(images[nativePaths.length], 0, 0);
      const pixels = garmentCtx.getImageData(0, 0, 64, 96);
      const keys = [224, 158, 97, 33];
      for (let p = 0; p < pixels.data.length; p += 4) {
        if (!pixels.data[p + 3]) continue;
        const color = keys.indexOf(pixels.data[p]);
        if (color >= 0 && pixels.data[p] === pixels.data[p + 1] && pixels.data[p] === pixels.data[p + 2]) {
          colors[color].forEach((value, channel) => { pixels.data[p + channel] = value; });
        }
      }
      garmentCtx.putImageData(pixels, 0, 0);
      // The modular garments use an adult 64×96 base. Map their torso and hem
      // separately onto An's shorter body; side views share the same garment.
      const side = direction === 'left' || direction === 'right';
      const width = side ? 96 : 176;
      const center = 88 + (direction === 'left' ? -7 : direction === 'right' ? 7 : 0);
      ctx.drawImage(garment, 0, 24, 64, 30, center - width / 2, 126, width, 126);
      ctx.drawImage(garment, 0, 54, 64, 38, center - width / 2, 252, width, 142);
      nativeLayers.slice(8).forEach(name => {
        drawNative(name);
        if (direction === 'up' && name === 'face') drawNative('hair_back');
      });

      accessories.forEach(([slot], i) => {
        // Handheld objects and front necklaces are hidden behind the wearer.
        if (direction === 'up' && (slot === 'handheld' || slot === 'jewelry')) return;
        const img = images[nativePaths.length + 1 + i];
        const accessoryWidth = side ? 92 : 176;
        const x = center - accessoryWidth / 2;
        ctx.drawImage(img, 0, 0, 64, 24, x, 0, accessoryWidth, 126);
        ctx.drawImage(img, 0, 24, 64, 30, x, 126, accessoryWidth, 126);
        ctx.drawImage(img, 0, 54, 64, 42, x, 252, accessoryWidth, 164);
      });
      canvas.dataset.ready = 'true';
      setError('');
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [draft, direction, preset]);
  const view = studioViews.find(view => view.direction === direction)!;
  return <div className="paperdoll-wrap studio-character-wrap">
    <canvas ref={ref} id={id} className="paperdoll studio-character" width={AN.cellWidth} height={AN.cellHeight}
      data-direction={direction} data-foot-ratio={AN.anchor.y / AN.cellHeight}
      aria-label={`An mặc bộ trang phục đang phối, ${(label ?? view.label).toLowerCase()}`} />
    {error && <p role="alert">{error}</p>}
  </div>;
}
