import type { Command } from '../command.ts';
import type { StudioDraft, PuzzleDraft } from '../state.ts';

// ==========================================
// 1. Scoped Session Interface
// ==========================================
// Shared sub-tree for Studio and Multi-step Puzzles
// Exactly one session active at any given moment

export type SessionType = 'studio' | 'puzzle';

export interface ScopedSession<T = StudioDraft | PuzzleDraft> {
  type: SessionType;
  initialDraft: T;
  current: T;
  history: T[]; // Undo stack
  future: T[]; // Redo stack
}

// ==========================================
// 2. Session Factory
// ==========================================

export function createScopedSession<T extends StudioDraft | PuzzleDraft>(
  initialDraft: T,
  type: SessionType
): ScopedSession<T> {
  return {
    type,
    initialDraft: structuredClone(initialDraft),
    current: structuredClone(initialDraft),
    history: [],
    future: []
  };
}

// ==========================================
// 3. Sub-tree Operations (Immutable)
// ==========================================

export function dispatchSession<T>(
  session: ScopedSession<T>,
  mutator: (current: T) => T
): ScopedSession<T> {
  const nextDraft = mutator(structuredClone(session.current));

  return {
    ...session,
    current: nextDraft,
    history: [...session.history, session.current],
    future: [] // Clear redo branch on new action
  };
}

export function undoSession<T>(
  session: ScopedSession<T>
): { ok: boolean; session: ScopedSession<T> } {
  if (session.history.length === 0) {
    return { ok: false, session };
  }

  const prevHistory = [...session.history];
  const previous = prevHistory.pop()!;

  return {
    ok: true,
    session: {
      ...session,
      current: previous,
      history: prevHistory,
      future: [session.current, ...session.future]
    }
  };
}

export function redoSession<T>(
  session: ScopedSession<T>
): { ok: boolean; session: ScopedSession<T> } {
  if (session.future.length === 0) {
    return { ok: false, session };
  }

  const prevFuture = [...session.future];
  const next = prevFuture.shift()!;

  return {
    ok: true,
    session: {
      ...session,
      current: next,
      history: [...session.history, session.current],
      future: prevFuture
    }
  };
}

export function resetSession<T>(session: ScopedSession<T>): ScopedSession<T> {
  return {
    ...session,
    current: structuredClone(session.initialDraft),
    history: [...session.history, session.current],
    future: []
  };
}

// ==========================================
// 4. Commit and Cancel Contract
// ==========================================

export type CommitResult =
  | { ok: true; command: Command }
  | { ok: false; reason: string };

/**
 * Commits the session sub-tree into exactly ONE command for the game tree:
 * - Studio -> closet/saveOutfit
 * - Puzzle -> puzzle/solve (only if puzzle/check marked valid === true)
 */
export function commitSession(session: ScopedSession<any>): CommitResult {
  if (session.type === 'studio') {
    const draft = session.current as StudioDraft;
    return {
      ok: true,
      command: {
        type: 'closet/saveOutfit',
        payload: {
          garmentId: draft.garmentId,
          equippedAccessories: draft.equippedAccessories,
          colorPalette: draft.colorPalette,
          motifId: draft.motifId
        }
      }
    };
  }

  if (session.type === 'puzzle') {
    const draft = session.current as PuzzleDraft;
    if (!draft.valid) {
      return {
        ok: false,
        reason: 'Không thể commit câu đố: chưa vượt qua kiểm tra lời giải (valid !== true).'
      };
    }

    return {
      ok: true,
      command: {
        type: 'puzzle/submit',
        payload: {
          puzzleId: draft.puzzleId,
          answer: draft.data.answer
        }
      }
    };
  }

  return {
    ok: false,
    reason: `Unknown session type: '${session.type}'.`
  };
}

/**
 * Cancels the session without emitting any command to the game tree.
 */
export function cancelSession(_session: ScopedSession<any>): null {
  return null;
}
