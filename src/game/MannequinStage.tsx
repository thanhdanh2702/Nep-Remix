import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { AN } from './assets';
import { characterScale } from './character-scale';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

// Stand An's feet on the rug/floor of the room art without covering the nav, the side
// panel or the wardrobe dock. Only the room container is observed (the stage itself
// resizes when we set its character height, so observing it would feed back).
export function MannequinStage({children,room}:{children:ReactNode;room:'studio'|'closet'}) {
  const ref=useRef<HTMLDivElement>(null);
  const alignRef=useRef<()=>void>(()=>{});
  useLayoutEffect(()=>{
    const stage=ref.current!;
    const container=stage.parentElement!;
    const image=container.querySelector<HTMLImageElement>('.room-background img')!;
    alignRef.current=()=>{
      const canvas=stage.querySelector<HTMLCanvasElement>('canvas.studio-character');
      if(!canvas||!image.naturalWidth)return;
      const w=container.clientWidth,h=container.clientHeight;
      const top=container.getBoundingClientRect().top;
      if (room === 'studio') {
        const dock = container.querySelector<HTMLElement>('.studio-wardrobe-dock')!;
        const tools = container.querySelector<HTMLElement>('.studio-tools')!;
        const lookbook = container.querySelector<HTMLElement>('.studio-lookbook')!;
        const short = h <= 440 && w > 640;
        const nav = container.closest('.nep-app')?.querySelector('.room-navigation') ?? container.closest('.app-shell')?.querySelector('.main-nav');
        const safeTop = Math.max(12, nav ? nav.getBoundingClientRect().bottom - top + 12 : 12);
        const floor = (short ? dock.offsetTop : tools.offsetTop) - 12;
        const captionHeight = stage.offsetHeight - canvas.offsetHeight;
        const height = Math.floor(clamp(floor - safeTop - captionHeight, 48, AN.cellHeight));
        const availableWidth = lookbook.offsetLeft - 16;
        const x = availableWidth * .52;
        stage.style.setProperty('--studio-character-height', `${height}px`);
        stage.style.left = `${Math.round(x - stage.offsetWidth / 2)}px`;
        stage.style.top = `${Math.round(floor - height - captionHeight)}px`;
        // The room and model use the same floor anchor; scale the art uniformly.
        const artHeight = image.parentElement!.clientHeight;
        const sceneScale = Math.max(w / image.naturalWidth, artHeight / image.naturalHeight);
        const artWidth = image.naturalWidth * sceneScale, scaledHeight = image.naturalHeight * sceneScale;
        const feet = floor - captionHeight - height * (1 - AN.anchor.y / AN.cellHeight);
        container.style.setProperty('--studio-scene-w', `${artWidth}px`);
        container.style.setProperty('--studio-scene-h', `${scaledHeight}px`);
        container.style.setProperty('--studio-scene-left', `${clamp(x - artWidth * .405, w - artWidth, 0)}px`);
        container.style.setProperty('--studio-scene-top', `${clamp(feet - scaledHeight * .80, artHeight - scaledHeight, 0)}px`);
        return;
      }
      const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
      const portrait=image.naturalWidth===320;
      const anchor=portrait?{x:160,y:250}:{x:300,y:430};
      const anchorX=(w-image.naturalWidth*scale)/2+anchor.x*scale;
      const anchorY=(h-image.naturalHeight*scale)/2+anchor.y*scale;
      const footRatio=Number(canvas.dataset.footRatio ?? AN.anchor.y/AN.cellHeight);

      // Free area: below the nav, above the dock (studio), left of the side panel.
      const nav=container.closest('.app-shell')?.querySelector('.main-nav');
      const minTop=(nav ? nav.getBoundingClientRect().bottom-top : 64)+8;
      const dock=container.querySelector<HTMLElement>('.studio-wardrobe-dock');
      let bottomLimit=(dock ? dock.offsetTop : h)-8;
      let rightLimit=w;
      const side=container.querySelector<HTMLElement>('.room-panel');
      if(side){
        const box=side.getBoundingClientRect();
        // A panel spanning the width (phone portrait closet) sits under the model instead of beside it.
        if(box.left-container.getBoundingClientRect().left<w*.3)bottomLimit=Math.min(bottomLimit,box.top-top-8);
        else rightLimit=box.left-container.getBoundingClientRect().left;
      }

      // Everything in the stage that is not the canvas (eyebrow, caption, buttons) is fixed-size.
      const other=stage.offsetHeight-canvas.offsetHeight;
      const canvasOffset=canvas.getBoundingClientRect().top-stage.getBoundingClientRect().top;
      // Size from the floor depth her feet end up on (characterScale, same rule as the story rooms): place, re-size, re-place.
      // Never above 1.2x the native cell (painted art blurs beyond that) nor taller than the free area.
      const roomH=image.naturalHeight,artY=(y:number)=>(y-(h-roomH*scale)/2)/scale;
      const sizeAt=(feet:number)=>Math.floor(clamp(characterScale(room,roomH,artY(feet))*AN.cellHeight*scale,48,Math.min(AN.cellHeight*1.2,bottomLimit-other-minTop)));
      const place=(height:number)=>clamp(anchorY,minTop+footRatio*height,bottomLimit-other-(1-footRatio)*height);
      let height=sizeAt(anchorY),feet=place(height);
      height=sizeAt(feet);feet=place(height);
      stage.style.setProperty('--studio-character-height',`${height}px`);
      const half=stage.offsetWidth/2;
      const x=clamp(anchorX,half+8,rightLimit-half-8);
      stage.style.left=`${Math.round(x-half)}px`;
      stage.style.top=`${Math.round(feet-footRatio*height-canvasOffset)}px`;

    };
    const observer=new ResizeObserver(()=>alignRef.current());observer.observe(container);
    const align=()=>alignRef.current();
    image.addEventListener('load',align);align();
    return()=>{observer.disconnect();image.removeEventListener('load',align);image.style.objectPosition='';};
  },[room]);
  // Caption/label text changes with the outfit and can change the fixed stack height.
  useLayoutEffect(()=>{alignRef.current();});
  return <div ref={ref} className="mannequin-stage">{children}</div>;
}
