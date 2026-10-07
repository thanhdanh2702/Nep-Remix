import { enqueueDialogues } from './dialogue-queue.ts';
import { guardPuzzle, isGateSatisfied } from './gate.ts';
import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { Interactable } from '../../../content/schema.ts';

export interface InteractPayload {
  targetId: string;
  playerPos: {
    x: number;
    y: number;
  };
}

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 500;
const RECT_EXPAND_RATIO = 0.02; // 0.02 * 800 = 16px logic

function matchesSide(interactableSide: 'phai' | 'trai' | 'ca_hai', currentSide: 'mat_phai' | 'mat_trai'): boolean {
  if (interactableSide === 'ca_hai') return true;
  if (interactableSide === 'phai' && currentSide === 'mat_phai') return true;
  if (interactableSide === 'trai' && currentSide === 'mat_trai') return true;
  return false;
}

function isPlayerInRange(
  interactable: Interactable,
  playerPos: { x: number; y: number }
): { inRange: boolean; distancePx: number } {
  // 1. Distance in logical pixels from center
  const dx = (interactable.pos.x - playerPos.x) * LOGICAL_WIDTH;
  const dy = (interactable.pos.y - playerPos.y) * LOGICAL_HEIGHT;
  const distancePx = Math.hypot(dx, dy);

  const radiusPx = interactable.radius * LOGICAL_WIDTH;
  let inRange = distancePx <= radiusPx;

  // 2. Rect expanded check if interactable has rect defined
  if (!inRange && interactable.rect) {
    const minX = interactable.rect.x - RECT_EXPAND_RATIO;
    const maxX = interactable.rect.x + interactable.rect.w + RECT_EXPAND_RATIO;
    const minY = interactable.rect.y - RECT_EXPAND_RATIO;
    const maxY = interactable.rect.y + interactable.rect.h + RECT_EXPAND_RATIO;

    if (
      playerPos.x >= minX &&
      playerPos.x <= maxX &&
      playerPos.y >= minY &&
      playerPos.y <= maxY
    ) {
      inRange = true;
    }
  }

  return { inRange, distancePx };
}

// ==========================================
// Pure Helper: nearestInteractable
// ==========================================

export function nearestInteractable(
  state: GameState,
  content: GameContent,
  playerPos: { x: number; y: number }
): string | null {
  const chId = state.currentChapter;
  const chData = content.chapters[chId];
  const chProgress = state.journey[chId];

  if (!chData || !chProgress) return null;

  const currentArea = chData.areas.find((a) => a.id === chProgress.currentArea);
  if (!currentArea) return null;

  let closestId: string | null = null;
  let minDistance = Infinity;

  for (const interactable of currentArea.interactables) {
    if (interactable.action.type === 'item' && state.inventory.itemIds.includes(interactable.action.targetId)) continue;
    if (interactable.action.type === 'puzzle') {
      if (chProgress.solvedPuzzleIds.includes(interactable.action.targetId)) continue;
      const puzzle = chData.puzzles.find(p => p.id === interactable.action.targetId);
      if (puzzle?.prerequisitePuzzleIds?.some(id => !chProgress.solvedPuzzleIds.includes(id))) continue;
    }
    if (!matchesSide(interactable.side, chProgress.side)) {
      continue;
    }

    const { inRange, distancePx } = isPlayerInRange(interactable, playerPos);
    if (inRange && distancePx < minDistance) {
      minDistance = distancePx;
      closestId = interactable.id;
    }
  }

  return closestId;
}

// ==========================================
// Command: interact (compensable)
// ==========================================

