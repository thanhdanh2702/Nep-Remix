import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { applyPuzzleSolved } from './puzzle-solution.ts';

// Known item combinations from puzzles and game scripts
const COMBINATION_RECIPES: Record<string, string> = {
  // c1: con_thoi_go_mun + that_lung_lua_cham -> dung_cu_moc_then_cua
  'con_thoi_go_mun+that_lung_lua_cham': 'dung_cu_moc_then_cua',
  'that_lung_lua_cham+con_thoi_go_mun': 'dung_cu_moc_then_cua'
};

// ==========================================
// 1. item/pick (reversible)
// ==========================================

export interface ItemPickPayload {
  itemId: string;
}

export const itemPickCommand: CommandDef<ItemPickPayload> = {
  type: 'item/pick',
  kind: 'reversible',

  guard: (state: GameState, payload: ItemPickPayload, content: GameContent) => {
    const { itemId } = payload;
    if (!itemId || !content.itemsById.has(itemId)) {
      return { ok: false, reason: `Item '${itemId}' does not exist in items catalog.` };
    }
    if (state.inventory.itemIds.includes(itemId)) {
      return { ok: false, reason: `Item '${itemId}' is already in inventory.` };
    }
    return true;
  },

  apply: (state: GameState, payload: ItemPickPayload) => {
    const { itemId } = payload;
    const nextState: GameState = {
      ...state,
      inventory: {
        ...state.inventory,
        itemIds: [...state.inventory.itemIds, itemId]
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'itemPicked',
          payload: { itemId }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: ItemPickPayload) => {
    return {
      type: 'item/remove',
      payload: { itemId: payload.itemId }
    };
  }
};

// ==========================================
// 2. item/use (reversible)
// ==========================================

export interface ItemUsePayload {
  itemId: string;
  targetPuzzleId?: string;
}

export const itemUseCommand: CommandDef<ItemUsePayload> = {
  type: 'item/use',
  kind: 'reversible',

  guard: (state: GameState, payload: ItemUsePayload, content: GameContent) => {
    const { itemId } = payload;
    if (!itemId || !content.itemsById.has(itemId)) {
      return { ok: false, reason: `Item '${itemId}' does not exist in items catalog.` };
    }
    if (!state.inventory.itemIds.includes(itemId)) {
      return { ok: false, reason: `Item '${itemId}' is not in inventory.` };
    }
    return true;
  },

  apply: (state: GameState, payload: ItemUsePayload, content: GameContent) => {
    const { itemId, targetPuzzleId } = payload;
    const itemDef = content.itemsById.get(itemId)!;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];

    const events: any[] = [];
    let nextInventory = state.inventory.itemIds;
    let nextProgress = { ...chProgress };
    let nextNotebook = state.notebook;

    if (targetPuzzleId && chData) {
      const puzzle = chData.puzzles.find((p) => p.id === targetPuzzleId);
      if (puzzle && puzzle.type === 'use') {
        const requiredItem = puzzle.solution.requiredItemId;
        const requiredList = puzzle.solution.requiredItemIds;
        const isMatch = requiredItem === itemId || (requiredList && requiredList.includes(itemId as any));

        if (isMatch) {
          // Solved puzzle: shared rewards / unlocks / dialogue transition
          const solved = applyPuzzleSolved(state, puzzle, content);
          nextInventory = solved.state.inventory.itemIds;
          nextProgress = solved.state.journey[chId];
          nextNotebook = solved.state.notebook;
          events.push(...solved.events);

          // Consume item if consumable
          if (itemDef.consumable) {
            nextInventory = nextInventory.filter((id) => id !== itemId);
          }
        } else {
          events.push({
            type: 'puzzleFeedback',
            payload: { puzzleId: targetPuzzleId, result: 'incorrect' }
          });
        }
      }
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
        [chId]: nextProgress
      }
    };

    return {
      state: nextState,
      events
    };
  },

  invert: (_state: GameState, payload: ItemUsePayload) => {
    return {
      type: 'item/pick',
      payload: { itemId: payload.itemId }
    };
  }
};

// ==========================================
// 3. item/combine (reversible)
// ==========================================

export interface ItemCombinePayload {
  itemIds: [string, string];
}

export const itemCombineCommand: CommandDef<ItemCombinePayload> = {
  type: 'item/combine',
  kind: 'reversible',

  guard: (state: GameState, payload: ItemCombinePayload, content: GameContent) => {
    const { itemIds } = payload;
    if (!itemIds || itemIds.length !== 2) {
      return { ok: false, reason: 'Exactly two item IDs are required for combining.' };
    }
    const [idA, idB] = itemIds;
    if (!state.inventory.itemIds.includes(idA) || !state.inventory.itemIds.includes(idB)) {
      return { ok: false, reason: 'Both items must be present in inventory to combine.' };
    }

    const key = `${idA}+${idB}`;
    const outputItemId = COMBINATION_RECIPES[key];
    if (!outputItemId || !content.itemsById.has(outputItemId)) {
      return { ok: false, reason: `Items '${idA}' and '${idB}' cannot be combined.` };
    }

    return true;
  },

  apply: (state: GameState, payload: ItemCombinePayload) => {
    const [idA, idB] = payload.itemIds;
    const key = `${idA}+${idB}`;
    const outputItemId = COMBINATION_RECIPES[key];

    // Remove components and add combined item
    const remaining = state.inventory.itemIds.filter((id) => id !== idA && id !== idB);
    const nextInventory = [...remaining, outputItemId];

    const nextState: GameState = {
      ...state,
      inventory: {
        ...state.inventory,
        itemIds: nextInventory
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'itemPicked',
          payload: { itemId: outputItemId }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: ItemCombinePayload) => {
    const itemIds = payload?.itemIds ?? ['', ''];
    const [idA, idB] = itemIds;
    const key = `${idA}+${idB}`;
    const outputItemId = COMBINATION_RECIPES[key] ?? '';

    return {
      type: 'item/decompose',
      payload: { outputItemId, originalItemIds: [idA, idB] }
    };
  }
};
