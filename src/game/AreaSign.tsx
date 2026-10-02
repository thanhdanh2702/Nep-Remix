import type { ButtonHTMLAttributes } from 'react';
import { asset, brandingAssets } from './assets';

export function AreaSign({children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>){
  return <button className={`area-sign ${className}`} {...props}>
    <img src={asset(brandingAssets.areaSign)} alt="" aria-hidden="true" draggable={false}/>
    <span>{children}</span>
  </button>;
}
