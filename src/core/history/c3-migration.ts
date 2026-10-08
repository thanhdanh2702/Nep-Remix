import { validC3StoredDraft } from '../commands/journey/c3-draft.ts';
import type { GameState } from '../state.ts';
import type { GameContent } from '../../content/index.ts';
import { isGateSatisfied, guardPuzzle } from '../commands/journey/gate.ts';
import { reconcileC3Progress } from '../commands/journey/c3-progress.ts';
import { validateChallengeStudioDraft } from '../commands/studio/challenge-wardrobe.ts';

/** Migrate C3 independently of C2. No currency, ownership loans, reads, solves or completions are inferred. */
export function migrateC3Snapshot(state: GameState, content: GameContent, legacy: boolean): GameState {
  const p = state.journey.c3;
  const chapter = content.chapters.c3;
  if (!p || !chapter) return state;
  const context = () => ({ ...state, currentChapter: 'c3' as const });
  p.puzzleDrafts ??= {};
  p.dialogueQueue ??= [];
  p.side = 'mat_phai';
  if (legacy && p.status !== 'locked') {
    p.activeDialogue = null;
    p.dialogueQueue = [];
    if (!p.claimed) {
      p.completedDialogueIds = [];
      const oldClues = new Set<string>(content.clues.filter(c => c.discoveredInDialogueId.startsWith('d-c3-')).map(c => c.id));
      state.notebook.unlockedClueIds = state.notebook.unlockedClueIds.filter(id => !oldClues.has(id));
      // A recorded chest solve earned both papers even in older builds. Repair only earned evidence.
      if (p.solvedPuzzleIds.includes('p-c3-bagua-lock')) {
        state.inventory.itemIds = [...new Set([...state.inventory.itemIds,
          'so_tu_vi_nguyen_ban_1962', 'thu_tay_thoa_thuan_boi_toan'])];
      }
      const receiptRead = chapter.dialogues.find(d => d.id === 'd-c3-mua-chuoc')!;
      if (isGateSatisfied(context(), receiptRead.when)) {
        const node = receiptRead.nodes[0].id;
        p.activeDialogue = { dialogueId: receiptRead.id, currentNodeId: node, history: [node] };
      }
    }
  }
  // A stale/invalid area resumes at the earliest missing prerequisite in this chapter.
  // Current-format valid saves keep their exact room; old unclaimed reads are reset above.
  if ((legacy && !p.claimed && p.status !== 'locked') || !chapter.areas.some(a => a.id === p.currentArea)) {
    const [s1,s2,s3] = chapter.areas;
    p.currentArea = !isGateSatisfied(context(), s1.exitGates?.street) ? s1.id
      : !isGateSatisfied(context(), s2.exitGates?.mansion) ? s2.id : s3.id;
    p.navStack = [];
  }
  p.navStack = p.navStack.filter(id => chapter.areas.some(a => a.id === id));
  p.unlockedAreaIds = [...new Set([chapter.areas[0].id, ...p.unlockedAreaIds.filter(id => chapter.areas.some(a => a.id === id)), p.currentArea])];
  for (const [id,draft] of Object.entries(p.puzzleDrafts)) {
    if (!validC3StoredDraft(state,id,draft,content)) delete p.puzzleDrafts[id];
  }
  if (state.activeSession?.type === 'puzzle' && state.activeSession.chapterId === 'c3') {
    const session = state.activeSession;
    const puzzle = chapter.puzzles.find(puzzle => puzzle.id === session.puzzleId);
    if (state.currentChapter !== 'c3' || !puzzle || session.puzzleType !== puzzle.type
      || !session.data || typeof session.data !== 'object' || Array.isArray(session.data)
      || guardPuzzle(context(), session.puzzleId, content, false) !== true
      || (session.data.answer !== undefined && !validC3StoredDraft(state, session.puzzleId, { type: session.puzzleType, answer: session.data.answer }, content))) {
      state.activeSession = null;
    } else {
      // Persisted draft is authoritative; valid/check flags never authorize a solve.
      state.activeSession = { ...session, valid: false, data: p.puzzleDrafts[session.puzzleId]
        ? { answer: p.puzzleDrafts[session.puzzleId].answer } : {} };
    }
  }
  if (state.activeSession?.type === 'studio' && state.activeSession.challengePuzzleId?.startsWith('p-c3-')
    && (state.currentChapter !== 'c3' || !validateChallengeStudioDraft(context(), state.activeSession.challengePuzzleId, state.activeSession, content).ok)) {
    state.activeSession = null;
  }
  const recovered = reconcileC3Progress(context(), content).journey.c3;
  return { ...state, journey: { ...state.journey, c3: recovered } };
}
