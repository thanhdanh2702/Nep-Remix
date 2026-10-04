import type { CSSProperties, HTMLAttributes } from 'react';
import { asset, sliceMetadata } from './assets';

export function Slice({ path, className = '', style, fillCenter = true, ...props }: HTMLAttributes<HTMLDivElement> & { path: string; fillCenter?: boolean }) {
  const meta = sliceMetadata.find(a => a.path === path);
  const slice = meta && 'slice' in meta ? meta.slice : undefined;
  if (!slice) throw new Error(`Thiếu metadata slice: ${path}`);
  const top = 'top' in slice ? slice.top : 0;
  const bottom = 'bottom' in slice ? slice.bottom : 0;
  const border: CSSProperties = {
    borderStyle: 'solid', borderColor: 'transparent',
    borderWidth: `${top}px ${slice.right}px ${bottom}px ${slice.left}px`,
    borderImageSource: `url("${asset(path)}")`,
    borderImageSlice: `${top} ${slice.right} ${bottom} ${slice.left}${!top && fillCenter ? ' fill' : ''}`,
    borderImageRepeat: 'repeat',
  };
  return <div className={`slice pixel-native ${className}`} style={{ ...border, ...style }} {...props} />;
}
export const CARD_FRAME = 'assets/screens/main-shop/action-card-frame--9slice.png';
export const STUDIO_FRAME = 'assets/screens/studio/studio-panel-frame--9slice.png';
export const MUSEUM_FRAME = 'assets/screens/museum/card-modal--9slice.png';
