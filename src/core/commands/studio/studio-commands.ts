import type { CommandDef } from '../../command.ts';
import type { GameState, StudioDraft } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { getChallengeWardrobe, validateStudioDraft } from './challenge-wardrobe.ts';

function initialDraft(state: GameState, payload: StudioOpenPayload, content: GameContent): StudioDraft {
  const saved = state.closet.savedOutfits[0];
  const garmentId = payload.initialGarmentId ?? saved?.garmentId ?? state.closet.unlockedGarmentIds[0];
  const garment = content.garmentsById.get(garmentId);
  return { type: 'studio', eventContextId: 'dao_pho', garmentId, silhouette: garment?.silhouette ?? 'tu_than',
    colorPalette: [...(garment?.defaultColorPalette ?? ['#FFF','#FFF','#FFF','#000'])],
    equippedAccessories: payload.initialGarmentId ? {} : { ...saved?.equippedAccessories } };
}
function silhouetteDraft(state: GameState, payload: StudioSetSilhouettePayload, content: GameContent): StudioDraft {
  const session = state.activeSession as StudioDraft;
  const wardrobe = session.challengePuzzleId ? getChallengeWardrobe(state, session.challengePuzzleId, content) : null;
  const ids = wardrobe?.ok ? wardrobe.garmentIds : state.closet.unlockedGarmentIds;
  const id = [payload.previousGarmentId, session.garmentId, ...ids].find(id => id && ids.includes(id) && content.garmentsById.get(id)?.silhouette === payload.silhouette);
  const garment = id ? content.garmentsById.get(id) : undefined;
  return { ...session, silhouette: payload.silhouette, garmentId: id ?? '',
    colorPalette: id === session.garmentId ? session.colorPalette : garment?.defaultColorPalette ?? session.colorPalette };
}
function validSession(state: GameState, content: GameContent) {
  return state.activeSession?.type === 'studio' ? validateStudioDraft(state, state.activeSession, content)
    : { ok: false as const, reason: 'Studio session is not active.' };
}

// ==========================================
// 1. studio/open (reversible)
// ==========================================

export interface StudioOpenPayload {
  initialGarmentId?: string;
}

export const studioOpenCommand: CommandDef<StudioOpenPayload> = {
  type: 'studio/open',
  kind: 'reversible',

  guard: (state, payload, content) => {
    if (state.activeSession !== null) return { ok: false, reason: 'Another active session is already open.' };
    const valid = validateStudioDraft(state, initialDraft(state, payload, content), content, true);
    return valid.ok ? true : valid;
  },

  apply: (state: GameState, payload: StudioOpenPayload, content: GameContent) => {
    const session = initialDraft(state, payload, content);

    const nextState: GameState = {
      ...state,
      activeSession: session
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: () => {
    return {
      type: 'studio/close',
      payload: {}
    };
  }
};

// ==========================================
// 2. studio/selectEvent (reversible)
// ==========================================

export interface StudioSelectEventPayload {
  eventId: string;
  previousEventId?: string;
}

export const studioSelectEventCommand: CommandDef<StudioSelectEventPayload> = {
  type: 'studio/selectEvent',
  kind: 'reversible',

  guard: (state: GameState, payload: StudioSelectEventPayload, content: GameContent) => {
    if (!state.activeSession || state.activeSession.type !== 'studio') {
      return { ok: false, reason: 'Studio session is not active.' };
    }
    const current = validSession(state, content);
    if (!current.ok) return current;
    if (!payload.eventId) {
      return { ok: false, reason: 'Event ID is required.' };
    }
    return true;
  },

  apply: (state: GameState, payload: StudioSelectEventPayload) => {
    const session = state.activeSession as StudioDraft;
    const nextSession: StudioDraft = {
      ...session,
      eventContextId: payload.eventId
    };

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: session.garmentId, slot: 'event' }
        }
      ]
    };
  },

  invert: (state: GameState, payload: StudioSelectEventPayload) => {
    const session = state.activeSession as StudioDraft | null;
    const previousEventId = payload.previousEventId ?? session?.eventContextId ?? 'dao_pho';
    return {
      type: 'studio/selectEvent',
      payload: { eventId: previousEventId }
    };
  }
};

// ==========================================
// 3. studio/setSilhouette (reversible)
// ==========================================

export interface StudioSetSilhouettePayload {
  silhouette: 'tu_than' | 'ngu_than_tay_chen' | 'ngu_than_tay_thung' | 'tan_thoi';
  previousSilhouette?: 'tu_than' | 'ngu_than_tay_chen' | 'ngu_than_tay_thung' | 'tan_thoi';
  previousGarmentId?: string;
}

