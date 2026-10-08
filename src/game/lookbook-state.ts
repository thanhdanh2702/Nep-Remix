// Pure lookbook state machine keyed by angle id. No React, no I/O: the session feeds it actions.
// Every action carries the runId it belongs to; retries also carry an attempt number, so late results are dropped.
import {
  LOOKBOOK_ANGLE_IDS,
  type LookbookAngleId, type LookbookCheckResult, type LookbookReason
} from '../server/ai/lookbook-contract.ts';

export type SlotStatus = 'idle' | 'queued' | 'generating' | 'done' | 'error';
export interface LookbookSlot { id: LookbookAngleId; status: SlotStatus; image?: string; reason?: LookbookReason; attempt?: number }
export interface LookbookState {
  runId: number;
  phase: 'idle' | 'running' | 'finished';
  slots: Record<LookbookAngleId, LookbookSlot>;
  heroToken?: string;
  cached: boolean;
  firstImageMs?: number;
  check?: LookbookCheckResult;
}

export type StreamEnd = 'done' | 'ended_without_done' | 'aborted' | 'timeout' | 'failed';
export interface AngleResult { image?: string; reason?: LookbookReason; heroToken?: string }

export type LookbookAction =
  | { type: 'start'; runId: number }
  | { type: 'stream_start'; runId: number; cached: boolean }
  | { type: 'angle'; runId: number; id: LookbookAngleId; result: AngleResult; elapsedMs?: number }
  | { type: 'end'; runId: number; outcome: StreamEnd; reason?: LookbookReason; check?: LookbookCheckResult }
  | { type: 'retry_start'; runId: number; id: LookbookAngleId; attempt: number }
  | { type: 'retry_end'; runId: number; id: LookbookAngleId; attempt: number; result: AngleResult }
  | { type: 'cancel'; runId: number };

export const LOOKBOOK_REASONS = ['ai_unavailable', 'timeout', 'invalid_output', 'rate_limited', 'safety_blocked', 'quota_exhausted'] as const satisfies readonly LookbookReason[];

/** Wire string -> LookbookReason. Unknown values collapse to ai_unavailable so no raw text reaches the state. */
export function toReason(value: unknown): LookbookReason {
  return LOOKBOOK_REASONS.find(r => r === value) ?? 'ai_unavailable';
}

function emptySlots(status: SlotStatus): Record<LookbookAngleId, LookbookSlot> {
  return Object.fromEntries(LOOKBOOK_ANGLE_IDS.map(id => [id, { id, status }])) as Record<LookbookAngleId, LookbookSlot>;
}

export function createLookbookState(): LookbookState {
  return { runId: 0, phase: 'idle', slots: emptySlots('idle'), cached: false };
}

function settle(slot: LookbookSlot, result: AngleResult): LookbookSlot {
  return result.image
    ? { id: slot.id, status: 'done', image: result.image }
    : { id: slot.id, status: 'error', reason: result.reason ?? 'ai_unavailable' };
}

function withSlot(state: LookbookState, slot: LookbookSlot): LookbookState {
  return { ...state, slots: { ...state.slots, [slot.id]: slot } };
}

const unfinished = (s: LookbookSlot) => s.status === 'idle' || s.status === 'queued' || s.status === 'generating';

function endReason(action: Extract<LookbookAction, { type: 'end' }>): LookbookReason {
  if (action.outcome === 'timeout') return 'timeout';
  return action.outcome === 'failed' && action.reason ? action.reason : 'ai_unavailable';
}

export function lookbookReducer(state: LookbookState, action: LookbookAction): LookbookState {
  if (action.type === 'start') {
    return {
      ...createLookbookState(),
      runId: action.runId,
      phase: 'running',
      slots: { ...emptySlots('queued'), front: { id: 'front', status: 'generating' } }
    };
  }
  if (action.type === 'cancel') return { ...createLookbookState(), runId: action.runId };
  if (action.runId !== state.runId) return state; // event of an older run

  switch (action.type) {
    case 'stream_start':
      return { ...state, cached: action.cached };
    case 'angle': {
      let next = withSlot(state, settle(state.slots[action.id], action.result));
      if (action.result.heroToken && action.id === 'front') next = { ...next, heroToken: action.result.heroToken };
      if (action.result.image && next.firstImageMs === undefined && action.elapsedMs !== undefined) {
        next = { ...next, firstImageMs: action.elapsedMs };
      }
      if (action.id === 'front') {
        // The hero decides the other angles: start them once the hero has a result.
        for (const slot of Object.values(next.slots)) {
          if (slot.status === 'queued') next = withSlot(next, { id: slot.id, status: 'generating' });
        }
      }
      return next;
    }
    case 'end': {
      if (action.outcome === 'aborted') return { ...createLookbookState(), runId: state.runId };
      const reason = endReason(action);
      let next: LookbookState = { ...state, phase: 'finished', ...(action.check ? { check: action.check } : {}) };
      for (const slot of Object.values(state.slots)) {
        if (unfinished(slot) && slot.status !== 'idle') next = withSlot(next, { id: slot.id, status: 'error', reason });
      }
      return next;
    }
    case 'retry_start':
      return withSlot(state, { id: action.id, status: 'generating', attempt: action.attempt });
    case 'retry_end': {
      if (state.slots[action.id].attempt !== action.attempt) return state; // replaced by a newer retry
      const next = withSlot(state, settle(state.slots[action.id], action.result));
      return action.id === 'front' && action.result.heroToken ? { ...next, heroToken: action.result.heroToken } : next;
    }
  }
}

const slotList = (s: LookbookState) => LOOKBOOK_ANGLE_IDS.map(id => s.slots[id]);

export const selectDoneCount = (s: LookbookState): number => slotList(s).filter(x => x.status === 'done').length;
export const selectAllDone = (s: LookbookState): boolean => selectDoneCount(s) === LOOKBOOK_ANGLE_IDS.length;
export const selectBusy = (s: LookbookState): boolean => slotList(s).some(x => x.status === 'queued' || x.status === 'generating');
export const selectBadge = (s: LookbookState): 'ok' | 'cached' | 'fallback' =>
  slotList(s).some(x => x.status === 'error') ? 'fallback' : s.cached ? 'cached' : 'ok';
/** True when every failed slot failed because the daily cap is used up (UI shows the "out of turns" line). */
export const selectExhausted = (s: LookbookState): boolean => {
  const failed = slotList(s).filter(x => x.status === 'error');
  return failed.length > 0 && failed.every(x => x.reason === 'quota_exhausted');
};
