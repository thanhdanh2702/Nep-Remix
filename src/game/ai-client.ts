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
