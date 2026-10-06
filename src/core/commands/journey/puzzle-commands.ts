import type { CommandDef } from '../../command.ts';
import type { GameState, PuzzleDraft } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { Puzzle } from '../../../content/schema.ts';
import { guardPuzzle } from './gate.ts';
import { applyPuzzleSolved } from './puzzle-solution.ts';

// ==========================================
// Text Normalization (Diacritic & Case Insensitive)
// ==========================================

export function normalizeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

// ==========================================
// Pure Evaluation of Puzzle Solution
// ==========================================

export function evaluatePuzzleAnswer(puzzle: Puzzle, answer: unknown): boolean {
  if (puzzle.type === 'code') {
    if (typeof answer !== 'string') return false;
    const rawAnswer = answer;
    const cleanAnswer = normalizeDiacritics(rawAnswer).replace(/\s+/g, '');
    const cleanSolution = normalizeDiacritics(puzzle.solution.combination).replace(/\s+/g, '');
    return cleanAnswer === cleanSolution;
  }

  if (puzzle.type === 'order') {
    if (!Array.isArray(answer)) return false;
    const targetSeq = puzzle.solution.sequence ?? puzzle.solution.requiredItemIds ?? [];
    if (answer.length !== targetSeq.length) return false;
    return answer.every((val, idx) => val === targetSeq[idx]);
  }

  if (puzzle.type === 'present') {
    return answer === puzzle.solution.presentedItemId;
  }

  if (puzzle.type === 'styling') {
    if (!answer || typeof answer !== 'object') return false;
    const ans = answer as Record<string, unknown>;
    const sol = puzzle.solution;

    if (sol.silhouette && ans.silhouette !== sol.silhouette) return false;
    if (sol.garmentId && ans.garmentId !== sol.garmentId) return false;
    if (sol.headwearId && ans.headwearId !== sol.headwearId) return false;
    if (sol.jewelryId && ans.jewelryId !== sol.jewelryId) return false;
    if (sol.footwearId && ans.footwearId !== sol.footwearId) return false;
    if (sol.handheldId && ans.handheldId !== sol.handheldId) return false;

    return true;
  }

  if (puzzle.type === 'find') {
    if (!Array.isArray(answer)) return false;
    const targetPoints = puzzle.solution.points;
    if (answer.length !== targetPoints.length) return false;
    const answerSet = new Set(answer);
    return targetPoints.every((pt) => answerSet.has(pt));
  }

  if (puzzle.type === 'use') {
    if (puzzle.solution.requiredItemId) {
      return answer === puzzle.solution.requiredItemId;
    }
    if (puzzle.solution.requiredItemIds) {
      const required = puzzle.solution.requiredItemIds;
      return required.length > 0 && Array.isArray(answer) && answer.length === required.length
        && new Set(answer).size === answer.length && required.every(id => answer.includes(id));
    }
    return typeof answer === 'string' && answer === puzzle.solution.action;
  }

  return false;
}

// ==========================================
// 1. puzzle/submit (reversible)
// ==========================================

export interface PuzzleSubmitPayload {
  puzzleId: string;
  answer: unknown;
}

export const puzzleSubmitCommand: CommandDef<PuzzleSubmitPayload> = {
  type: 'puzzle/submit',
  kind: 'reversible',

  guard: (state: GameState, payload: PuzzleSubmitPayload, content: GameContent) => {
    return guardPuzzle(state, payload.puzzleId, content);
  },

  apply: (state: GameState, payload: PuzzleSubmitPayload, content: GameContent) => {
    const { puzzleId, answer } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const puzzle = chData.puzzles.find((p) => p.id === puzzleId)!;

    const isCorrect = evaluatePuzzleAnswer(puzzle, answer);

    if (!isCorrect) {
      // Wrong answer: only feedback, no state alteration
      return {
        state,
        events: [
          {
            type: 'puzzleFeedback',
            payload: { puzzleId, result: 'incorrect' }
          }
        ]
      };
    }

    // Correct answer: shared solve transition (rewards, unlocks, triggered dialogues)
    return applyPuzzleSolved(state, puzzle, content);
  },

  invert: (_state: GameState, payload: PuzzleSubmitPayload) => {
    return {
      type: 'puzzle/unsolve',
      payload: { puzzleId: payload.puzzleId }
    };
  }
};

// ==========================================
// 2. puzzle/open (reversible)
// ==========================================

export interface PuzzleOpenPayload {
  puzzleId: string;
}

