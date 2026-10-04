// Helpers for the hybrid render policy: painted hi-res art is drawn smoothed,
// true pixel sprites are drawn nearest-neighbour at whole-number scales only.

/** Largest whole-number multiple of `native` that fits in `available` (never below `min`). */
export function integerScale(available: number, native: number, min = 1): number {
  return Math.max(min, Math.floor(available / native));
}

/** Snap a CSS-pixel coordinate to the device-pixel grid so sprites don't shimmer. */
export function snapToDevice(value: number, dpr: number): number {
  return Math.round(value * dpr) / dpr;
}

/** Size a canvas backing store to its CSS box × devicePixelRatio. Returns the context
 *  already scaled so drawing code can keep working in CSS pixels. */
export function setupCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, dpr };
}

/** Smooth for painted art, crisp for native pixel sprites. Resizing a canvas resets this. */
export function setSmoothing(ctx: CanvasRenderingContext2D, hiRes: boolean) {
  ctx.imageSmoothingEnabled = hiRes;
  if (hiRes) ctx.imageSmoothingQuality = 'high';
}
