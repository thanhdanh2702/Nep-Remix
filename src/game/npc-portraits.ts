import { assetRegistry } from './assets';

// Standing dialogue art reuses sprites the game already ships, so no new art is needed:
// NPC sprites are drawn at a whole-number scale,
// An is the layered hi-res sheet (composited, then drawn smoothed).
// NPC art is being regenerated to An's spec; a speaker whose sprite is not shipped gets the emblem.
export type Portrait =
  | { kind: 'sprite'; path: string; ghost?: boolean }
  | { kind: 'an' }
  | { kind: 'emblem' };

const sprite = (id: string, ghost = false): Portrait => {
  const path = `assets/characters/${id}/view-front.png`;
  return assetRegistry[path] ? { kind: 'sprite', path, ghost } : { kind: 'emblem' };
};

const bySpeaker: Record<string, Portrait> = {
  'An': { kind: 'an' },
  'Mèo Nếp': sprite('cat-nep'),
  'Bóng mờ Ông Lệ': sprite('ong-le', true),
  'Cụ Cầm': sprite('cu-cam'),
  'Cụ Loan': sprite('cu-loan'),
  'Ông Cả Nghị': sprite('ca-nghi'),
  'Bà Mai': sprite('ba-mai'),
  'Băng ghi âm Bà Mai': sprite('ba-mai', true),
  'Vinh': sprite('vinh'),
  'Chú Sửu': sprite('chu-suu'),
  'Cô Phương': sprite('me-phuong'),
  'Mẹ Phương': sprite('me-phuong'),
  'Hoàng Lâm': sprite('hoang-lam'),
};

/** Speakers without their own sprite (e.g. Bà Ngoại) get the lotus emblem rather than
 *  a borrowed face from another era. */
export function portraitFor(speaker: string): Portrait {
  return bySpeaker[speaker] ?? { kind: 'emblem' };
}

/** What the standing-portrait layer draws for a speaker. `null` = emblem speaker (no NPC art). */
export type StandingSource = Exclude<Portrait, { kind: 'emblem' }> | null;

export function standingSource(speaker: string): StandingSource {
  const portrait = portraitFor(speaker);
  return portrait.kind === 'emblem' ? null : portrait;
}

/** Same hair/outfit variant rule the scene uses for the player's chosen look. */
export function anLayerPath(layer: string, preset: string) {
  let name = layer;
  if (preset.includes('bob') && layer.startsWith('hair_')) name = `${layer}__bob`;
  if (layer.startsWith('outfit_') && (preset.includes('jade') || preset.includes('rose'))) name = `${layer}__${preset.includes('jade') ? 'jade' : 'rose'}`;
  return `assets/characters/an/${name}.png`;
}
