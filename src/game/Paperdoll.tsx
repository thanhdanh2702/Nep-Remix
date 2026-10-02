import { useEffect, useRef, useState } from 'react';
import type { StudioDraft } from '../core';
import { accessoryAsset, garmentAsset, loadImage } from './assets';

export function Paperdoll({ draft, id = 'paperdoll', onReady }: { draft: StudioDraft; id?: string; onReady?: (canvas: HTMLCanvasElement) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const base = (name: string) => `assets/paperdoll/${name}.png`;
    const paths = [base('layer-0-shadow'), base('hair-long-female-back'), base('body-female'), base('pants-female-black'), garmentAsset(draft.garmentId), base('face-neutral'), base('hair-long-female-front'), ...Object.values(draft.equippedAccessories).filter(Boolean).map(id => accessoryAsset(id!))];
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled) return;
      if (images.some(img => img.naturalWidth !== 64 || img.naturalHeight !== 96)) throw new Error('Lớp paperdoll không cùng canvas 64 × 96. Không thể ghép trang phục này.');
      const ctx = ref.current!.getContext('2d')!;
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0,0,64,96);
      images.forEach((img, i) => {
        if (i !== 4) { ctx.drawImage(img,0,0); return; }
        const layer = document.createElement('canvas'); layer.width = 64; layer.height = 96;
        const layerCtx = layer.getContext('2d')!; layerCtx.imageSmoothingEnabled = false; layerCtx.drawImage(img,0,0);
        const pixels = layerCtx.getImageData(0,0,64,96);
        const keys = [224,158,97,33];
        const colors = draft.colorPalette.map(hex => { const full = hex.length === 4 ? '#'+hex.slice(1).split('').map(c=>c+c).join('') : hex; return [1,3,5].map(start => parseInt(full.slice(start,start+2),16)); });
        for (let p = 0; p < pixels.data.length; p += 4) {
          if (!pixels.data[p+3]) continue;
          const index = keys.indexOf(pixels.data[p]);
          if (index >= 0 && pixels.data[p] === pixels.data[p+1] && pixels.data[p] === pixels.data[p+2]) colors[index].forEach((v,c)=> { pixels.data[p+c]=v; });
        }
        layerCtx.putImageData(pixels,0,0); ctx.drawImage(layer,0,0);
      });
      setError(''); onReady?.(ref.current!);
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [draft, onReady]);
  return <div className="paperdoll-wrap"><canvas ref={ref} id={id} className="paperdoll" width={64} height={96} aria-label="An mặc bộ trang phục đang phối, góc chính diện" />{error && <p role="alert">{error}</p>}</div>;
}
