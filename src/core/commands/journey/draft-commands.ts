import type { CommandDef } from '../../command.ts';
import type { PuzzleAnswerDraft } from '../../state.ts';
import { guardPuzzle } from './gate.ts';
import { challengeDraftFromAnswer } from '../studio/challenge-wardrobe.ts';

export interface PuzzleUpdateDraftPayload { puzzleId: string; draft: PuzzleAnswerDraft }
function validDraft(draft: unknown, type: string): draft is PuzzleAnswerDraft {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  const value = draft as Record<string, unknown>;
  if (value.type !== type) return false;
  const strings = (answer: unknown) => Array.isArray(answer) && answer.every(id => typeof id === 'string');
  if (type === 'find' || type === 'order') return strings(value.answer);
  if (type === 'styling') return !!value.answer && typeof value.answer === 'object' && !Array.isArray(value.answer)
    && Object.values(value.answer).every(field => typeof field === 'string');
  return typeof value.answer === 'string' || (type === 'use' && strings(value.answer));
}
export const puzzleUpdateDraftCommand: CommandDef<PuzzleUpdateDraftPayload> = {
  type: 'puzzle/updateDraft', kind: 'reversible',
  guard: (state, payload, content) => {
    const guarded = guardPuzzle(state, payload.puzzleId, content, false);
    if (guarded !== true) return guarded;
    const puzzle = content.chapters[state.currentChapter].puzzles.find(p => p.id === payload.puzzleId)!;
    if (!validDraft(payload.draft, puzzle.type)) return { ok: false, reason: 'Draft discriminator or answer shape is invalid.' };
    if (state.currentChapter === 'c2' && puzzle.type === 'order' && payload.draft.type === 'order') {
      const ids = payload.draft.answer;
      if (new Set(ids).size !== ids.length || ids.some(id => !puzzle.solution.requiredItemIds?.some(piece => piece === id) || !state.inventory.itemIds.includes(id))) {
        return { ok: false, reason: 'Order draft must be a unique subset of owned drawing pieces.' };
      }
    }
    if (puzzle.type === 'styling' && puzzle.loanWardrobe) {
      const validated = challengeDraftFromAnswer(state, puzzle.id, payload.draft.answer, content);
      if (!validated.ok) return validated;
    }
    return true;
  },
  apply: (state, payload) => {
    const progress = state.journey[state.currentChapter];
    const draft = structuredClone(payload.draft);
    return { state: { ...state,
      activeSession: state.activeSession?.type === 'puzzle' && state.activeSession.puzzleId === payload.puzzleId
        ? { ...state.activeSession, valid: false, data: { ...state.activeSession.data, answer: draft.answer } } : state.activeSession,
      journey: { ...state.journey, [state.currentChapter]: { ...progress, puzzleDrafts: { ...progress.puzzleDrafts, [payload.puzzleId]: draft } } }
    } };
  },
  invert: (state, payload) => {
    const previous = state.journey[state.currentChapter].puzzleDrafts?.[payload.puzzleId];
    return previous ? { type: 'puzzle/updateDraft', payload: { puzzleId: payload.puzzleId, draft: previous } }
      : { type: 'puzzle/resetDraft', payload: { puzzleId: payload.puzzleId } };
  }
};
export const puzzleResetDraftCommand: CommandDef<{ puzzleId: string }> = {
  type: 'puzzle/resetDraft', kind: 'reversible',
  guard: (state, payload, content) => guardPuzzle(state, payload.puzzleId, content, false),
  apply: (state, payload) => {
    const progress = state.journey[state.currentChapter];
    const drafts = { ...progress.puzzleDrafts }; delete drafts[payload.puzzleId];
    return { state: { ...state,
      activeSession: state.activeSession?.type === 'puzzle' && state.activeSession.puzzleId === payload.puzzleId
        ? { ...state.activeSession, valid: false, data: {} } : state.activeSession,
      journey: { ...state.journey, [state.currentChapter]: { ...progress, puzzleDrafts: drafts } }
    } };
  }, invert: (state, payload) => {
    const previous = state.journey[state.currentChapter].puzzleDrafts?.[payload.puzzleId];
    return previous ? { type: 'puzzle/updateDraft', payload: { puzzleId: payload.puzzleId, draft: previous } }
      : { type: 'puzzle/resetDraft', payload: { puzzleId: payload.puzzleId } };
  }
};
