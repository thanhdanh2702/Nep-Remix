import type { GameContent } from '../../../content/index.ts';
import { EventIdSchema } from '../../../content/schema.ts';
import type { GameState, StudioDraft } from '../../state.ts';
import { guardPuzzle } from '../journey/gate.ts';

export type WardrobeResult = { ok: true; garmentIds: string[]; accessoryIds: string[];
  borrowedGarmentIds: string[]; borrowedAccessoryIds: string[] } | { ok: false; reason: string };
export type DraftValidation = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });

/** Catalog ∩ ownership/declared loan. Does not mutate wallet, closet or session. */
export function getChallengeWardrobe(state: GameState, puzzleId: string, content: GameContent): WardrobeResult {
  const guarded = guardPuzzle(state, puzzleId, content, false);
  if (guarded !== true) return typeof guarded === 'object' ? guarded : fail('Challenge is unavailable.');
  const puzzle = content.chapters[state.currentChapter].puzzles.find(p => p.id === puzzleId)!;
  if (puzzle.type !== 'styling') return fail('Challenge must be a styling puzzle.');
  const loan = puzzle.loanWardrobe ?? { garmentIds: [], accessoryIds: [] };
  if (loan.garmentIds.some(id => !content.garmentsById.has(id)) || loan.accessoryIds.some(id => !content.accessoriesById.has(id))) {
    return fail('Challenge wardrobe contains unknown catalog items.');
  }
  const garmentIds = [...new Set([...state.closet.unlockedGarmentIds, ...loan.garmentIds])].filter(id => content.garmentsById.has(id));
  const accessoryIds = [...new Set([...state.closet.unlockedAccessoryIds, ...loan.accessoryIds])].filter(id => content.accessoriesById.has(id));
  return { ok: true, garmentIds, accessoryIds,
    borrowedGarmentIds: loan.garmentIds.filter(id => !state.closet.unlockedGarmentIds.includes(id)),
    borrowedAccessoryIds: loan.accessoryIds.filter(id => !state.closet.unlockedAccessoryIds.includes(id)) };
}

/** Shared by Studio commands and permanent Closet saves; context is never trusted. */
export function validateStudioDraft(state: GameState, draft: StudioDraft, content: GameContent, permanentOnly = false): DraftValidation {
  if (draft.eventContextId !== undefined && !EventIdSchema.safeParse(draft.eventContextId).success) {
    return fail('Unknown event context.');
  }
  let garmentIds = state.closet.unlockedGarmentIds;
  let accessoryIds = state.closet.unlockedAccessoryIds;
  if (draft.challengePuzzleId !== undefined && !permanentOnly) {
    const wardrobe = getChallengeWardrobe(state, draft.challengePuzzleId, content);
    if (!wardrobe.ok) return wardrobe;
    ({ garmentIds, accessoryIds } = wardrobe);
  }
  const garment = content.garmentsById.get(draft.garmentId);
  if (!garment || !garmentIds.includes(draft.garmentId)) return fail('Garment is not owned or available in this challenge.');
  if (garment.silhouette !== draft.silhouette) return fail('Silhouette does not match the selected garment.');
  if (!draft.equippedAccessories || typeof draft.equippedAccessories !== 'object' || Array.isArray(draft.equippedAccessories)) return fail('Accessories must be a slot map.');
  for (const [slot, id] of Object.entries(draft.equippedAccessories)) {
    if (id === undefined) continue;
    const accessory = content.accessoriesById.get(id);
    if (!accessory || accessory.category !== slot || !accessoryIds.includes(id)) return fail(`Accessory in '${slot}' is not authorized for this outfit.`);
  }
  if (!Array.isArray(draft.colorPalette) || draft.colorPalette.length !== 4 || draft.colorPalette.some(c => typeof c !== 'string')) return fail('Palette must contain four strings.');
  if (draft.motifId !== undefined && !content.motifsById.has(draft.motifId)) return fail('Unknown motif.');
  return { ok: true };
}

/** Use on local ScopedSession candidates, including undo/redo, before rendering/persisting. */
export function validateChallengeStudioDraft(state: GameState, puzzleId: string, draft: StudioDraft, content: GameContent): DraftValidation {
  if (draft.challengePuzzleId !== puzzleId) return fail('Studio draft challenge context does not match.');
  return validateStudioDraft(state, draft, content);
}

/** Decoder for persistent string-only answers; omitted fields keep valid defaults. */
export function challengeDraftFromAnswer(state: GameState, puzzleId: string, answer: unknown, content: GameContent):
  { ok: true; draft: StudioDraft } | { ok: false; reason: string } {
  const wardrobe = getChallengeWardrobe(state, puzzleId, content);
  if (!wardrobe.ok) return wardrobe;
  if (!answer || typeof answer !== 'object' || Array.isArray(answer) || Object.values(answer).some(v => typeof v !== 'string')) return fail('Styling answer must contain string fields.');
  const fields = answer as Record<string, string>;
  const puzzle = content.chapters[state.currentChapter].puzzles.find(p => p.id === puzzleId)!;
  if (puzzle.type !== 'styling') return fail('Challenge must be a styling puzzle.');
  const garmentId = fields.garmentId ?? (wardrobe.garmentIds.includes(puzzle.solution.garmentId) ? puzzle.solution.garmentId : wardrobe.garmentIds[0]);
  const garment = content.garmentsById.get(garmentId);
  if (!garment) return fail('No authorized garment is available.');
  const equippedAccessories: StudioDraft['equippedAccessories'] = {};
  for (const slot of ['headwear', 'footwear', 'handheld', 'jewelry'] as const) {
    const id = fields[`${slot}Id`];
    if (id !== undefined && id !== '') equippedAccessories[slot] = id;
  }
  const draft: StudioDraft = { type: 'studio', challengePuzzleId: puzzleId,
    ...(fields.eventContextId !== undefined ? { eventContextId: fields.eventContextId } : {}),
    garmentId, silhouette: (fields.silhouette ?? garment.silhouette) as StudioDraft['silhouette'],
    colorPalette: garment.defaultColorPalette.map((color, i) => fields[`color${i}`] ?? color) as StudioDraft['colorPalette'],
    equippedAccessories, ...(fields.motifId ? { motifId: fields.motifId } : {}) };
  const valid = validateChallengeStudioDraft(state, puzzleId, draft, content);
  return valid.ok ? { ok: true, draft } : valid;
}

export function createChallengeStudioDraft(state: GameState, puzzleId: string, content: GameContent):
  { ok: true; draft: StudioDraft } | { ok: false; reason: string } {
  const saved = state.journey[state.currentChapter]?.puzzleDrafts?.[puzzleId];
  if (saved && saved.type !== 'styling') return fail('Saved challenge draft has the wrong discriminator.');
  return challengeDraftFromAnswer(state, puzzleId, saved?.answer ?? {}, content);
}