export const interactCommand: CommandDef<InteractPayload> = {
  type: 'interact',
  kind: 'compensable',

  guard: (state: GameState, payload: InteractPayload, content: GameContent) => {
    const { targetId, playerPos } = payload;
    if (!targetId) {
      return { ok: false, reason: 'Target ID is required for interaction.' };
    }
    if (!playerPos || !Number.isFinite(playerPos.x) || !Number.isFinite(playerPos.y) || playerPos.x < 0 || playerPos.x > 1 || playerPos.y < 0 || playerPos.y > 1) {
      return { ok: false, reason: 'Player position is required for interaction.' };
    }

    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];

    if (!chData || !chProgress) {
      return { ok: false, reason: `Invalid chapter '${chId}'.` };
    }

    const currentArea = chData.areas.find((a) => a.id === chProgress.currentArea);
    if (!currentArea) {
      return { ok: false, reason: `Area '${chProgress.currentArea}' not found in content.` };
    }

    const interactable = currentArea.interactables.find((i) => i.id === targetId);
    if (!interactable) {
      return {
        ok: false,
        reason: `Target '${targetId}' does not belong to current area '${currentArea.id}'.`
      };
    }

    if (!matchesSide(interactable.side, chProgress.side)) {
      return {
        ok: false,
        reason: `Target '${targetId}' is on side '${interactable.side}', player is on '${chProgress.side}'.`
      };
    }

    if (!isGateSatisfied(state, interactable.when)) return { ok: false, reason: 'Interaction prerequisites are not completed.' };
    if (interactable.action.type === 'puzzle') {
      const guarded = guardPuzzle(state, interactable.action.targetId, content, false);
      if (guarded !== true) return guarded;
    }
    if (interactable.action.type === 'dialogue') {
      const dialogue = chData.dialogues.find(d => d.id === interactable.action.targetId);
      if (!dialogue || !isGateSatisfied(state, dialogue.when)) return { ok: false, reason: 'Dialogue prerequisites are not completed.' };
      if (chProgress.completedDialogueIds.includes(dialogue.id) && chProgress.activeDialogue
        && chProgress.activeDialogue.dialogueId !== dialogue.id) {
        return { ok: false, reason: 'Hãy đọc xong lời kể hiện tại trước khi xem lại.' };
      }
    }
    const { inRange } = isPlayerInRange(interactable, playerPos);
    if (!inRange) {
      return {
        ok: false,
        reason: `Player is too far from target '${targetId}'.`
      };
    }

    return true;
  },

  apply: (state: GameState, payload: InteractPayload, content: GameContent) => {
    const { targetId } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];
    const currentArea = chData.areas.find((a) => a.id === chProgress.currentArea)!;
    const interactable = currentArea.interactables.find((i) => i.id === targetId)!;

    const events: any[] = [];
    let nextState = state;

    if (interactable.action.type === 'dialogue') {
      const dialogueId = interactable.action.targetId;
      const dialogueDef = chData.dialogues.find((d) => d.id === dialogueId);

      if (dialogueDef) nextState = enqueueDialogues(state, [dialogueId], content, 'interaction');
    } else if (interactable.action.type === 'item') {
      const itemId = interactable.action.targetId;
      if (!state.inventory.itemIds.includes(itemId)) {
        nextState = {
          ...nextState,
          inventory: {
            ...state.inventory,
            itemIds: [...state.inventory.itemIds, itemId]
          }
        };
        events.push({
          type: 'itemPicked',
          payload: { itemId }
        });
      }
    } else if (interactable.action.type === 'puzzle') {
      const puzzleId = interactable.action.targetId;
      const puzzleDef = chData.puzzles.find((p) => p.id === puzzleId);

      if (puzzleDef && puzzleDef.hasSession && !state.activeSession) {
        nextState = {
          ...nextState,
          activeSession: {
            type: 'puzzle',
            puzzleId,
            chapterId: chId,
            puzzleType: puzzleDef.type,
            valid: false,
            data: {},
            history: []
          }
        };
      }
    }

    return {
      state: nextState,
      events
    };
  },

  invert: (state: GameState) => {
    return {
      type: 'interact/undo',
      payload: { previousState: state }
    };
  }
};
