import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { asset, brandingAssets } from './assets';

/** Painted wooden sign. `angle` (degrees) is the only source of rotation: CSS reads
 *  --sign-angle through the `rotate` property, so no other transform is involved. */
export function AreaSign({children,className='',angle,highlighted,style,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{angle?:number;highlighted?:boolean}){
  const rotation=angle===undefined?style:{...style,'--sign-angle':`${angle}deg`} as CSSProperties;
  return <button className={`area-sign ${className}${highlighted?' is-highlighted':''}`} style={rotation} {...props}>
    <img className="art-hires" src={asset(brandingAssets.areaSign)} alt="" aria-hidden="true" draggable={false}/>
    <span>{children}</span>
  </button>;
}
