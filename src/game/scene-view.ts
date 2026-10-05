import { snapToDevice } from '../ui/pixel-scale';
import type { Point } from './physics';

// Geometry helpers for Scene: HUD measurement, camera, sign boxes and crisp sprite blits.
// Everything here is plain math/DOM reads so Scene's frame loop stays free of layout work.

export type Insets = { top: number; bottom: number };
export type View = { w: number; h: number; dpr: number; insets: Insets };
export type Camera = { scale: number; x: number; y: number };

const HUD_TOP = '.back-home, .main-nav, .site-header button, .site-header .hud, .site-header .hub-wallet';
const HUD_BOTTOM = '.journey-toolbar, .inventory-strip, .touch-controls';
export const HUD_SELECTOR = `${HUD_TOP}, ${HUD_BOTTOM}`;
/** Gap kept between An's feet and the HUD / canvas edge. */
const FOOT_MARGIN = 20;

/** How far HUD controls cover the scene from its top and bottom edges (CSS px).
 *  Elements with pointer-events:none are decorative wrappers (e.g. the landscape touch
 *  overlay) and do not reserve space. Called on resize only, never per frame. */
export function measureInsets(scene: HTMLElement): Insets {
  const root = scene.closest('.app-shell') ?? document.body;
  const box = scene.getBoundingClientRect();
  const insets: Insets = { top: 0, bottom: 0 };
  const read = (selector: string, apply: (rect: DOMRect) => void) => root.querySelectorAll<HTMLElement>(selector).forEach(el => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return;
    const rect = el.getBoundingClientRect();
    if (rect.width && rect.height && rect.bottom > box.top && rect.top < box.bottom) apply(rect);
  });
  read(HUD_TOP, rect => { insets.top = Math.max(insets.top, rect.bottom - box.top); });
  read(HUD_BOTTOM, rect => { insets.bottom = Math.max(insets.bottom, box.bottom - rect.top); });
  insets.top = Math.min(Math.max(0, Math.round(insets.top)), box.height);
  insets.bottom = Math.min(Math.max(0, Math.round(insets.bottom)), box.height);
  return insets;
}

/** Cover-scale camera that follows An and keeps her feet inside the HUD-free rectangle.
 *  `reach` is the foot-to-head height on screen. The world may slide up by the bottom inset,
 *  exposing the scene's plum backdrop only behind the HUD. Offsets are snapped to device pixels. */
export function computeCamera(hub: boolean, portrait: boolean, view: View, foot: Point, reach: number): Camera {
  const { w, h, dpr, insets } = view;
  const scale = hub ? Math.max(w / 1000, h / 625) : Math.max(w / 800, h / 500);
  const rawX = hub
    ? (portrait ? Math.min(100 * scale, Math.max(w - 900 * scale, w / 2 - foot.x * scale)) : (w - 800 * scale) / 2)
    : Math.min(0, Math.max(w - 800 * scale, w / 2 - foot.x * scale));
  const centered = (h - 500 * scale) / 2;
  const lowest = (hub ? h - 562.5 * scale : h - 500 * scale) - insets.bottom;
  const wanted = Math.min(Math.max(centered, insets.top + reach - foot.y * scale), h - insets.bottom - FOOT_MARGIN - foot.y * scale);
  const rawY = Math.min(hub ? 62.5 * scale : 0, Math.max(lowest, wanted));
  return { scale, x: snapToDevice(rawX, dpr), y: snapToDevice(rawY, dpr) };
}

const even = (value: number) => Math.round(value / 2) * 2;
const SIGN_RATIO = 683 / 2048;
const SIGN_MIN_WIDTH = 132; // 132×44 keeps the sign a 44px touch target at any scale.

/** Whole-pixel box for an area sign anchored in world space, clamped inside the canvas
 *  using the rotated bounding box so the frame is never cut. */
export function signBox(sign: { signX: number; signY: number; signAngle: number }, cam: Camera, view: View) {
  const width = Math.max(SIGN_MIN_WIDTH, even(132 * cam.scale));
  const height = even(width * SIGN_RATIO);
  const angle = sign.signAngle * Math.PI / 180;
  const sin = Math.abs(Math.sin(angle)), cos = Math.abs(Math.cos(angle));
  const halfX = (width * cos + height * sin) / 2 + 4;
  const halfY = (width * sin + height * cos) / 2 + 4;
  const cx = Math.min(view.w - halfX, Math.max(halfX, sign.signX * cam.scale + cam.x));
  const cy = Math.min(view.h - view.insets.bottom - halfY, Math.max(halfY, sign.signY * cam.scale + cam.y));
  return { width, height, left: Math.round(cx - width / 2), top: Math.round(cy - height / 2) };
}

/** Blit a true pixel sprite at the nearest whole-number scale (smoothing must be off),
 *  anchored at the bottom-centre of its world rectangle. Draws in device pixels. */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement, src: { x: number; y: number; w: number; h: number },
  world: { x: number; y: number; w: number; h: number }, cam: Camera, dpr: number,
) {
  const n = Math.max(1, Math.round(cam.scale * dpr));
  const left = (cam.x + (world.x + world.w / 2) * cam.scale) * dpr - src.w * n / 2;
  const top = (cam.y + (world.y + world.h) * cam.scale) * dpr - src.h * n;
  ctx.drawImage(img, src.x, src.y, src.w, src.h, Math.round(left), Math.round(top), src.w * n, src.h * n);
}
