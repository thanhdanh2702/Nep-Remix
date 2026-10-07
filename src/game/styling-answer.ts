import type { StudioDraft } from '../core';

/**
 * Shape that evaluatePuzzleAnswer and Core challenge validation expect for a 'styling' puzzle.
 * Ensures every field is a string and optional context/motif fields are preserved.
 */
export const stylingAnswer = (draft: StudioDraft) => ({
  silhouette: draft.silhouette,
  garmentId: draft.garmentId,
  headwearId: draft.equippedAccessories.headwear ?? '',
  jewelryId: draft.equippedAccessories.jewelry ?? '',
  footwearId: draft.equippedAccessories.footwear ?? '',
  handheldId: draft.equippedAccessories.handheld ?? '',
  color0: draft.colorPalette[0],
  color1: draft.colorPalette[1],
  color2: draft.colorPalette[2],
  color3: draft.colorPalette[3],
  ...(draft.eventContextId !== undefined ? { eventContextId: draft.eventContextId } : {}),
  ...(draft.motifId ? { motifId: draft.motifId } : {}),
});
