// Lookbook capture session: owns the AbortControllers and talks to /api/ai/lookbook*. React-free class + thin hook.
// Privacy: personImage only travels through the arguments of capture/retry/checkPhoto, it is never stored here.
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { LOOKBOOK_LIMITS } from '../config/lookbook-limits.ts';
import {
  LOOKBOOK_ANGLE_IDS,
  type LookbookAngleId, type LookbookCheckResult, type LookbookReason, type LookbookRequest
} from '../server/ai/lookbook-contract.ts';
import { callAi, callAiStream } from './ai-client.ts';
import {
  createLookbookState, lookbookReducer, toReason,
  type AngleResult, type LookbookAction, type LookbookState, type StreamEnd
} from './lookbook-state.ts';

export type LookbookCaptureInput = LookbookRequest;
export type CheckPhotoResult = { status: 'ok'; result: LookbookCheckResult } | { status: 'unavailable' };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isAngleId = (v: unknown): v is LookbookAngleId => LOOKBOOK_ANGLE_IDS.some(id => id === v);
const isCheck = (v: unknown): v is LookbookCheckResult =>
  isRecord(v) && (v.verdict === 'ok' || v.verdict === 'warn' || v.verdict === 'block');

/** Angle payload (SSE event or /angle response) -> AngleResult. Wrong shape counts as invalid_output. */
function toAngleResult(data: Record<string, unknown>): AngleResult {
  const heroToken = typeof data.heroToken === 'string' ? { heroToken: data.heroToken } : {};
  if (data.status !== 'error' && typeof data.image === 'string') return { image: data.image, ...heroToken };
  return { reason: data.status === 'error' ? toReason(data.reason) : 'invalid_output' };
}

export class LookbookSession {
  private state = createLookbookState();
  private readonly listeners = new Set<() => void>();
  private seq = 0; // one counter for runIds and retry attempts
  private run: AbortController | null = null;
  private readonly retries = new Map<LookbookAngleId, AbortController>();

  getState = (): LookbookState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private dispatch(action: LookbookAction): void {
    const next = lookbookReducer(this.state, action); // always from the latest state: no stale snapshots
    if (next === this.state) return;
    this.state = next;
    this.listeners.forEach(l => l());
  }

  /** Aborts the stream run and every angle retry. */
  abortAll = (): void => {
    this.run?.abort();
    this.run = null;
    this.retries.forEach(ac => ac.abort());
    this.retries.clear();
  };

  cancel = (): void => {
    this.abortAll();
    this.dispatch({ type: 'cancel', runId: ++this.seq });
  };

  /** Starts a new run; it replaces the previous run and any retry in flight. */
  capture = async (input: LookbookCaptureInput): Promise<void> => {
    this.abortAll();
    const runId = ++this.seq;
    const ac = new AbortController();
    this.run = ac;
    const startedAt = performance.now();
    this.dispatch({ type: 'start', runId });
    let end: { outcome: StreamEnd; reason?: LookbookReason; check?: LookbookCheckResult } = { outcome: 'failed' };
    try {
      const result = await callAiStream('/api/ai/lookbook', input, {
        signal: ac.signal,
        timeoutMs: LOOKBOOK_LIMITS.clientStreamTimeoutMs,
        onEvent: (type, data) => {
          if (!isRecord(data)) return;
          if (type === 'start') this.dispatch({ type: 'stream_start', runId, cached: data.cached === true });
          else if (type === 'angle' && isAngleId(data.id)) {
            this.dispatch({ type: 'angle', runId, id: data.id, result: toAngleResult(data), elapsedMs: Math.round(performance.now() - startedAt) });
          }
        }
      });
      const json = isRecord(result.json) ? result.json : null;
      end = {
        outcome: result.outcome,
        ...(result.reason ? { reason: toReason(result.reason) } : {}),
        ...(json && isCheck(json.check) ? { check: json.check } : {})
      };
    } catch {
      end = { outcome: 'failed' }; // keep only a reason code, never the raw error text
    } finally {
      if (this.run === ac) this.run = null;
    }
    this.dispatch({ type: 'end', runId, ...end });
  };

  /** Regenerates one angle. Same angle twice cancels the first; different angles run side by side. */
  retry = async (angle: LookbookAngleId, input: LookbookCaptureInput): Promise<void> => {
    if (this.state.phase === 'running') return; // the stream still owns the slots
    this.retries.get(angle)?.abort();
    const ac = new AbortController();
    this.retries.set(angle, ac);
    const attempt = ++this.seq;
    const runId = this.state.runId;
    this.dispatch({ type: 'retry_start', runId, id: angle, attempt });
    // Read hero + token now (not at click time): they are the newest the state has.
    const { slots, heroToken } = this.state;
    const hero = slots.front.image;
    const body = { ...input, angle, ...(angle !== 'front' && hero && heroToken ? { heroImage: hero, heroToken } : {}) };
    const response = await callAi<Record<string, unknown>, { reason?: unknown }>('/api/ai/lookbook/angle', body, ac.signal);
    if (this.retries.get(angle) === ac) this.retries.delete(angle);
    if (ac.signal.aborted) return; // replaced or cancelled
    const result: AngleResult = response.status !== 'fallback' && isRecord(response.data) && response.data.id === angle
      ? toAngleResult(response.data)
      : { reason: response.status === 'fallback' ? toReason(response.fallback?.reason) : 'invalid_output' };
    this.dispatch({ type: 'retry_end', runId, id: angle, attempt, result });
  };

  checkPhoto = async (personImage: string, signal?: AbortSignal): Promise<CheckPhotoResult> => {
    const response = await callAi<unknown>('/api/ai/lookbook/check', { personImage }, signal);
    return response.status !== 'fallback' && isCheck(response.data) ? { status: 'ok', result: response.data } : { status: 'unavailable' };
  };
}

export function useLookbookSession() {
  const session = useMemo(() => new LookbookSession(), []);
  const state = useSyncExternalStore(session.subscribe, session.getState);
  useEffect(() => session.abortAll, [session]); // unmount cancels everything
  return { state, capture: session.capture, retry: session.retry, cancel: session.cancel, checkPhoto: session.checkPhoto };
}
