import { useLayoutEffect, useRef, type ReactNode } from 'react';

// Align the paperdoll's existing foot anchor with the platform/floor in the room asset.
export function MannequinStage({children,room}:{children:ReactNode;room:'studio'|'closet'}) {
  const ref=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const stage=ref.current!;
    const container=stage.parentElement!;
    const image=container.querySelector<HTMLImageElement>('.room-background img')!;
    const align=()=>{
      const canvas=stage.querySelector<HTMLCanvasElement>('.paperdoll');
      if(!canvas||!image.naturalWidth)return;
      const w=container.clientWidth,h=container.clientHeight;
      const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
      const portrait=image.naturalWidth===320;
      const anchor=room==='studio'?{x:image.naturalWidth*.425,y:image.naturalHeight*.615}:(portrait?{x:160,y:250}:{x:300,y:430});
      const mobileStudio=room==='studio' && w<=640;
      const x=mobileStudio?w*.26:(w-image.naturalWidth*scale)/2+anchor.x*scale;
      let y=mobileStudio?h*.435:(h-image.naturalHeight*scale)/2+anchor.y*scale;
      const canvasOffset=canvas.getBoundingClientRect().top-stage.getBoundingClientRect().top;
      const footRatio=Number(canvas.dataset.footRatio ?? 90/96);
      if(room==='studio' && !mobileStudio){
        const dock=container.querySelector<HTMLElement>('.studio-wardrobe-dock');
        if(dock){
          const originalY=y;
          const footer=stage.clientHeight-canvasOffset-canvas.clientHeight;
          const nav=container.closest('.app-shell')?.querySelector('.main-nav');
          const minimumTop=(nav?.getBoundingClientRect().bottom ?? container.getBoundingClientRect().top+64)-container.getBoundingClientRect().top+12;
          const height=Math.max(48,Math.min(h*.53,490,(y-minimumTop)/footRatio,dock.offsetTop-footer-minimumTop-8));
          stage.style.setProperty('--studio-character-height',`${Math.floor(height)}px`);
          y=Math.min(y,dock.offsetTop-footer-canvas.clientHeight*(1-footRatio)-8);
          const crop=image.naturalHeight*scale-h;
          if(crop>0){
            image.style.transform='';
            image.style.objectPosition=`center ${Math.min(100,Math.max(0,50+(originalY-y)/crop*100))}%`;
          }else{
            image.style.objectPosition='center';
            image.style.transform=`translateY(${y-originalY}px)`;
          }
        }
      }else if(room==='studio'){
        stage.style.removeProperty('--studio-character-height');
        image.style.objectPosition='';image.style.transform='';
      }
      const feet=canvas.clientHeight*footRatio;
      stage.style.left=`${x}px`;
      stage.style.top=`${y-canvasOffset-feet}px`;
    };
    const observer=new ResizeObserver(align);observer.observe(container);observer.observe(stage);
    image.addEventListener('load',align);align();
    return()=>{observer.disconnect();image.removeEventListener('load',align);};
  },[room]);
  return <div ref={ref} className="mannequin-stage">{children}</div>;
}
