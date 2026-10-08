// Browser-side caller for POST /api/ai/*. Server shapes: { ok:true, data, cached? } | { ok:false, fallback? }.
// Any network / HTTP / JSON / timeout failure collapses to status 'fallback' (AI offline is a normal state, not an error).
export const AI_TIMEOUT_MS = 50_000;

export type AiResult<T, F = unknown> =
  | { status: 'ok' | 'cached'; data: T }
  | { status: 'fallback'; fallback?: F };

export async function callAi<T, F = unknown>(path: string, body: unknown, signal?: AbortSignal): Promise<AiResult<T, F>> {
  const timeout = AbortSignal.timeout(AI_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    // 429 and other HTTP errors have no `fallback`; the JSON read below still runs for them.
    const json = (await response.json().catch(() => null)) as { ok?: boolean; data?: T; cached?: boolean; fallback?: F } | null;
    if (response.ok && json?.ok === true && json.data !== undefined) return { status: json.cached ? 'cached' : 'ok', data: json.data };
    return { status: 'fallback', fallback: json?.fallback };
  } catch {
    return { status: 'fallback' };
  }
}

// ---- SSE variant of callAi: shared parser for streaming endpoints (e.g. POST /api/ai/lookbook) ----
export type StreamOutcome = 'done' | 'ended_without_done' | 'aborted' | 'timeout' | 'failed';
export interface StreamResult { outcome: StreamOutcome; status?: number; reason?: string; json?: unknown }

/** Parses one SSE frame ("event:", "data:" lines, ": comment" lines). Returns null for comment-only or non-JSON frames. */
function parseSseFrame(frame: string): { type: string; data: unknown } | null {
  let type = 'message';
  const data: string[] = [];
  for (const line of frame.split('\n')) {
    if (line === '' || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') type = value;
    else if (field === 'data') data.push(value);
  }
  if (data.length === 0) return null;
  try {
    return { type, data: JSON.parse(data.join('\n')) };
  } catch {
    return null; // broken frame: skip it, the stream goes on
  }
}

/** POST `body` as JSON and feed SSE events to `onEvent`. An error thrown by `onEvent` rejects the promise. */
export async function callAiStream(
  path: string,
  body: unknown,
  opts: { signal?: AbortSignal; timeoutMs: number; onEvent: (type: string, data: unknown) => void }
): Promise<StreamResult> {
  const timeout = AbortSignal.timeout(opts.timeoutMs);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  const interrupted = (): StreamResult | null =>
    opts.signal?.aborted ? { outcome: 'aborted' } : timeout.aborted ? { outcome: 'timeout' } : null;
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok || !response.body || !(response.headers.get('content-type') ?? '').includes('text/event-stream')) {
      const json = (await response.json().catch(() => null)) as { fallback?: { reason?: unknown } } | null;
      const reason = json?.fallback?.reason;
      return interrupted() ?? {
        outcome: 'failed',
        status: response.status,
        reason: typeof reason === 'string' ? reason : response.status === 429 ? 'rate_limited' : undefined,
        json: json ?? undefined,
      };
    }
    reader = response.body.getReader();
  } catch {
    return interrupted() ?? { outcome: 'failed' };
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let sawDone = false;
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      return interrupted() ?? { outcome: 'failed' };
    }
    const stopped = interrupted();
    if (stopped) { void reader.cancel().catch(() => undefined); return stopped; }
    buffer += decoder.decode(chunk.value, { stream: !chunk.done }).replace(/\r\n?/g, '\n');
    let end: number;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const event = parseSseFrame(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      if (!event) continue;
      if (event.type === 'done') sawDone = true;
      try {
        opts.onEvent(event.type, event.data);
      } catch (err) {
        void reader.cancel().catch(() => undefined);
        throw err; // a handler error must reach the caller, never be swallowed
      }
    }
    if (chunk.done) return { outcome: sawDone ? 'done' : 'ended_without_done' };
  }
}
