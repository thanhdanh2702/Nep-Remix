import { asset, assetInfo } from './assets';
import { ClothingPreview } from './ClothingPreview';
import type { MuseumEntry } from './museum-gallery';
import { PixelIcon } from '../welcome/PixelIcon';

// Use the registered alpha bounds as a viewport so transparent padding never shrinks exhibits.
// The original PNG bytes are retained and the raster scales uniformly inside the SVG viewport.
export function MuseumRaster({ path, className = '' }: { path: string; className?: string }) {
  const info = assetInfo[path], bounds = info.bounds ?? [0, 0, info.width, info.height];
  return <svg className={`museum-raster ${className}`} viewBox={`${bounds[0]} ${bounds[1]} ${bounds[2] - bounds[0]} ${bounds[3] - bounds[1]}`} aria-hidden="true" focusable="false"><image href={asset(path)} width={info.width} height={info.height} /></svg>;
}

export function MuseumArt({ entry, className = '' }: { entry: MuseumEntry; className?: string }) {
  const portrait = entry.portrait?.kind === 'sprite' ? entry.portrait.path : null;
  return <div className={`museum-artwork ${className} ${entry.unlocked ? '' : 'is-locked'} ${entry.garment ? 'is-garment' : ''} ${portrait ? 'is-portrait' : ''}`} aria-hidden={entry.artworkPending ? undefined : true}>
    {entry.artworkPending ? <span className="museum-art-pending">Hiện đang hoàn thiện</span>
      : entry.garment ? <ClothingPreview garment={entry.garment} colors={entry.garment.defaultColorPalette} />
      : portrait || entry.image ? entry.pixel ? <img className="pixel-native" src={asset(entry.image!)} alt="" draggable={false} /> : <MuseumRaster path={portrait ?? entry.image!} />
      : <span className="museum-emblem"><PixelIcon kind="lotus" /><span>{entry.unlocked ? 'Nếp ký ức' : '?'}</span></span>}
  </div>;
}
