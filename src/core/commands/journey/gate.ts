import type { Gate } from '../../../content/schema.ts';
import type { GameContent } from '../../../content/index.ts';
import type { GameState } from '../../state.ts';
import type { GuardResult } from '../../command.ts';

export function isGateSatisfied(state: GameState, gate?: Gate): boolean {
  const progress = state.journey[state.currentChapter];
  return !gate || gate.all.every(r => r.kind === 'puzzleSolved'
    ? progress.solvedPuzzleIds.includes(r.puzzleId)
    : r.kind === 'dialogueCompleted' ? progress.completedDialogueIds.includes(r.dialogueId)
    : state.inventory.itemIds.includes(r.itemId));
}

export function guardPuzzle(state: GameState, puzzleId: unknown, content: GameContent, requireOwned = true): GuardResult {
  const chapter = content.chapters[state.currentChapter];
  const progress = state.journey[state.currentChapter];
  const puzzle = chapter?.puzzles.find(p => p.id === puzzleId);
  if (!puzzle || !progress || progress.status === 'locked') return { ok: false, reason: 'Puzzle is unavailable in this chapter.' };
  const area = chapter.areas.find(a => a.id === progress.currentArea);
  const hotspot = area?.interactables.find(i => i.action.type === 'puzzle' && i.action.targetId === puzzleId
    && (i.side === 'ca_hai' || i.side === (progress.side === 'mat_phai' ? 'phai' : 'trai')));
  if (!hotspot) return { ok: false, reason: 'Puzzle is not accessible in this room and side.' };
  if (progress.solvedPuzzleIds.includes(puzzle.id)) return { ok: false, reason: `Câu đố '${puzzle.id}' đã được giải.` };
  if (!isGateSatisfied(state, puzzle.when) || !isGateSatisfied(state, hotspot.when)
    || puzzle.prerequisitePuzzleIds?.some(id => !progress.solvedPuzzleIds.includes(id))) return { ok: false, reason: 'Puzzle prerequisites are not completed.' };
  const required = puzzle.type === 'present' ? [puzzle.solution.presentedItemId]
    : puzzle.type === 'use' ? [puzzle.solution.requiredItemId, ...(puzzle.solution.requiredItemIds ?? [])].filter((id): id is NonNullable<typeof id> => !!id)
    : puzzle.type === 'order' ? puzzle.solution.requiredItemIds ?? [] : [];
  if (requireOwned && required.some(id => !state.inventory.itemIds.includes(id))) return { ok: false, reason: 'Required evidence or items are missing.' };
  return true;
}
