import type { CommandDef } from '../../command.ts';
import type { GameState, StudioDraft, SavedOutfit } from '../../state.ts';
import { validateStudioDraft } from '../studio/challenge-wardrobe.ts';

// ==========================================
// 1. closet/saveOutfit (reversible)
// ==========================================
// Converts active StudioDraft into a permanent SavedOutfit and closes draft

export interface ClosetSaveOutfitPayload {
  id?: string;
  name?: string;
  garmentId?: string;
  equippedAccessories?: Record<string, string | undefined>;
  colorPalette?: [string, string, string, string];
  bottomPalette?: [string, string, string, string];
  motifId?: string;
}

export const closetSaveOutfitCommand: CommandDef<ClosetSaveOutfitPayload> = {
  type: 'closet/saveOutfit',
  kind: 'reversible',

  guard: (state, payload, content) => {
    const session = state.activeSession?.type === 'studio' ? state.activeSession : null;
    if (!payload.garmentId && !session) return { ok: false, reason: 'No Studio outfit to save.' };
    const garmentId = payload.garmentId ?? session!.garmentId;
    const valid = validateStudioDraft(state, { type: 'studio', garmentId,
      silhouette: content.garmentsById.get(garmentId)?.silhouette ?? 'tu_than',
      equippedAccessories: payload.equippedAccessories ?? session?.equippedAccessories ?? {},
      colorPalette: payload.colorPalette ?? session?.colorPalette ?? ['#FFF','#FFF','#FFF','#000'],
      motifId: payload.motifId ?? session?.motifId }, content, true);
    return valid.ok ? true : valid;
  },

  apply: (state: GameState, payload: ClosetSaveOutfitPayload) => {
    const session = (state.activeSession?.type === 'studio' ? state.activeSession : null) as StudioDraft | null;
    const outfitIndex = state.closet.savedOutfits.length + 1;
    const outfitId = payload.id ?? `outfit-${outfitIndex}`;
    const outfitName = payload.name ?? `Trang phục ${outfitIndex}`;

    const garmentId = payload.garmentId ?? session?.garmentId ?? 'ao-tu-than';
    const equippedAccessories = payload.equippedAccessories ?? session?.equippedAccessories ?? {};
    const colorPalette = payload.colorPalette ?? session?.colorPalette ?? ['#FFF', '#FFF', '#FFF', '#000'];
    const motifId = payload.motifId ?? session?.motifId;
    const bottomPalette = payload.bottomPalette ?? session?.bottomPalette;

    const newOutfit: SavedOutfit = {
      id: outfitId,
      name: outfitName,
      garmentId,
      equippedAccessories: { ...equippedAccessories },
      colorPalette: [...colorPalette],
      ...(bottomPalette ? { bottomPalette: [...bottomPalette] as [string, string, string, string] } : {}),
      motifId,
      createdAt: '1970-01-01T00:00:00.000Z'
    };

    const nextState: GameState = {
      ...state,
      activeSession: null, // Draft is closed upon saving
      closet: {
        ...state.closet,
        savedOutfits: [...state.closet.savedOutfits, newOutfit]
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitSaved',
          payload: { outfitId }
        }
      ]
    };
  },

  invert: (state: GameState, payload: ClosetSaveOutfitPayload) => {
    const targetId = payload?.id ?? state.closet.savedOutfits[state.closet.savedOutfits.length - 1]?.id ?? 'outfit-1';
    return {
      type: 'closet/deleteOutfit',
      payload: { outfitId: targetId }
    };
  }
};

// ==========================================
// 2. closet/renameOutfit (reversible)
// ==========================================

export interface ClosetRenameOutfitPayload {
  outfitId: string;
  newName: string;
  previousName?: string;
}

