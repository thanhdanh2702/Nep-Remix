import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { guardPuzzle, isGateSatisfied } from './gate.ts';
import { puzzleSubmitCommand } from './puzzle-commands.ts';

// Known item combinations from puzzles and game scripts
export const COMBINATION_RECIPES: Record<string, string> = {
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
    const progress = state.journey[state.currentChapter];
    const area = content.chapters[state.currentChapter].areas.find(a => a.id === progress.currentArea);
    const hotspot = area?.interactables.find(i => i.action.type === 'item' && i.action.targetId === itemId
      && (i.side === 'ca_hai' || i.side === (progress.side === 'mat_phai' ? 'phai' : 'trai')) && isGateSatisfied(state, i.when));
    if (!hotspot || progress.status === 'locked') return { ok: false, reason: 'Item is not available for pickup in this room.' };
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
    const guarded = guardPuzzle(state, payload.targetPuzzleId, content);
    if (guarded !== true) return guarded;
    const puzzle = content.chapters[state.currentChapter].puzzles.find(p => p.id === payload.targetPuzzleId)!;
    if (puzzle.type !== 'use' && puzzle.type !== 'present') return { ok: false, reason: 'This puzzle does not accept item/use.' };
    return true;
  },

  apply: (state, payload, content) => puzzleSubmitCommand.apply(state,
    { puzzleId: payload.targetPuzzleId!, answer: payload.itemId }, content),

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
    if (!Array.isArray(itemIds) || itemIds.length !== 2 || new Set(itemIds).size !== 2) {
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
    const nextInventory = [...new Set([...remaining, outputItemId])];

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