export const studioSetSilhouetteCommand: CommandDef<StudioSetSilhouettePayload> = {
  type: 'studio/setSilhouette',
  kind: 'reversible',

  guard: (state, payload, content) => {
    const current = validSession(state, content);
    if (!current.ok) return current;
    const valid = validateStudioDraft(state, silhouetteDraft(state, payload, content), content);
    return valid.ok ? true : valid;
  },

  apply: (state: GameState, payload: StudioSetSilhouettePayload, content: GameContent) => {
    const nextSession = silhouetteDraft(state, payload, content);
    const nextGarmentId = nextSession.garmentId;

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: nextGarmentId, slot: 'silhouette' }
        }
      ]
    };
  },

  invert: (state: GameState, payload: StudioSetSilhouettePayload) => {
    const session = state.activeSession as StudioDraft | null;
    const previousSilhouette = payload.previousSilhouette ?? session?.silhouette ?? 'tu_than';
    return {
      type: 'studio/setSilhouette',
      payload: { silhouette: previousSilhouette, previousGarmentId: payload.previousGarmentId }
    };
  }
};

// ==========================================
// 4. studio/setColor (reversible)
// ==========================================
// Payload carries previousColorPalette for deterministic invert

export interface StudioSetColorPayload {
  colorPalette: [string, string, string, string];
  previousColorPalette?: [string, string, string, string];
}

export const studioSetColorCommand: CommandDef<StudioSetColorPayload> = {
  type: 'studio/setColor',
  kind: 'reversible',

  guard: (state: GameState, payload: StudioSetColorPayload, content: GameContent) => {
    if (!state.activeSession || state.activeSession.type !== 'studio') {
      return { ok: false, reason: 'Studio session is not active.' };
    }
    const current = validSession(state, content);
    if (!current.ok) return current;
    if (!Array.isArray(payload.colorPalette) || payload.colorPalette.length !== 4 || payload.colorPalette.some(c => typeof c !== 'string')) {
      return { ok: false, reason: 'Color palette must contain exactly 4 color codes.' };
    }
    return true;
  },

  apply: (state: GameState, payload: StudioSetColorPayload) => {
    const session = state.activeSession as StudioDraft;
    const nextSession: StudioDraft = {
      ...session,
      colorPalette: [...payload.colorPalette]
    };

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: session.garmentId, slot: 'color' }
        }
      ]
    };
  },

  invert: (state: GameState, payload: StudioSetColorPayload) => {
    const session = state.activeSession as StudioDraft | null;
    const prev = payload.previousColorPalette ?? session?.colorPalette ?? [
      '#FFFFFF',
      '#FFFFFF',
      '#FFFFFF',
      '#000000'
    ];
    return {
      type: 'studio/setColor',
      payload: { colorPalette: prev }
    };
  }
};

// ==========================================
// 5. studio/equip (reversible)
// ==========================================

export interface StudioEquipPayload {
  accessoryId: string;
  previousAccessoryId?: string;
}

export const studioEquipCommand: CommandDef<StudioEquipPayload> = {
  type: 'studio/equip',
  kind: 'reversible',

  guard: (state, payload, content) => {
    const current = validSession(state, content);
    if (!current.ok) return current;
    const acc = content.accessoriesById.get(payload.accessoryId);
    if (!acc) return { ok: false, reason: 'Accessory not found.' };
    const session = state.activeSession as StudioDraft;
    const valid = validateStudioDraft(state, { ...session, equippedAccessories: { ...session.equippedAccessories, [acc.category]: payload.accessoryId } }, content);
    return valid.ok ? true : valid;
  },

  apply: (state: GameState, payload: StudioEquipPayload, content: GameContent) => {
    const session = state.activeSession as StudioDraft;
    const acc = content.accessoriesById.get(payload.accessoryId)!;
    const slot = acc.category;

    const nextAccessories = {
      ...session.equippedAccessories,
      [slot]: payload.accessoryId
    };

    const nextSession: StudioDraft = {
      ...session,
      equippedAccessories: nextAccessories
    };

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: session.garmentId, slot }
        }
      ]
    };
  },

  invert: (state: GameState, payload: StudioEquipPayload, content: GameContent) => {
    const acc = content.accessoriesById.get(payload.accessoryId);
    const slot = acc?.category ?? 'jewelry';

    if (payload.previousAccessoryId) {
      return {
        type: 'studio/equip',
        payload: { accessoryId: payload.previousAccessoryId }
      };
    }

    return {
      type: 'studio/unequip',
      payload: { slot, previousAccessoryId: payload.accessoryId }
    };
  }
};