export const closetRenameOutfitCommand: CommandDef<ClosetRenameOutfitPayload> = {
  type: 'closet/renameOutfit',
  kind: 'reversible',

  guard: (state: GameState, payload: ClosetRenameOutfitPayload) => {
    const outfit = state.closet.savedOutfits.find((o) => o.id === payload.outfitId);
    if (!outfit) {
      return { ok: false, reason: `Saved outfit '${payload.outfitId}' not found.` };
    }
    if (!payload.newName || payload.newName.trim() === '') {
      return { ok: false, reason: 'New outfit name cannot be empty.' };
    }
    return true;
  },

  apply: (state: GameState, payload: ClosetRenameOutfitPayload) => {
    const nextSaved = state.closet.savedOutfits.map((o) => {
      if (o.id === payload.outfitId) {
        return {
          ...o,
          name: payload.newName
        };
      }
      return o;
    });

    const nextState: GameState = {
      ...state,
      closet: {
        ...state.closet,
        savedOutfits: nextSaved
      }
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: (state: GameState, payload: ClosetRenameOutfitPayload) => {
    const outfit = state.closet.savedOutfits.find((o) => o.id === payload.outfitId);
    const oldName = payload.previousName ?? outfit?.name ?? 'Trang phục';
    return {
      type: 'closet/renameOutfit',
      payload: { outfitId: payload.outfitId, newName: oldName }
    };
  }
};

// ==========================================
// 3. closet/deleteOutfit (compensable)
// ==========================================
// Inverts to closet/restoreOutfit carrying a cloned copy of the deleted outfit

export interface ClosetDeleteOutfitPayload {
  outfitId: string;
}

export const closetDeleteOutfitCommand: CommandDef<ClosetDeleteOutfitPayload> = {
  type: 'closet/deleteOutfit',
  kind: 'compensable',

  guard: (state: GameState, payload: ClosetDeleteOutfitPayload) => {
    const outfit = state.closet.savedOutfits.find((o) => o.id === payload.outfitId);
    if (!outfit) {
      return { ok: false, reason: `Saved outfit '${payload.outfitId}' not found.` };
    }
    return true;
  },

  apply: (state: GameState, payload: ClosetDeleteOutfitPayload) => {
    const nextSaved = state.closet.savedOutfits.filter((o) => o.id !== payload.outfitId);

    const nextState: GameState = {
      ...state,
      closet: {
        ...state.closet,
        savedOutfits: nextSaved
      }
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: (state: GameState, payload: ClosetDeleteOutfitPayload) => {
    const removedOutfit = payload?.outfitId ? state.closet.savedOutfits.find((o) => o.id === payload.outfitId) : undefined;
    const fallbackOutfit: SavedOutfit = {
      id: payload?.outfitId ?? 'outfit-1',
      name: 'Trang phục đã xóa',
      garmentId: 'ao-tu-than',
      equippedAccessories: {},
      colorPalette: ['#FFF', '#FFF', '#FFF', '#000'],
      createdAt: '1970-01-01T00:00:00.000Z'
    };
    return {
      type: 'closet/restoreOutfit',
      payload: { outfit: removedOutfit ? { ...removedOutfit } : fallbackOutfit }
    };
  }
};

// ==========================================
// 4. closet/restoreOutfit (reversible)
// ==========================================

export interface ClosetRestoreOutfitPayload {
  outfit: SavedOutfit;
}

export const closetRestoreOutfitCommand: CommandDef<ClosetRestoreOutfitPayload> = {
  type: 'closet/restoreOutfit',
  kind: 'reversible',

  guard: (state: GameState, payload: ClosetRestoreOutfitPayload) => {
    if (!payload.outfit || !payload.outfit.id) {
      return { ok: false, reason: 'Valid outfit object is required to restore.' };
    }
    if (state.closet.savedOutfits.some((o) => o.id === payload.outfit.id)) {
      return { ok: false, reason: `Outfit '${payload.outfit.id}' is already present in closet.` };
    }
    return true;
  },

  apply: (state: GameState, payload: ClosetRestoreOutfitPayload) => {
    const nextSaved = [...state.closet.savedOutfits, payload.outfit];

    const nextState: GameState = {
      ...state,
      closet: {
        ...state.closet,
        savedOutfits: nextSaved
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitSaved',
          payload: { outfitId: payload.outfit.id }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: ClosetRestoreOutfitPayload) => {
    return {
      type: 'closet/deleteOutfit',
      payload: { outfitId: payload.outfit.id }
    };
  }
};
