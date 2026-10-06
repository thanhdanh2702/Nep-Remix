import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { ChapterId } from '../../../content/schema.ts';

// ==========================================
// 1. chapter/enter (reversible)
// ==========================================

export interface ChapterEnterPayload {
  chapterId: ChapterId;
}

export const chapterEnterCommand: CommandDef<ChapterEnterPayload> = {
  type: 'chapter/enter',
  kind: 'reversible',

  guard: (state: GameState, payload: ChapterEnterPayload, content: GameContent) => {
    const { chapterId } = payload;
    if (!chapterId || !content.chapters[chapterId]) {
      return { ok: false, reason: `Chapter '${chapterId}' does not exist.` };
    }
    const chProgress = state.journey[chapterId];
    if (!chProgress) {
      return { ok: false, reason: `No progress record for chapter '${chapterId}'.` };
    }
    if (chProgress.status === 'locked') {
      return { ok: false, reason: `Chapter '${chapterId}' is locked.` };
    }
    if (state.currentChapter === chapterId) {
      return { ok: false, reason: `Already in chapter '${chapterId}'.` };
    }
    return true;
  },

  apply: (state: GameState, payload: ChapterEnterPayload, content: GameContent) => {
    const { chapterId } = payload;
    const chData = content.chapters[chapterId];
    const initialArea = chData.areas[0]?.id ?? `${chapterId}-s1`;

    const nextState: GameState = {
      ...state,
      currentChapter: chapterId,
      journey: {
        ...state.journey,
        [chapterId]: {
          ...state.journey[chapterId],
          currentArea: initialArea,
          navStack: []
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'areaEntered',
          payload: { areaId: initialArea }
        }
      ]
    };
  },

  invert: (state: GameState, _payload: ChapterEnterPayload) => {
    return {
      type: 'chapter/enter',
      payload: { chapterId: state.currentChapter }
    };
  }
};

// ==========================================
// 2. chapter/replay (reversible)
// ==========================================

export interface ChapterReplayPayload {
  chapterId: ChapterId;
}

export const chapterReplayCommand: CommandDef<ChapterReplayPayload> = {
  type: 'chapter/replay',
  kind: 'reversible',

  guard: (state: GameState, payload: ChapterReplayPayload, content: GameContent) => {
    const { chapterId } = payload;
    if (!chapterId || !content.chapters[chapterId]) {
      return { ok: false, reason: `Chapter '${chapterId}' does not exist.` };
    }
    const chProgress = state.journey[chapterId];
    if (!chProgress || chProgress.status !== 'completed') {
      return {
        ok: false,
        reason: `Cannot replay chapter '${chapterId}' because it has not been completed yet.`
      };
    }
    return true;
  },

  apply: (state: GameState, payload: ChapterReplayPayload, content: GameContent) => {
    const { chapterId } = payload;
    const chData = content.chapters[chapterId];
    const initialArea = chData.areas[0]?.id ?? `${chapterId}-s1`;
    const oldProgress = state.journey[chapterId];

    const nextState: GameState = {
      ...state,
      currentChapter: chapterId,
      journey: {
        ...state.journey,
        [chapterId]: {
          ...oldProgress,
          currentArea: initialArea,
          side: 'mat_phai',
          navStack: [],
          completedDialogueIds: [],
          solvedPuzzleIds: [],
          hintTiers: {},
          activeDialogue: null,
          claimed: oldProgress.claimed // Giữ nguyên cờ claimed vĩnh viễn
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'areaEntered',
          payload: { areaId: initialArea }
        }
      ]
    };
  },

  invert: (state: GameState, _payload: ChapterReplayPayload) => {
    return {
      type: 'chapter/enter',
      payload: { chapterId: state.currentChapter }
    };
  }
};

// ==========================================
// 3. chapter/complete (one-way)
// ==========================================

export interface ChapterCompletePayload {
  chapterId?: ChapterId;
}

export const chapterCompleteCommand: CommandDef<ChapterCompletePayload> = {
  type: 'chapter/complete',
  kind: 'one-way',

  guard: (state: GameState, payload: ChapterCompletePayload, content: GameContent) => {
    const chId = payload.chapterId ?? state.currentChapter;
    const chProgress = state.journey[chId];
    const chData = content.chapters[chId];

    if (!chProgress || !chData) {
      return { ok: false, reason: `Chapter '${chId}' does not exist.` };
    }

    if (chProgress.claimed) {
      return { ok: false, reason: `Chapter '${chId}' reward has already been claimed.` };
    }

    if (chId !== state.currentChapter || chProgress.status === 'locked') return { ok: false, reason: 'Chapter is not currently playable.' };
    const ending = chData.chapter.completionDialogueId;
    if (ending && !chProgress.completedDialogueIds.includes(ending)) return { ok: false, reason: 'Read the ending before completing the chapter.' };

    // Verify all declared puzzles in the chapter are solved
    const solvedSet = new Set(chProgress.solvedPuzzleIds);
    for (const puzzle of chData.puzzles) {
      if (!solvedSet.has(puzzle.id)) {
        return {
          ok: false,
          reason: `Cannot complete chapter '${chId}': puzzle '${puzzle.id}' is not yet solved.`
        };
      }
    }

    return true;
  },

  apply: (state: GameState, payload: ChapterCompletePayload, content: GameContent) => {
    const chId = payload.chapterId ?? state.currentChapter;
    const oldProgress = state.journey[chId];

    // Determine next chapter to unlock if any
    const nextJourney = { ...state.journey };
    nextJourney[chId] = {
      ...oldProgress,
      status: 'completed'
    };

    const chapterOrder = content.chapterOrder as ChapterId[];
    const currentIndex = chapterOrder.indexOf(chId);
    if (currentIndex >= 0 && currentIndex + 1 < chapterOrder.length) {
      const nextChId = chapterOrder[currentIndex + 1];
      if (nextJourney[nextChId] && nextJourney[nextChId].status === 'locked') {
        nextJourney[nextChId] = {
          ...nextJourney[nextChId],
          status: 'in_progress'
        };
      }
    }

    const nextState: GameState = {
      ...state,
      journey: nextJourney
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: () => null
};
