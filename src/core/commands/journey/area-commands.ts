import { isGateSatisfied } from './gate.ts';
import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';

// ==========================================
// 1. area/goTo (reversible)
// ==========================================

export interface AreaGoToPayload {
  areaId: string;
}

export const areaGoToCommand: CommandDef<AreaGoToPayload> = {
  type: 'area/goTo',
  kind: 'reversible',

  guard: (state: GameState, payload: AreaGoToPayload, content: GameContent) => {
    const { areaId } = payload;
    const chId = state.currentChapter;
    const chData = content.chapters[chId];
    const chProgress = state.journey[chId];

    if (!chData || !chProgress) {
      return { ok: false, reason: `Chương hiện tại '${chId}' không hợp lệ.` };
    }

    const areaDef = chData.areas.find((a) => a.id === areaId);
    if (!areaDef) {
      return { ok: false, reason: `Khu vực '${areaId}' không thuộc chương '${chId}'.` };
    }

    const fromArea = chData.areas.find(a => a.id === chProgress.currentArea);
    const exits = Object.entries(fromArea?.exits ?? {}).filter(([, target]) => target === areaId);
    if (!exits.length || !exits.some(([key]) => isGateSatisfied(state, fromArea?.exitGates?.[key])
      && (fromArea?.exitGates?.[key] !== undefined || chProgress.unlockedAreaIds.includes(areaId)))) {
      return { ok: false, reason: 'This exit is locked or not adjacent to the current room.' };
    }

    if (chProgress.currentArea === areaId) {
      return { ok: false, reason: 'An đang đứng ở khu vực này rồi.' };
    }

    return true;
  },

  apply: (state: GameState, payload: AreaGoToPayload) => {
    const { areaId } = payload;
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];

    const nextState: GameState = {
      ...state,
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          currentArea: areaId,
          unlockedAreaIds: [...new Set([...chProgress.unlockedAreaIds, areaId])],
          navStack: [...chProgress.navStack, chProgress.currentArea]
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'areaEntered',
          payload: { areaId }
        }
      ]
    };
  },

  invert: (state: GameState, _payload: AreaGoToPayload) => {
    const oldArea = state.journey[state.currentChapter].currentArea;
    return {
      type: 'area/goTo',
      payload: { areaId: oldArea }
    };
  }
};

// ==========================================
// 2. area/goBack (reversible)
// ==========================================
// Forward navigation via stack pop. Invert returns to the area just left.

export interface AreaGoBackPayload {}

export const areaGoBackCommand: CommandDef<AreaGoBackPayload> = {
  type: 'area/goBack',
  kind: 'reversible',

  guard: (state: GameState, _payload: AreaGoBackPayload) => {
    const chProgress = state.journey[state.currentChapter];
    if (!chProgress || chProgress.navStack.length === 0) {
      return { ok: false, reason: 'Không còn lối nào để quay lại.' };
    }
    return true;
  },

  apply: (state: GameState, _payload: AreaGoBackPayload) => {
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];
    const newNavStack = [...chProgress.navStack];
    const targetArea = newNavStack.pop()!;

    const nextState: GameState = {
      ...state,
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          currentArea: targetArea,
          navStack: newNavStack
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'areaEntered',
          payload: { areaId: targetArea }
        }
      ]
    };
  },

  invert: (state: GameState) => {
    // Returns to the area we were in before going back
    const currentArea = state.journey[state.currentChapter].currentArea;
    return {
      type: 'area/goTo',
      payload: { areaId: currentArea }
    };
  }
};

// ==========================================
// 3. side/flip (involution)
// ==========================================
// Self-inverse: applying twice returns to initial side.

export interface SideFlipPayload {}

export const sideFlipCommand: CommandDef<SideFlipPayload> = {
  type: 'side/flip',
  kind: 'involution',

  guard: (state: GameState, _payload: SideFlipPayload, content: GameContent) => {
    if (!state.features.latVai) {
      return { ok: false, reason: `Cơ chế Lật vải (latVai) đang tắt.` };
    }

    const chId = state.currentChapter;
    const chProgress = state.journey[chId];
    const chData = content.chapters[chId];
    const currentArea = chData?.areas.find((a) => a.id === chProgress.currentArea);

    if (!currentArea || !currentArea.sides.trai) {
      return {
        ok: false,
        reason: `Khu vực hiện tại '${chProgress.currentArea}' không hỗ trợ mặt trái.`
      };
    }

    return true;
  },

  apply: (state: GameState) => {
    const chId = state.currentChapter;
    const chProgress = state.journey[chId];
    const newSide: 'mat_phai' | 'mat_trai' =
      chProgress.side === 'mat_phai' ? 'mat_trai' : 'mat_phai';

    const nextState: GameState = {
      ...state,
      journey: {
        ...state.journey,
        [chId]: {
          ...chProgress,
          side: newSide
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'sideFlipped',
          payload: { side: newSide }
        }
      ]
    };
  },

  invert: () => {
    return {
      type: 'side/flip',
      payload: {}
    };
  }
};
