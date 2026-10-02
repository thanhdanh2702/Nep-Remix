import { useEffect, useRef, type ReactNode } from 'react';
import { Slice, CARD_FRAME } from './Slice';
export function Modal({title,children,onClose,wide=false,className=''}: {title:string;children:ReactNode;onClose?:()=>void;wide?:boolean;className?:string}) {
  const ref=useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement | null;
    const focusables=()=>Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]'));
    (focusables()[0] ?? ref.current)?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape' && closeRef.current){e.preventDefault();closeRef.current();}
      if(e.key==='Tab'){
        const items=focusables(),first=items[0],last=items[items.length-1];
        if(!first){e.preventDefault();return;}
        if(e.shiftKey && (document.activeElement===first || document.activeElement===ref.current)){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('keydown',key);previous?.focus();};
  },[]);
  return <div className={`modal-backdrop ${className}`}><div ref={ref} className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><Slice path={CARD_FRAME}><div className="modal-heading"><h2>{title}</h2>{onClose && <button onClick={onClose}>Đóng</button>}</div>{children}</Slice></div></div>;
}
