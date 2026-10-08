import { enqueueDialogues } from './dialogue-queue.ts';
import type { DomainEvent } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { Puzzle } from '../../../content/schema.ts';

// Reward / dialogue / unlock fields live on different solution variants of the Puzzle union,
// so they are read through one optional-field view instead of per-type narrowing.
interface SolutionExtras {
  rewardItemId?: string;
  rewardItemIds?: string[];
  dialogueTriggerId?: string;
  dialogueTriggerIds?: string[];
  unlocksAreaId?: string;
}

/** Shared idempotent solve transition: explicit rewards/unlocks and ordered dialogue queue. */
export function applyPuzzleSolved(
  state: GameState,
  puzzle: Puzzle,
  content: GameContent
): { state: GameState; events: DomainEvent[] } {
  const chId = state.currentChapter;
  const chProgress = state.journey[chId];

  if (chProgress.solvedPuzzleIds.includes(puzzle.id)) return { state, events: [] };

  const solution = puzzle.solution as SolutionExtras;
  const events: DomainEvent[] = [{ type: 'puzzleSolved', payload: { puzzleId: puzzle.id } }];

  // Reward items
  let itemIds = state.inventory.itemIds;
  const rewards = [solution.rewardItemId, ...(solution.rewardItemIds ?? [])];
  for (const itemId of rewards) {
    if (itemId && !itemIds.includes(itemId)) {
      itemIds = [...itemIds, itemId];
      events.push({ type: 'itemPicked', payload: { itemId } });
    }
  }

  // Unlock only an explicit solution target; never infer all exits from any solve.
  const unlockedAreaIds = solution.unlocksAreaId && !chProgress.unlockedAreaIds.includes(solution.unlocksAreaId)
    ? [...chProgress.unlockedAreaIds, solution.unlocksAreaId] : chProgress.unlockedAreaIds;
  const solvedState: GameState = { ...state, inventory: { ...state.inventory, itemIds },
    journey: { ...state.journey, [chId]: { ...chProgress, solvedPuzzleIds: [...chProgress.solvedPuzzleIds, puzzle.id] } } };
  const queued = enqueueDialogues(solvedState, [solution.dialogueTriggerId, ...(solution.dialogueTriggerIds ?? [])], content);

  return {
    state: {
      ...state,
      activeSession: state.activeSession?.type === 'puzzle' && state.activeSession.puzzleId === puzzle.id
        ? null : state.activeSession,
      inventory: { ...state.inventory, itemIds },
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          solvedPuzzleIds: [...chProgress.solvedPuzzleIds, puzzle.id],
          unlockedAreaIds,
          activeDialogue: queued.journey[chId].activeDialogue,
          dialogueQueue: queued.journey[chId].dialogueQueue
        }
      }
    },
    events
  };
}
