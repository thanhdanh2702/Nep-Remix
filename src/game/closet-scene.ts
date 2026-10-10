import { useLayoutEffect, useState, type RefObject } from 'react';
import { AN, assetInfo } from './assets';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

// Position An on the painted rug. Background and avatar share a single scene scale;
// cabinet controls retain their own readable, responsive dimensions.
export function useClosetScene(ref: RefObject<HTMLDivElement | null>) {
  const [pageSize, setPageSize] = useState(6);
  useLayoutEffect(() => {
    const container = ref.current!, image = container.querySelector<HTMLImageElement>('.room-background img')!;
    const align = () => {
      const art = assetInfo['assets/screens/wardrobe/wardrobe-room--landscape.png'];
      const imageW = image.naturalWidth || art?.width, imageH = image.naturalHeight || art?.height;
      if (!imageW || !imageH) return;
      const w = container.clientWidth, h = container.clientHeight;
      const cabinet = container.querySelector<HTMLElement>('.closet-cabinet')!;
      const nav = container.closest('.nep-app')?.querySelector('.room-navigation') ?? container.closest('.app-shell')?.querySelector('.main-nav');
      const minTop = (nav ? nav.getBoundingClientRect().bottom - container.getBoundingClientRect().top : 64) + 12;
      const phone = w <= 640, backgroundHeight = phone ? cabinet.offsetTop : h;
      const scale = Math.max(w / imageW, backgroundHeight / imageH);
      const artW = imageW * scale, artH = imageH * scale;
      const x = phone ? w / 2 : w * .285;
      const left = clamp(x - artW * .285, w - artW, 0), top = (backgroundHeight - artH) / 2;
      const feet = Math.min(top + artH * (phone ? .80 : .785), (phone ? cabinet.offsetTop : h) - (phone ? 80 : 94));
      const height = Math.floor(clamp(artH * .40, 48, Math.min(416, (feet - minTop) / (AN.anchor.y / AN.cellHeight))));
      const values = { 'art-w': artW, 'art-h': artH, 'art-left': left, 'art-top': top, 'model-x': x, 'model-top': Math.round(feet - height * AN.anchor.y / AN.cellHeight), 'character-h': height };
      Object.entries(values).forEach(([key, value]) => container.style.setProperty(`--closet-${key}`, `${value}px`));
      setPageSize(phone ? 2 : h < 500 ? 3 : 6);
    };
    const observer = new ResizeObserver(align); observer.observe(container);
    observer.observe(container.querySelector<HTMLElement>('.closet-cabinet')!);
    image.addEventListener('load', align); align();
    return () => { observer.disconnect(); image.removeEventListener('load', align); };
  }, [ref]);
  return pageSize;
}
