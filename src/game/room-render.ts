import { palette } from '../ui/pixel-art';
import { bakeOutline, drawBrackets, drawSparkle, outlinePad } from './hotspot-highlight';
import { setSmoothing } from '../ui/pixel-scale';
import { portraitFor } from './npc-portraits';
import { AN, assetRegistry } from './assets';
import { AN_FIGURE_H, characterScale, spriteScaleFor, type CharacterScene } from './character-scale';
import { npcView, type NpcView, type Pt } from './room-walker';

// Canvas drawing for point-and-click rooms. Everything is pure canvas math over loaded images;
// RoomScene owns state, DOM and timing. The stage canvas is exactly the room background, so world px
// (the background's own pixel size) map to device px by `k`.

export interface Box { x: number; y: number; w: number; h: number }
export type NpcViews = Partial<Record<NpcView, HTMLImageElement>>;
/** `npcs`: loaded views per NPC id; `front` is always there (an NPC without it is not drawn). */
export interface RoomAssets { bg: HTMLImageElement; cat?: HTMLImageElement; cutouts: Record<string, HTMLImageElement>; npcs: Record<string, NpcViews> }
export interface Highlight { id: string; hit: Box; world: Box; useCutout: boolean }
export interface RoomFrame {
  w: number; h: number; k: number; t: number; reduced: boolean;
  s1: boolean;
  /** Hover/focus target, drawn alone. */
  focus: Highlight | null;
  /** "Soi" mode: brackets on every hotspot. */
  all: Box[];
  sparkle: { x: number; y: number; frame: number } | null;
  /** NPCs standing in the room: rect in world px, feet at its bottom centre. */
  npcs: { id: string; rect: Box }[];
  /** Scene for character scale; null draws no people. `an` = her feet in world px + the composited cell (once loaded). */
  scene: CharacterScene | null;
  an: { foot: Pt; cell: HTMLCanvasElement | undefined } | null;
}

/** Interactables that stand an NPC in the room (c1 content has no npc field): sprite path + ghost flag, by interactable id.
 *  Speaker-backed ones reuse npc-portraits so a sprite is named once. */
const speakerSprite = (speaker: string) => { const p = portraitFor(speaker); return p.kind === 'sprite' ? { path: p.path, ghost: p.ghost } : undefined; };
const OFFICIALS = 'assets/characters/truong-toc-bui/view-front.png';
export const ROOM_NPCS: Record<string, { path: string; ghost?: boolean } | undefined> = {
  'hitbox-village-officials': assetRegistry[OFFICIALS] ? { path: OFFICIALS } : undefined,
  'hitbox-ong-le-entity': speakerSprite('Bóng mờ Ông Lệ'),
  'hitbox-styling-cam': speakerSprite('Cụ Cầm'),
};
/** Sprite sheets at An's spec share her art px and foot anchor (AN.anchor); the 128x128 cat has ~14 px under its paws. */
const CAT = { cell: 128, foot: { x: 64, y: 114 }, world: { x: 677, y: 458 }, height: 100, share: 0.26 };

/** Every layer of An for one sheet cell, composited once (native 176x416) and cached per layer set. Seen from
 *  behind, her back hair covers the bare head layer (same rule as the scene and the studio). */