// ==========================================
// 6. studio/unequip (reversible)
// ==========================================
// Payload carries previousAccessoryId for precise invert

export interface StudioUnequipPayload {
  slot: string;
  previousAccessoryId?: string;
}

export const studioUnequipCommand: CommandDef<StudioUnequipPayload> = {
  type: 'studio/unequip',
  kind: 'reversible',

  guard: (state: GameState, payload: StudioUnequipPayload, content: GameContent) => {
    if (!state.activeSession || state.activeSession.type !== 'studio') {
      return { ok: false, reason: 'Studio session is not active.' };
    }
    const current = validSession(state, content);
    if (!current.ok) return current;
    const session = state.activeSession as StudioDraft;
    if (!session.equippedAccessories[payload.slot]) {
      return { ok: false, reason: `Slot '${payload.slot}' is already empty.` };
    }
    return true;
  },

  apply: (state: GameState, payload: StudioUnequipPayload) => {
    const session = state.activeSession as StudioDraft;
    const nextAccessories = { ...session.equippedAccessories };
    delete nextAccessories[payload.slot];

    const nextSession: StudioDraft = {
      ...session,
      equippedAccessories: nextAccessories
    };

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: session.garmentId, slot: payload.slot }
        }
      ]
    };
  },

  invert: (_state: GameState, payload: StudioUnequipPayload) => {
    return {
      type: 'studio/equip',
      payload: { accessoryId: payload?.previousAccessoryId ?? '' }
    };
  }
};

// ==========================================
// 7. studio/applyPreset (reversible)
// ==========================================
// Carries previous state for exact restoration

export interface StudioApplyPresetPayload {
  preset: {
    garmentId: string;
    silhouette: 'tu_than' | 'ngu_than_tay_chen' | 'ngu_than_tay_thung' | 'tan_thoi';
    colorPalette: [string, string, string, string];
    equippedAccessories: Record<string, string>;
    motifId?: string;
  };
  previousDraft?: StudioDraft;
}

export const studioApplyPresetCommand: CommandDef<StudioApplyPresetPayload> = {
  type: 'studio/applyPreset',
  kind: 'reversible',

  guard: (state, payload, content) => {
    const current = validSession(state, content);
    if (!current.ok) return current;
    if (!payload.preset || typeof payload.preset !== 'object') return { ok: false, reason: 'Preset is required.' };
    const session = state.activeSession as StudioDraft;
    const valid = validateStudioDraft(state, { ...session, ...payload.preset, challengePuzzleId: session.challengePuzzleId }, content);
    return valid.ok ? true : valid;
  },

  apply: (state: GameState, payload: StudioApplyPresetPayload) => {
    const session = state.activeSession as StudioDraft;
    const { preset } = payload;

    const nextSession: StudioDraft = {
      ...session,
      garmentId: preset.garmentId,
      silhouette: preset.silhouette,
      colorPalette: [...preset.colorPalette],
      equippedAccessories: { ...preset.equippedAccessories },
      motifId: preset.motifId
    };

    const nextState: GameState = {
      ...state,
      activeSession: nextSession
    };

    return {
      state: nextState,
      events: [
        {
          type: 'outfitChanged',
          payload: { garmentId: preset.garmentId, slot: 'preset' }
        }
      ]
    };
  },

  invert: (state: GameState, payload: StudioApplyPresetPayload) => {
    const defaultPreset = {
      garmentId: 'ao-tu-than',
      silhouette: 'tu_than' as const,
      colorPalette: ['#FFF', '#FFF', '#FFF', '#000'] as [string, string, string, string],
      equippedAccessories: {}
    };
    const draft = payload?.previousDraft ?? defaultPreset;
    return {
      type: 'studio/applyPreset',
      payload: { preset: draft }
    };
  }
};

// ==========================================
// 8. studio/close (reversible)
// ==========================================

export interface StudioClosePayload {}

export const studioCloseCommand: CommandDef<StudioClosePayload> = {
  type: 'studio/close',
  kind: 'reversible',

  guard: (state: GameState) => {
    if (!state.activeSession || state.activeSession.type !== 'studio') {
      return { ok: false, reason: 'Studio session is not active.' };
    }
    return true;
  },

  apply: (state: GameState) => {
    const nextState: GameState = {
      ...state,
      activeSession: null
    };

    return {
      state: nextState,
      events: []
    };
  },

  invert: () => {
    return {
      type: 'studio/open',
      payload: {}
    };
  }
};
