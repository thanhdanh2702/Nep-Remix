import { CORNER, SPARKLE, gridToCanvas, palette } from '../ui/pixel-art';

// Hotspot highlight drawing for point-and-click rooms. Pure canvas math: outlines are baked
// once per cutout, brackets and sparkles are drawn per frame from cached sprites.
// All coordinates and sizes are device pixels; `n` is the whole-number art-pixel scale.

const GOLD = palette.g;
const CREAM = palette.c;
const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

/** Silhouette of `src` grown by `px` in all 8 directions, filled with `color`. */
function grow(src: HTMLCanvasElement, px: number, color: string): HTMLCanvasElement {
  const out = makeCanvas(src.width, src.height);
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0);
  for (const [dx, dy] of DIRS) ctx.drawImage(src, dx * px, dy * px);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  return out;
}

/** Transparent margin `bakeOutline` adds on every side (inner ring + outer cream ring). */
export const outlinePad = (px = 1) => px * 2;

/** Outline ring of a cutout: `px` thick in `color`, plus an outer `px` ring (`outer`, cream by default) for contrast on dark
 *  backgrounds. Returns a canvas of (w + 2*pad) x (h + 2*pad) with ONLY the ring (cutout hollowed out);
 *  draw it at the cutout's top-left minus `outlinePad(px)`. Bake once, then redraw with varying alpha. */
export function bakeOutline(cutout: CanvasImageSource, w: number, h: number, color: string = GOLD, px = 1, outer: string = CREAM): HTMLCanvasElement {
  const pad = outlinePad(px);
  const base = makeCanvas(w + pad * 2, h + pad * 2);
  const baseCtx = base.getContext('2d')!;
  baseCtx.imageSmoothingEnabled = false;
  baseCtx.drawImage(cutout, pad, pad, w, h);
  const inner = grow(base, px, color);
  const ring = grow(inner, px, outer);
  const ctx = ring.getContext('2d')!;
  ctx.drawImage(inner, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(base, 0, 0);
  return ring;
}

let corner: HTMLCanvasElement | undefined;
let sparkles: HTMLCanvasElement[] | undefined;

const BREATH_MS = 500;

/** Four corner brackets around `rect`, breathing between two frames: 1 art pixel out, 1 art pixel in. */
export function drawBrackets(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, t: number, n: number) {
  corner ??= gridToCanvas(CORNER);
  const size = CORNER[0].length * n;
  const pad = Math.floor(t / BREATH_MS) % 2 === 0 ? n : 0;
  const left = Math.round(rect.x) - pad, top = Math.round(rect.y) - pad;
  const right = Math.round(rect.x + rect.w) + pad, bottom = Math.round(rect.y + rect.h) + pad;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const [x, y, sx, sy] of [[left, top, 1, 1], [right, top, -1, 1], [left, bottom, 1, -1], [right, bottom, -1, -1]]) {
    ctx.setTransform(sx, 0, 0, sy, x, y);
    ctx.drawImage(corner, 0, 0, size, size);
  }
  ctx.restore();
}

/** One sparkle frame (0-2) centred on (x, y). */
export function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, n: number) {
  sparkles ??= SPARKLE.map(grid => gridToCanvas(grid));
  const sprite = sparkles[((frame % sparkles.length) + sparkles.length) % sparkles.length];
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, Math.round(x - sprite.width * n / 2), Math.round(y - sprite.height * n / 2), sprite.width * n, sprite.height * n);
  ctx.imageSmoothingEnabled = prev;
}
