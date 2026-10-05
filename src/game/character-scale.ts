// One source of truth for how big a person is on screen. An's figure is 389 art px tall (176×416
// cell); every scene states how tall she is as a share of its background and everyone else follows.
// Pure functions, no DOM. Scale factors are never rounded: only final screen coordinates are.

/** An's drawn figure height inside her 176×416 cell, in art px. */
export const AN_FIGURE_H = 389;

export type CharacterScene = 'c0' | 'c1' | 'hub' | 'studio' | 'closet' | 'workshop';
type Human = { back: number; front: number; floorTop: number; floorBottom: number };

/** An's height / background height. `back` applies at the top of the floor strip, `front` at its bottom
 *  (both as shares of the background height); scenes without depth use the same value for both. */
export const HUMAN_HEIGHT: Record<CharacterScene, Human> = {
  c0: { back: 0.38, front: 0.5, floorTop: 0.6, floorBottom: 0.95 },
  c1: { back: 0.42, front: 0.42, floorTop: 0.6, floorBottom: 0.95 },
  hub: { back: 0.15, front: 0.15, floorTop: 0, floorBottom: 1 },
  // Measured from the furniture in each room's art (side table/vanity ≈ 75 cm, chair ≈ 1 m): a 1.55 m person
  // is ~31% of the closet art at the back wall and ~43% mid-floor; the studio floor runs wall base → platform edge.
  studio: { back: 0.34, front: 0.48, floorTop: 0.47, floorBottom: 0.73 },
  closet: { back: 0.31, front: 0.55, floorTop: 0.71, floorBottom: 1 },
  workshop: { back: 0.31, front: 0.55, floorTop: 0.71, floorBottom: 1 },
};

/** World px per art px of An's sheet. With `footY` (world px, same space as `bgH`) the height
 *  slides from `back` to `front` across the floor strip, so people shrink toward the back wall. */
export function characterScale(scene: CharacterScene, bgH: number, footY?: number): number {
  const h = HUMAN_HEIGHT[scene];
  const span = (h.floorBottom - h.floorTop) * bgH;
  const t = footY === undefined || span <= 0 ? 1 : Math.min(1, Math.max(0, (footY - h.floorTop * bgH) / span));
  return (h.back + (h.front - h.back) * t) * bgH / AN_FIGURE_H;
}

/** Extra multiplier for a sprite drawn at An's art scale: sprites at An's spec (176×416 NPCs, 128×128 cat)
 *  share her art px, so 1. Legacy sheets (32/96 px frames) are stretched so their frame matches a person. */
export function spriteScaleFor(img: { naturalHeight: number }): number {
  return img.naturalHeight >= 128 ? 1 : AN_FIGURE_H / img.naturalHeight;
}
