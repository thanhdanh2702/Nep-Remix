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
      const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
      const portrait=image.naturalWidth===320;
      const anchor=room==='studio'?{x:image.naturalWidth*.425,y:image.naturalHeight*.615}:(portrait?{x:160,y:250}:{x:300,y:430});
      const anchorX=(w-image.naturalWidth*scale)/2+anchor.x*scale;
      const anchorY=(h-image.naturalHeight*scale)/2+anchor.y*scale;
      const footRatio=Number(canvas.dataset.footRatio ?? AN.anchor.y/AN.cellHeight);

      // Free area: below the nav, above the dock (studio), left of the side panel.
      const nav=container.closest('.app-shell')?.querySelector('.main-nav');
      const minTop=(nav ? nav.getBoundingClientRect().bottom-top : 64)+8;
      const dock=container.querySelector<HTMLElement>('.studio-wardrobe-dock');
      let bottomLimit=(dock ? dock.offsetTop : h)-8;
      let rightLimit=w;
      const side=container.querySelector<HTMLElement>(room==='studio'?'.studio-lookbook':'.room-panel');
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

      if(room==='studio'){
        // Keep the rug under the feet by sliding the cover-cropped art instead of translating it.
        const cropX=image.naturalWidth*scale-w,cropY=image.naturalHeight*scale-h;
        const px=cropX>1?clamp(50+(anchorX-x)/cropX*100,0,100):50;
        const py=cropY>1?clamp(50+(anchorY-feet)/cropY*100,0,100):50;
        image.style.objectPosition=`${px}% ${py}%`;
      }
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
