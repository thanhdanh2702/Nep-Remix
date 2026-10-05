import { palette } from '../ui/pixel-art';
import { bakeOutline, drawBrackets, drawSparkle, outlinePad } from './hotspot-highlight';
import { setSmoothing } from '../ui/pixel-scale';
import { drawPixelSprite } from './scene-view';

// Canvas drawing for point-and-click rooms. Everything is pure canvas math over loaded images;
// RoomScene owns state, DOM and timing. The stage canvas is exactly the 8:5 room, so world px (800x500)
// map to device px by `k`.

export interface Box { x: number; y: number; w: number; h: number }
export interface RoomAssets { bg: HTMLImageElement; cat?: HTMLImageElement; vfx?: HTMLImageElement; cutouts: Record<string, HTMLImageElement> }
export interface Highlight { id: string; hit: Box; world: Box; useCutout: boolean }
export interface RoomFrame {
  w: number; h: number; k: number; t: number; reduced: boolean;
  overlays: string[]; s1: boolean; vfx: boolean;
  /** Hover/focus target, drawn alone. */
  focus: Highlight | null;
  /** "Soi" mode: brackets on every hotspot. */
  all: Box[];
  sparkle: { x: number; y: number; frame: number } | null;
}

/** Overlays that change the art for the current progress (same rules the WASD scene used). */
export function overlaysFor(s1: boolean, itemIds: string[], solved: string[]): string[] {
  if (s1) return itemIds.includes('phan_may_mau_xanh') ? ['ban-cat-sau-nhat-phan'] : [];
  return [['p-c0-cloth', 'vai-phu-roi'], ['p-c0-mannequin-hand', 'tuong-go-mo-tay'], ['p-c0-chest-unlock', 'ruong-mo-toang']]
    .filter(([puzzle]) => solved.includes(puzzle)).map(([, suffix]) => suffix);
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

/** Shop dust loops in place; the chest light (re-sliced by scripts/build-vfx-frames.py) seeps from the lid seam:
 *  each 2.6s pulse grows through its 4 frames, drifts up and fades, in whole art pixels and quarter-alpha steps. */
const VFX = {
  s1: { cell: { w: 64, h: 96 }, foot: { x: 398, y: 304 } },
  s2: { cell: { w: 77, h: 82 }, foot: { x: 397, y: 296 } },
};
const PULSE = 2600;
export function vfxState(s1: boolean, t: number, reduced: boolean) {
  if (s1) return { frame: reduced ? 0 : Math.floor(t / 180) % 4, alpha: 1, rise: 0 };
  if (reduced) return { frame: 3, alpha: .75, rise: 0 };
  const p = t % PULSE, fade = p < 300 ? p / 300 : p > PULSE - 700 ? (PULSE - p) / 700 : 1;
  return { frame: Math.min(3, Math.floor(p / 150)), alpha: Math.round(fade * 4) / 4, rise: Math.floor(p / PULSE * 6) };
}

export function drawRoom(ctx: CanvasRenderingContext2D, assets: RoomAssets, areaId: string, f: RoomFrame) {
  const { k, t } = f;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, f.w, f.h);
  // Painted art is smoothed; the 8:5 background is contained (never cropped) inside the stage.
  setSmoothing(ctx, true);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const { bg } = assets;
  const fit = Math.min(800 / bg.naturalWidth, 500 / bg.naturalHeight);
  const bw = bg.naturalWidth * fit, bh = bg.naturalHeight * fit;
  ctx.drawImage(bg, (800 - bw) / 2, (500 - bh) / 2, bw, bh);
  // State overlays are not drawn: the supplied overlay art is framed as close-ups and does not register
  // with the background. `f.overlays` still drives state-dependent effects (vfx) in RoomScene.
  // True pixel sprites: device pixels, whole-number scale.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  setSmoothing(ctx, false);
  const cam = { scale: k, x: 0, y: 0 };
  if (f.s1 && assets.cat) drawPixelSprite(ctx, assets.cat, { x: 0, y: 0, w: 32, h: 32 }, { x: 616, y: 426, w: 32, h: 32 }, cam, 1);
  if (f.vfx && assets.vfx) {
    const { cell, foot } = f.s1 ? VFX.s1 : VFX.s2, { frame, alpha, rise } = vfxState(f.s1, t, f.reduced);
    // Light is added with a screen blend so it brightens the wood instead of sitting on it like a sticker.
    ctx.globalCompositeOperation = f.s1 ? 'source-over' : 'screen';
    ctx.globalAlpha = alpha;
    drawPixelSprite(ctx, assets.vfx, { x: frame * cell.w, y: 0, ...cell }, { x: foot.x - cell.w / 2, y: foot.y - rise - cell.h, ...cell }, cam, 1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
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
