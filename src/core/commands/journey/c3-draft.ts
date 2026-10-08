import type { GameState, PuzzleAnswerDraft } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { EventIdSchema } from '../../../content/schema.ts';

/** Stored drafts outlive their room/session/solve. Validate shape and declared permissions, not completion. */
export function validC3StoredDraft(state: GameState, puzzleId: string, draft: unknown, content: GameContent): draft is PuzzleAnswerDraft {
  const puzzle = content.chapters.c3.puzzles.find(p => p.id === puzzleId);
  if (!puzzle || !draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  const value = draft as { type?: string; answer?: unknown };
  if (value.type !== puzzle.type) return false;
  if (puzzle.type === 'code') return typeof value.answer === 'string';
  if (puzzle.type === 'present') return typeof value.answer === 'string'
    && (value.answer === '' || (content.itemsById.has(value.answer) && state.inventory.itemIds.includes(value.answer)));
  if (puzzle.type !== 'styling' || !value.answer || typeof value.answer !== 'object' || Array.isArray(value.answer)) return false;
  const fields = value.answer as Record<string, unknown>;
  if (Object.values(fields).some(value => typeof value !== 'string')) return false;
  const answer = fields as Record<string, string>;
  if (answer.eventContextId !== undefined && !EventIdSchema.safeParse(answer.eventContextId).success) return false;
  const garmentId = answer.garmentId ?? puzzle.solution.garmentId;
  const garment = content.garmentsById.get(garmentId);
  if (!garment || !(state.closet.unlockedGarmentIds.includes(garmentId) || puzzle.loanWardrobe?.garmentIds.some(id => id === garmentId))
    || (answer.silhouette !== undefined && answer.silhouette !== garment.silhouette)) return false;
  for (const slot of ['headwear','jewelry','footwear','handheld'] as const) {
    const id = answer[`${slot}Id`];
    if (id === undefined || id === '') continue;
    const accessory = content.accessoriesById.get(id);
    if (!accessory || accessory.category !== slot
      || !(state.closet.unlockedAccessoryIds.includes(id) || puzzle.loanWardrobe?.accessoryIds.some(allowed => allowed === id))) return false;
  }
  return !answer.motifId || content.motifsById.has(answer.motifId);
}
