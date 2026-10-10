import mainMeta from '../../assets/screens/main-shop/asset-manifest.json';
import assetMetadata from '../../data/runtime-assets.json';
import legacySlices from '../../data/legacy-screen-slices.json';

// Vite owns these URLs in dev and production. Never import drafts or QA images.
const files = typeof process !== 'undefined' && !process.env.VITE
  ? {}
  : import.meta.glob<string>(['../../assets/**/*.png', '../../map.png', '!../../assets/**/_raw/**', '!../../assets/references/**'], {
      eager: true, query: '?url', import: 'default',
    });
/** Only metadata-backed assets may enter runtime; local art drafts stay untouched. */
export function registeredAssetUrls(files: Record<string, string>, paths: readonly string[]): Record<string, string> {
  const registered = new Set(paths);
  return Object.fromEntries(Object.entries(files)
    .map(([path, url]) => [path.replace('../../', ''), url])
    .filter(([path]) => registered.has(path)));
}
export const assetRegistry = registeredAssetUrls(files, assetMetadata.map(entry => entry.path));
export const assetInfo = Object.fromEntries(assetMetadata.map(entry => [entry.path, entry]));
export function asset(path: string): string {
  const url = assetRegistry[path];
  if (!url) throw new Error(`Thiếu asset: ${path}`);
  return url;
}
export const brandingAssets = {
  currencyHud: 'assets/screens/main-shop/ui/currency-hud.png',
  settingsButton: 'assets/screens/main-shop/ui/settings-button.png',
  areaSign: 'assets/screens/main-shop/ui/area-sign-frame.png',
  garden: 'assets/screens/main-shop/backgrounds/garden-user--landscape.png',
  logo: 'assets/branding/logo-viet-phuc.png',
  coin: 'assets/ui-pixel/icon-sen-ngoc.png',
};
export const sliceMetadata = [
  ...legacySlices,
  ...mainMeta.assets.map(a => ({ ...a, path: `assets/screens/main-shop/${a.file}` })),
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
export function c2StripAsset(id: string): string | undefined {
  const match = id.match(/(\d+)$/);
  if (!match) return undefined;
  const path = `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-${match[1]}.png`;
  return Object.keys(assetRegistry).length > 0 ? (assetRegistry[path] ? path : undefined) : path;
}
export function c2CompleteSketchAsset(): string {
  return 'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-ban-ve-hoan-chinh.png';
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

/** The same bottom design is used by the model, mirror, lookbook and picker. */
export function studioBottomAsset(garmentId: string, direction: Direction = 'down'): {
  path: string; kind: 'skirt' | 'trousers'; native: boolean;
} {
  const skirt = garmentAsset(garmentId).replace('.png', '--bottom.png');
  if (assetRegistry[skirt]) {
    const right = skirt.replace('--bottom.png', '--bottom-right.png');
    return { path: direction === 'right' && assetRegistry[right] ? right : skirt, kind: 'skirt', native: false };
  }
  const trousers = `assets/characters/an/studio-trousers${direction === 'right' ? '--right' : ''}.png`;
  if (assetRegistry[trousers]) return { path: trousers, kind: 'trousers', native: false };
  return { path: 'assets/characters/an/bottom.png', kind: 'trousers', native: true };
}
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
