import mainMeta from '../../assets/screens/main-shop/asset-manifest.json';
import studioMeta from '../../assets/screens/studio/asset-manifest.json';
import museumMeta from '../../assets/screens/museum/asset-manifest.json';
import assetMetadata from '../../data/runtime-assets.json';

// Vite owns these URLs in dev and production. Never import drafts or QA images.
const files = import.meta.glob<string>(['../../assets/**/*.png', '../../map.png', '!../../assets/**/_raw/**'], {
  eager: true, query: '?url', import: 'default',
});
export const assetRegistry = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.replace('../../', ''), url]));
export const assetInfo = Object.fromEntries(assetMetadata.map(entry => [entry.path, entry]));
export function asset(path: string): string {
  const url = assetRegistry[path];
  if (!url) throw new Error(`Thiếu asset: ${path}`);
  return url;
}
export const screenAssets = {
  hub: 'assets/screens/main-shop/background',
  studio: 'assets/screens/studio/workbench-ui',
  closet: 'assets/screens/wardrobe/closet-shelf',
  museum: 'assets/screens/museum/bookshelf-view',
};
export const brandingAssets = {
  currencyHud: 'assets/screens/main-shop/currency-hud.png',
  settingsButton: 'assets/screens/main-shop/settings-button.png',
  areaSign: 'assets/screens/main-shop/area-sign-frame.png',
  garden: 'assets/screens/main-shop/garden-user--landscape.png',
  logo: 'assets/branding/logo-viet-phuc.png',
  coin: 'assets/ui-pixel/icon-sen-ngoc.png',
};
export const sliceMetadata = [
  ...mainMeta.assets.map(a => ({ ...a, path: `assets/screens/main-shop/${a.file}` })),
  ...studioMeta.assets.map(a => ({ ...a, path: `assets/screens/studio/${a.file}` })),
  ...museumMeta.assets.map(a => ({ ...a, path: `assets/screens/museum/${a.file}` })),
];
/** Folder name under assets/areas for a chapter id: `prologue` stays, `c1` -> `chapter-1`. */
export const chapterFolder = (chapterId: string) => chapterId.replace(/^c(\d+)$/, 'chapter-$1');
export const areaFolder = (chapterId: string, areaId: string) => `assets/areas/${chapterFolder(chapterId)}/${areaId}`;
export function areaAsset(chapterId: string, areaId: string, suffix = 'phai') {
  return `${areaFolder(chapterId, areaId)}/${areaId}--${suffix}.png`;
}
export function itemAsset(id: string) {
  const slug = id.replaceAll('_', '-').toLowerCase();
  const path = `assets/items/${slug}/${slug}.png`;
  return assetRegistry[path] ? path : undefined;
}
export function garmentAsset(id: string, icon = false) {
  return `assets/garments/${id}/${id}${icon ? '--icon' : ''}.png`;
}
export function accessoryAsset(id: string, icon = false) {
  return `assets/accessories/${id}/${id}${icon ? '--icon' : ''}.png`;
}
export const AN = {
  columns: 8, rows: 11, cellWidth: 176, cellHeight: 416,
  anchor: { x: 88, y: 400 },
  directions: { down: 0, left: 22, right: 44, up: 66 },
  idle: [0, 1, 2, 3], walk: [4, 5, 6, 7, 8, 9, 10, 11],
  layers: ['shadow', 'hair_back', 'outfit_back', 'legs', 'shoes', 'body', 'bottom', 'outfit_main', 'head', 'face', 'hair_front', 'hands', 'head_accessory'],
};
export type Direction = keyof typeof AN.directions;
const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(path: string) {
  if (!cache.has(path)) cache.set(path, new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const info = assetInfo[path];
      if (!info || info.width !== img.naturalWidth || info.height !== img.naturalHeight) reject(new Error(`Asset không khớp registry kích thước: ${path}`));
      else resolve(img);
    };
    img.onerror = () => reject(new Error(`Không tải được asset: ${path}`));
    img.src = asset(path);
  }));
  return cache.get(path)!;
}
