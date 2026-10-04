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

/**
 * Shared "puzzle solved" transition for puzzle/submit and item/use:
 * marks the puzzle solved, grants reward items, unlocks areas (explicit target + every exit of the
 * current area), collects the first-node clue of each triggered dialogue and opens the first one.
 * Idempotent: an already solved puzzle returns the state untouched (no double reward).
 */
export function applyPuzzleSolved(
  state: GameState,
  puzzle: Puzzle,
  content: GameContent
): { state: GameState; events: DomainEvent[] } {
  const chId = state.currentChapter;
  const chData = content.chapters[chId];
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

  // Area unlocks: explicit target, then every exit of the room the player solved it in
  let unlockedAreaIds = chProgress.unlockedAreaIds;
  const currentArea = chData.areas.find((a) => a.id === chProgress.currentArea);
  const unlocks = [solution.unlocksAreaId, ...Object.values(currentArea?.exits ?? {})];
  for (const areaId of unlocks) {
    if (areaId && !unlockedAreaIds.includes(areaId)) unlockedAreaIds = [...unlockedAreaIds, areaId];
  }

  // Dialogues: every triggered dialogue yields its first-node clue; the first one becomes active.
  let notebook = state.notebook;
  let activeDialogue = chProgress.activeDialogue;
  const triggerIds = [...new Set([solution.dialogueTriggerId, ...(solution.dialogueTriggerIds ?? [])])];
  let opened = false;
  for (const dialogueId of triggerIds) {
    const dialogue = chData.dialogues.find((d) => d.id === dialogueId);
    const firstNode = dialogue?.nodes[0];
    if (!dialogue || !firstNode) continue;
    if (firstNode.clueId && !notebook.unlockedClueIds.includes(firstNode.clueId)) {
      notebook = { ...notebook, unlockedClueIds: [...notebook.unlockedClueIds, firstNode.clueId] };
      events.push({ type: 'clueCollected', payload: { clueId: firstNode.clueId } });
    }
    if (!opened) {
      activeDialogue = { dialogueId: dialogue.id, currentNodeId: firstNode.id, history: [firstNode.id] };
      opened = true;
    }
  }

  return {
    state: {
      ...state,
      notebook,
      inventory: { ...state.inventory, itemIds },
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          solvedPuzzleIds: [...chProgress.solvedPuzzleIds, puzzle.id],
          unlockedAreaIds,
          activeDialogue
        }
      }
    },
    events
  };
}