export const puzzleOpenCommand: CommandDef<PuzzleOpenPayload> = {
  type: 'puzzle/open',
  kind: 'reversible',

  guard: (state: GameState, payload: PuzzleOpenPayload, content: GameContent) => {
    if (state.activeSession !== null) return { ok: false, reason: 'Another session is open.' };
    return guardPuzzle(state, payload.puzzleId, content, false);
  },

  apply: (state: GameState, payload: PuzzleOpenPayload, content: GameContent) => {
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const puzzle = chData.puzzles.find((p) => p.id === puzzleId)!;

    const session: PuzzleDraft = {
      type: 'puzzle',
      puzzleId,
      chapterId: chId,
      puzzleType: puzzle.type,
      valid: false,
      data: { answer: chProgressDraft(state, puzzleId) },
      history: []
    };

    const nextState: GameState = {
      ...state,
      activeSession: session
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: () => {
    return {
      type: 'puzzle/close',
      payload: {}
    };
  }
};

// ==========================================
// 3. puzzle/solve (reversible)
// ==========================================
// Generated only when puzzle/check inside session confirmed valid === true

export interface PuzzleSolvePayload {
  puzzleId: string;
}

export const puzzleSolveCommand: CommandDef<PuzzleSolvePayload> = {
  type: 'puzzle/solve',
  kind: 'reversible',

  guard: () => ({ ok: false, reason: 'Use puzzle/submit with an evaluated answer.' }),

  apply: (state: GameState, payload: PuzzleSolvePayload) => {
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];

    const nextSolved = chProgress.solvedPuzzleIds.includes(puzzleId)
      ? chProgress.solvedPuzzleIds
      : [...chProgress.solvedPuzzleIds, puzzleId];

    const nextState: GameState = {
      ...state,
      activeSession: null, // Close session on completion
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          solvedPuzzleIds: nextSolved
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'puzzleSolved',
          payload: { puzzleId }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: PuzzleSolvePayload) => {
    return {
      type: 'puzzle/unsolve',
      payload: { puzzleId: payload.puzzleId }
    };
  }
};

// ==========================================
// 4. puzzle/hint (compensable)
// ==========================================

export interface PuzzleHintPayload {
  puzzleId: string;
}

export const puzzleHintCommand: CommandDef<PuzzleHintPayload> = {
  type: 'puzzle/hint',
  kind: 'compensable',

  guard: (state: GameState, payload: PuzzleHintPayload, content: GameContent) => {
    const guarded = guardPuzzle(state, payload.puzzleId, content, false);
    if (guarded !== true) return guarded;
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];

    if (!chProgress) {
      return { ok: false, reason: `Invalid chapter '${chId}'.` };
    }

    if (chProgress.solvedPuzzleIds.includes(puzzleId)) {
      return { ok: false, reason: `Puzzle '${puzzleId}' is already solved.` };
    }

    const currentTier = chProgress.hintTiers[puzzleId] ?? 0;
    if (currentTier >= 3) {
      return { ok: false, reason: `Puzzle '${puzzleId}' has already reached max hint tier (3).` };
    }

    return true;
  },

  apply: (state: GameState, payload: PuzzleHintPayload) => {
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];
    const currentTier = chProgress.hintTiers[puzzleId] ?? 0;
    const nextTier = Math.min(3, currentTier + 1);

    const nextState: GameState = {
      ...state,
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          hintTiers: {
            ...chProgress.hintTiers,
            [puzzleId]: nextTier
          }
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'puzzleFeedback',
          payload: { puzzleId, result: 'hint' }
        }
      ]
    };
  },

  invert: (state: GameState, payload: PuzzleHintPayload) => {
    return {
      type: 'puzzle/decrementHint',
      payload: { puzzleId: payload.puzzleId }
    };
  }
};

// ==========================================
// 5. puzzle/skip (reversible)
// ==========================================

export interface PuzzleSkipPayload {
  puzzleId: string;
}

export const puzzleSkipCommand: CommandDef<PuzzleSkipPayload> = {
  type: 'puzzle/skip',
  kind: 'reversible',

  guard: () => ({ ok: false, reason: 'Puzzle skipping cannot complete progress.' }),

  apply: (state: GameState, payload: PuzzleSkipPayload) => {
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];

    const nextState: GameState = {
      ...state,
      activeSession: null,
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          solvedPuzzleIds: [...chProgress.solvedPuzzleIds, puzzleId]
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'puzzleSolved',
          payload: { puzzleId }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: PuzzleSkipPayload) => {
    return {
      type: 'puzzle/unsolve',
      payload: { puzzleId: payload.puzzleId }
    };
  }
};

function chProgressDraft(state: GameState, puzzleId: string): unknown {
  return state.journey[state.currentChapter].puzzleDrafts?.[puzzleId]?.answer;
}
