import type { CommandDef } from '../../command.ts';
import type { GameState, PuzzleDraft } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { Puzzle } from '../../../content/schema.ts';

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
    const rawAnswer = String(answer ?? '');
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
      if (Array.isArray(answer)) {
        const solSet = new Set(puzzle.solution.requiredItemIds);
        return answer.every((id) => solSet.has(id));
      }
      return puzzle.solution.requiredItemIds.includes(answer as any);
    }
    return true;
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
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];

    if (!chData || !chProgress) {
      return { ok: false, reason: `Invalid chapter '${chId}'.` };
    }

    const puzzle = chData.puzzles.find((p) => p.id === puzzleId);
    if (!puzzle) {
      return { ok: false, reason: `Puzzle '${puzzleId}' does not belong to chapter '${chId}'.` };
    }

    if (chProgress.solvedPuzzleIds.includes(puzzleId)) {
      return { ok: false, reason: `Puzzle '${puzzleId}' is already solved.` };
    }

    if (puzzle.prerequisitePuzzleIds?.some(id => !chProgress.solvedPuzzleIds.includes(id))) {
      return { ok: false, reason: 'Hãy gỡ tấm vải phủ trước khi mở ổ khóa.' };
    }
    if (puzzle.type === 'use' && puzzle.solution.requiredItemId && !state.inventory.itemIds.includes(puzzle.solution.requiredItemId)) {
      return { ok: false, reason: 'An chưa có vật phẩm cần dùng. Hãy khám phá căn phòng.' };
    }

    return true;
  },

  apply: (state: GameState, payload: PuzzleSubmitPayload, content: GameContent) => {
    const { puzzleId, answer } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];
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

    // Correct answer: solve puzzle and grant rewards/unlocks
    const nextSolved = [...chProgress.solvedPuzzleIds, puzzleId];
    let nextInventory = state.inventory.itemIds;
    let nextUnlockedAreas = chProgress.unlockedAreaIds;
    const events: any[] = [
      {
        type: 'puzzleSolved',
        payload: { puzzleId }
      }
    ];

    if ('rewardItemId' in puzzle.solution && puzzle.solution.rewardItemId) {
      const rewardItem = puzzle.solution.rewardItemId;
      if (!nextInventory.includes(rewardItem)) {
        nextInventory = [...nextInventory, rewardItem];
        events.push({
          type: 'itemPicked',
          payload: { itemId: rewardItem }
        });
      }
    }

    if ('unlocksAreaId' in puzzle.solution && puzzle.solution.unlocksAreaId) {
      const area = puzzle.solution.unlocksAreaId;
      if (!nextUnlockedAreas.includes(area)) {
        nextUnlockedAreas = [...nextUnlockedAreas, area];
      }
    }

    const dialogueId = 'dialogueTriggerId' in puzzle.solution ? puzzle.solution.dialogueTriggerId : undefined;
    const dialogue = chData.dialogues.find(d => d.id === dialogueId);
    const firstNode = dialogue?.nodes[0];
    let nextNotebook = state.notebook;
    if (firstNode?.clueId && !nextNotebook.unlockedClueIds.includes(firstNode.clueId)) {
      nextNotebook = { unlockedClueIds: [...nextNotebook.unlockedClueIds, firstNode.clueId] };
      events.push({ type: 'clueCollected', payload: { clueId: firstNode.clueId } });
    }
    const nextState: GameState = {
      ...state,
      notebook: nextNotebook,
      inventory: {
        ...state.inventory,
        itemIds: nextInventory
      },
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          solvedPuzzleIds: nextSolved,
          activeDialogue: firstNode && dialogue ? { dialogueId: dialogue.id, currentNodeId: firstNode.id, history: [firstNode.id] } : chProgress.activeDialogue,
          unlockedAreaIds: nextUnlockedAreas
        }
      }
    };

    return {
      state: nextState,
      events
    };
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
    const { puzzleId } = payload;
    if (state.activeSession !== null) {
      return { ok: false, reason: 'Another active session is currently open.' };
    }

    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];

    const puzzle = chData?.puzzles.find((p) => p.id === puzzleId);
    if (!puzzle) {
      return { ok: false, reason: `Puzzle '${puzzleId}' not found in current chapter.` };
    }

    if (chProgress.solvedPuzzleIds.includes(puzzleId)) {
      return { ok: false, reason: `Puzzle '${puzzleId}' is already solved.` };
    }

    return true;
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
      data: {},
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

  guard: (state: GameState, payload: PuzzleSolvePayload) => {
    if (!payload?.puzzleId) {
      return { ok: false, reason: 'Puzzle ID is required.' };
    }
    const session = state.activeSession;
    if (session && session.type === 'puzzle') {
      if (session.puzzleId !== payload.puzzleId) {
        return {
          ok: false,
          reason: `Active session is for '${session.puzzleId}', not '${payload.puzzleId}'.`
        };
      }
      if (!session.valid) {
        return {
          ok: false,
          reason: 'Puzzle session state has not been verified as valid.'
        };
      }
    }
    return true;
  },

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

  guard: (state: GameState, payload: PuzzleHintPayload) => {
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

  guard: (state: GameState, payload: PuzzleSkipPayload) => {
    const { puzzleId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];

    if (chProgress.solvedPuzzleIds.includes(puzzleId)) {
      return { ok: false, reason: `Puzzle '${puzzleId}' is already solved.` };
    }

    return true;
  },

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