const cells = new WeakMap<HTMLImageElement[], Map<number, HTMLCanvasElement>>();
export function anCell(layers: HTMLImageElement[], index: number): HTMLCanvasElement {
  let byIndex = cells.get(layers);
  if (!byIndex) cells.set(layers, byIndex = new Map());
  let cell = byIndex.get(index);
  if (!cell) {
    cell = document.createElement('canvas');
    cell.width = AN.cellWidth; cell.height = AN.cellHeight;
    const ctx = cell.getContext('2d')!, sx = index % AN.columns * AN.cellWidth, sy = Math.floor(index / AN.columns) * AN.cellHeight;
    const hair = AN.layers.indexOf('hair_back'), order = AN.layers.map((_, i) => i);
    const seq = index >= AN.directions.up ? order.filter(i => i !== hair).flatMap(i => AN.layers[i] === 'head' ? [i, hair] : [i]) : order;
    for (const i of seq) ctx.drawImage(layers[i], sx, sy, AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
    byIndex.set(index, cell);
  }
  return cell;
}

const outlines = new Map<string, { tint: HTMLCanvasElement; ring: HTMLCanvasElement }>();
/** Cream tint of the cutout plus its outline ring at device size, baked once per (area, id, size, thickness). */
function outlineFor(key: string, cutout: HTMLImageElement, w: number, h: number, px: number) {
  const id = `${key}|${w}x${h}|${px}`;
  let baked = outlines.get(id);
  if (!baked) {
    const tint = document.createElement('canvas');
    tint.width = w; tint.height = h;
    const ctx = tint.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; // nearest keeps the cutout alpha hard, so the ring stays crisp
    ctx.drawImage(cutout, 0, 0, w, h);
    const ring = bakeOutline(tint, w, h, palette.g, px);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = palette.c;
    ctx.fillRect(0, 0, w, h);
    baked = { tint, ring };
    outlines.set(id, baked);
  }
  return baked;
}

export function drawRoom(ctx: CanvasRenderingContext2D, assets: RoomAssets, areaId: string, f: RoomFrame) {
  const { k, t } = f;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, f.w, f.h);
  // Painted prologue art (c0-*) is smoothed; chapter backgrounds are code-drawn pixel art and stay crisp.
  // The stage has the background's aspect, so it fills the canvas exactly.
  setSmoothing(ctx, areaId.startsWith('c0-'));
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.drawImage(assets.bg, 0, 0);
  // People and the cat, back to front by foot line. Scale comes from characterScale at each foot, so they shrink
  // toward the back wall; sprites at An's art spec are painted art and are drawn smoothed. Device pixels from here.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (f.scene) {
    const scene = f.scene, bgH = assets.bg.naturalHeight, an = f.an?.foot ?? null;
    const figure = (img: CanvasImageSource, w: number, h: number, anchor: Pt, foot: Pt, scale: number, hires: boolean) => {
      setSmoothing(ctx, hires);
      const s = scale * k;
      ctx.drawImage(img, Math.round(foot.x * k - anchor.x * s), Math.round(foot.y * k - anchor.y * s), Math.round(w * s), Math.round(h * s));
    };
    const draws: { y: number; draw: () => void }[] = [];
    if (an && f.an?.cell) { const cell = f.an.cell; draws.push({ y: an.y, draw: () => figure(cell, AN.cellWidth, AN.cellHeight, AN.anchor, an, characterScale(scene, bgH, an.y), true) }); }
    if (f.s1 && assets.cat) {
      const cat = assets.cat, foot = CAT.world, anH = AN_FIGURE_H * characterScale(scene, bgH, foot.y);
      draws.push({ y: foot.y, draw: () => figure(cat, cat.naturalWidth, cat.naturalHeight, CAT.foot, foot, CAT.share * anH / CAT.height, true) });
    }
    for (const { id, rect } of f.npcs) {
      const views = assets.npcs[id], foot = { x: rect.x + rect.w / 2, y: rect.y + rect.h };
      const img = views && ((an && views[npcView(foot, an, { w: assets.bg.naturalWidth, h: bgH })]) || views.front);
      if (!img) continue;
      draws.push({ y: foot.y, draw: () => {
        ctx.globalAlpha = ROOM_NPCS[id]?.ghost ? .7 : 1; // ghosts are see-through
        figure(img, img.naturalWidth, img.naturalHeight, AN.anchor, foot, characterScale(scene, bgH, foot.y) * spriteScaleFor(img), img.naturalHeight >= 128);
        ctx.globalAlpha = 1;
      } });
    }
    draws.sort((a, b) => a.y - b.y).forEach(d => d.draw());
  }
  setSmoothing(ctx, false);
  // Highlight layer, in device space (drawBrackets sets its own transform).
  const n = Math.max(2, Math.round(k)); // art-pixel scale: never below x2 so brackets and sparkles stay legible
  for (const box of f.all) drawBrackets(ctx, box, f.reduced ? 0 : t, n);
  const focus = f.focus;
  if (focus) {
    const cutout = assets.cutouts[focus.id];
    if (focus.useCutout && cutout) {
      const px = Math.max(3, Math.round(k * 2)), pad = outlinePad(px);
      const w = Math.max(1, Math.round(focus.world.w * k)), h = Math.max(1, Math.round(focus.world.h * k));
      const x = Math.round(focus.world.x * k), y = Math.round(focus.world.y * k);
      const lit = f.reduced || Math.floor(t / 400) % 2 === 0; // steps(2) pulse
      const { tint, ring } = outlineFor(`${areaId}/${focus.id}`, cutout, w, h, px);
      // The object itself lights up (screen blend reads on dark wood and pale cloth alike), then the ring.
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = lit ? .34 : .2;
      ctx.drawImage(tint, x, y);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = lit ? 1 : .7;
      ctx.drawImage(ring, x - pad, y - pad);
      ctx.globalAlpha = 1;
    } else drawBrackets(ctx, focus.hit, f.reduced ? 0 : t, n);
  }
  if (f.sparkle) drawSparkle(ctx, f.sparkle.x, f.sparkle.y, f.sparkle.frame, n);
}
