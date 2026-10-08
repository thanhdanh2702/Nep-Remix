// Pure client-side checks for the lookbook core: SSE parser, reducer, session. Fake fetch, no server, no network.
// Run: npx tsx scripts/check-lookbook-client.ts
import assert from 'node:assert/strict';
import { callAiStream } from '../src/game/ai-client.ts';
import { LookbookSession, type LookbookCaptureInput } from '../src/game/lookbook-session.ts';
import {
  createLookbookState, lookbookReducer, selectAllDone, selectBadge, selectBusy, selectDoneCount, selectExhausted,
  type LookbookAction, type LookbookState
} from '../src/game/lookbook-state.ts';

// AbortSignal.timeout timers are unref'd in Node; keep the loop alive while the checks wait for them.
const keepAlive = setInterval(() => undefined, 1000);
const IMG = (n: string) => `data:image/png;base64,${n}`;
const enc = new TextEncoder();
const realFetch = globalThis.fetch;
type Handler = (init: RequestInit) => Promise<Response>;
let handlers: Record<string, Handler> = {};
let calls: Array<{ path: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (input: unknown, init: RequestInit = {}) => {
  const path = String(input);
  calls.push({ path, body: JSON.parse(String(init.body ?? '{}')) });
  const signal = init.signal as AbortSignal;
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  const pending = handlers[path](init);
  return Promise.race([pending, new Promise<never>((_, rej) => signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))]);
}) as typeof fetch;

/** SSE response whose body errors when `signal` aborts, like a real fetch body. */
function sse(chunks: string[], signal?: AbortSignal, hang = false): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach(x => c.enqueue(enc.encode(x)));
      if (!hang) c.close();
      signal?.addEventListener('abort', () => { try { c.error(new DOMException('aborted', 'AbortError')); } catch { /* already closed */ } });
    }
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
}
const frame = (type: string, data: unknown) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
const collect = async (chunks: string[], extra: { hang?: boolean; timeoutMs?: number; signal?: AbortSignal } = {}) => {
  const events: Array<[string, unknown]> = [];
  handlers = { '/s': init => Promise.resolve(sse(chunks, init.signal as AbortSignal, extra.hang)) };
  const result = await callAiStream('/s', {}, { signal: extra.signal, timeoutMs: extra.timeoutMs ?? 5000, onEvent: (t, d) => events.push([t, d]) });
  return { result, events };
};

// ---- callAiStream ----
{
  let r = await collect(['event: angle\nda', 'ta: {"id":"front"}\n\n', frame('done', { completed: 1 })]);
  assert.deepEqual(r.events, [['angle', { id: 'front' }], ['done', { completed: 1 }]], 'frame split across chunks');
  assert.equal(r.result.outcome, 'done');
  r = await collect(['event: angle\ndata: {"a":\ndata: 1}\n\n', ': ping\n\n', 'event: done\r\ndata: {}\r\n\r\n']);
  assert.deepEqual(r.events, [['angle', { a: 1 }], ['done', {}]], 'multi data lines joined, comment ignored, CRLF ok');
  r = await collect([frame('angle', { n: 1 }), 'event: angle\ndata: {oops\n\n', frame('angle', { n: 2 }), frame('done', {})]);
  assert.deepEqual(r.events.map(e => e[0]), ['angle', 'angle', 'done'], 'broken JSON frame skipped');
  r = await collect([frame('angle', { n: 1 })]);
  assert.equal(r.result.outcome, 'ended_without_done');
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 20);
  assert.equal((await collect([], { hang: true, signal: ac.signal })).result.outcome, 'aborted');
  assert.equal((await collect([], { hang: true, timeoutMs: 30 })).result.outcome, 'timeout');
  handlers = { '/s': () => json({ ok: false, fallback: { reason: 'quota_exhausted' } }, 429) };
  let out = await callAiStream('/s', {}, { timeoutMs: 1000, onEvent: () => undefined });
  assert.deepEqual([out.outcome, out.status, out.reason], ['failed', 429, 'quota_exhausted']);
  handlers = { '/s': () => Promise.resolve(new Response(null, { status: 429 })) };
  out = await callAiStream('/s', {}, { timeoutMs: 1000, onEvent: () => undefined });
  assert.deepEqual([out.outcome, out.status, out.reason], ['failed', 429, 'rate_limited']);
  handlers = { '/s': () => { throw new TypeError('network'); } };
  assert.equal((await callAiStream('/s', {}, { timeoutMs: 1000, onEvent: () => undefined })).outcome, 'failed');
  handlers = { '/s': () => Promise.resolve(sse([frame('angle', {})])) };
  await assert.rejects(callAiStream('/s', {}, { timeoutMs: 1000, onEvent: () => { throw new Error('boom'); } }), /boom/);
}

// ---- reducer ----
const run = (s: LookbookState, ...actions: LookbookAction[]) => actions.reduce(lookbookReducer, s);
const ok = (image: string, heroToken?: string) => ({ image: IMG(image), ...(heroToken ? { heroToken } : {}) });
const statuses = (s: LookbookState) => Object.values(s.slots).map(x => x.status);
{
  let s = run(createLookbookState(), { type: 'start', runId: 1 });
  assert.deepEqual(statuses(s), ['generating', 'queued', 'queued', 'queued']);
  assert.ok(selectBusy(s) && !selectAllDone(s));
  s = run(s, { type: 'angle', runId: 1, id: 'front', result: ok('F', 'tok'), elapsedMs: 900 });
  assert.deepEqual(statuses(s), ['done', 'generating', 'generating', 'generating']);
  assert.deepEqual([s.heroToken, s.firstImageMs], ['tok', 900]);
  const stale = run(s, { type: 'angle', runId: 0, id: 'turn', result: ok('X') });
  assert.equal(stale, s, 'older run event ignored');
  const ended = run(s, { type: 'end', runId: 1, outcome: 'ended_without_done' });
  assert.deepEqual(statuses(ended), ['done', 'error', 'error', 'error']);
  assert.ok(Object.values(ended.slots).filter(x => x.status === 'error').every(x => x.reason === 'ai_unavailable'));
  assert.equal(ended.phase, 'finished');
  assert.equal(run(s, { type: 'end', runId: 1, outcome: 'timeout' }).slots.turn.reason, 'timeout');
  assert.equal(run(s, { type: 'end', runId: 1, outcome: 'aborted' }).phase, 'idle');
  assert.ok(!statuses(ended).includes('generating'));

  let all = run(s, ...(['turn', 'back', 'detail'] as const).map(id => ({ type: 'angle', runId: 1, id, result: ok(id) }) as const));
  assert.deepEqual([selectDoneCount(s), selectAllDone(s), selectDoneCount(all)], [1, false, 4]);
  all = run(all, { type: 'end', runId: 1, outcome: 'done' });
  assert.ok(selectAllDone(all) && selectBadge(all) === 'ok');
  assert.equal(selectAllDone(run(s, { type: 'end', runId: 1, outcome: 'done' })), false, 'unfinished slots become errors, not done');

  // two parallel retries on different angles
  let r = run(all, { type: 'retry_start', runId: 1, id: 'turn', attempt: 10 }, { type: 'retry_start', runId: 1, id: 'detail', attempt: 11 });
  r = run(r, { type: 'retry_end', runId: 1, id: 'detail', attempt: 11, result: ok('D2') }, { type: 'retry_end', runId: 1, id: 'turn', attempt: 10, result: ok('T2') });
  assert.deepEqual([r.slots.turn.image, r.slots.detail.image, selectAllDone(r)], [IMG('T2'), IMG('D2'), true]);
  // same angle twice: only attempt 2 is recorded
  r = run(all, { type: 'retry_start', runId: 1, id: 'turn', attempt: 20 }, { type: 'retry_start', runId: 1, id: 'turn', attempt: 21 });
  r = run(r, { type: 'retry_end', runId: 1, id: 'turn', attempt: 20, result: ok('OLD') });
  assert.equal(r.slots.turn.status, 'generating', 'first attempt ignored');
  r = run(r, { type: 'retry_end', runId: 1, id: 'turn', attempt: 21, result: ok('NEW') });
  assert.equal(r.slots.turn.image, IMG('NEW'));
  // exhausted
  const quota = run(s, { type: 'end', runId: 1, outcome: 'failed', reason: 'quota_exhausted' });
  assert.ok(selectExhausted(quota) && selectBadge(quota) === 'fallback');
  assert.ok(!selectExhausted(ended) && !selectExhausted(all) && !selectExhausted(createLookbookState()));
}

// ---- session (fake fetch) ----
const input = { mode: 'fictional', modelGender: 'female', garmentId: 'g', colorPalette: ['#000000', '#111111', '#222222', '#333333'], accessoryIds: [], eventId: 'tet', moodId: 'pho-co' } as LookbookCaptureInput;
const streamAll = (signal: AbortSignal) => sse([
  frame('start', { total: 4, cached: false }), frame('angle', { id: 'front', status: 'done', image: IMG('F'), heroToken: 'tok' }),
  ...(['turn', 'back', 'detail'] as const).map(id => frame('angle', { id, status: 'done', image: IMG(id) })), frame('done', { completed: 4 })
], signal);
const gate = () => { let open!: (r: Response) => void; const p = new Promise<Response>(res => { open = res; }); return { p, open }; };
const angleOk = (id: string, image: string) => new Response(JSON.stringify({ ok: true, data: { id, image: IMG(image) } }), { headers: { 'content-type': 'application/json' } });
{
  handlers = { '/api/ai/lookbook': init => Promise.resolve(streamAll(init.signal as AbortSignal)) };
  let s = new LookbookSession();
  await s.capture({ ...input, noCache: true });
  assert.ok(selectAllDone(s.getState()) && s.getState().phase === 'finished' && s.getState().firstImageMs !== undefined);
  assert.equal(calls.at(-1)?.body.noCache, true, 'noCache passed through');

  // parallel retries (turn, detail) resolve out of order; hero + token sent from the latest state
  const [gTurn, gDetail] = [gate(), gate()];
  calls = [];
  handlers['/api/ai/lookbook/angle'] = init => JSON.parse(String(init.body)).angle === 'turn' ? gTurn.p : gDetail.p;
  const rt = s.retry('turn', input), rd = s.retry('detail', input);
  gDetail.open(angleOk('detail', 'D2')); gTurn.open(angleOk('turn', 'T2'));
  await Promise.all([rt, rd]);
  assert.deepEqual([s.getState().slots.turn.image, s.getState().slots.detail.image], [IMG('T2'), IMG('D2')]);
  assert.deepEqual([calls[0].body.heroImage, calls[0].body.heroToken], [IMG('F'), 'tok']);

  // same angle twice: the first is aborted, the second wins
  const [g1, g2] = [gate(), gate()];
  let n = 0;
  handlers['/api/ai/lookbook/angle'] = () => (++n === 1 ? g1.p : g2.p);
  const r1 = s.retry('back', input), r2 = s.retry('back', input);
  g2.open(angleOk('back', 'B2')); g1.open(angleOk('back', 'B1'));
  await Promise.all([r1, r2]);
  assert.equal(s.getState().slots.back.image, IMG('B2'));

  // angle fallback keeps only a reason code
  handlers['/api/ai/lookbook/angle'] = () => json({ ok: false, fallback: { reason: 'safety_blocked', message: 'raw text' } });
  await s.retry('front', input);
  assert.deepEqual([s.getState().slots.front.status, s.getState().slots.front.reason], ['error', 'safety_blocked']);

  // stream closes before done: nothing stays generating
  s = new LookbookSession();
  handlers = { '/api/ai/lookbook': init => Promise.resolve(sse([frame('start', { total: 4, cached: false }), frame('angle', { id: 'front', status: 'done', image: IMG('F') })], init.signal as AbortSignal)) };
  await s.capture(input);
  assert.deepEqual(statuses(s.getState()), ['done', 'error', 'error', 'error']);

  // capture 2 while capture 1 is still running: late stream 1 is ignored
  s = new LookbookSession();
  const first = gate();
  let calls2 = 0;
  handlers = { '/api/ai/lookbook': init => (++calls2 === 1 ? first.p : Promise.resolve(streamAll(init.signal as AbortSignal))) };
  const c1 = s.capture(input);
  await s.capture(input);
  first.open(sse([frame('angle', { id: 'front', status: 'done', image: IMG('LATE') })]));
  await c1;
  assert.equal(s.getState().slots.front.image, IMG('F'));
  assert.ok(selectAllDone(s.getState()));

  // 429 / 422 mapping
  s = new LookbookSession();
  handlers = { '/api/ai/lookbook': () => json({ ok: false, fallback: { reason: 'quota_exhausted' } }, 429) };
  await s.capture(input);
  assert.ok(selectExhausted(s.getState()) && !statuses(s.getState()).includes('generating'));
  handlers = { '/api/ai/lookbook': () => Promise.resolve(new Response(null, { status: 429 })) };
  await s.capture(input);
  assert.equal(s.getState().slots.front.reason, 'rate_limited');
  assert.ok(!selectExhausted(s.getState()));
  const check = { onePerson: false, faceVisible: true, fullBody: true, looksAdult: true, verdict: 'block' };
  handlers = { '/api/ai/lookbook': () => json({ ok: false, fallback: { reason: 'safety_blocked' }, check }, 422) };
  await s.capture({ ...input, mode: 'personal', personImage: IMG('PERSON') });
  assert.equal(s.getState().check?.verdict, 'block');
  assert.ok(!JSON.stringify(s.getState()).includes('PERSON'), 'person photo never enters state');

  // cancel aborts a running capture and goes idle
  handlers = { '/api/ai/lookbook': init => Promise.resolve(sse([], init.signal as AbortSignal, true)) };
  const pending = s.capture(input);
  s.cancel();
  await pending;
  assert.ok(s.getState().phase === 'idle' && !selectBusy(s.getState()));

  // checkPhoto
  handlers['/api/ai/lookbook/check'] = () => json({ ok: true, data: { ...check, verdict: 'ok' } });
  assert.equal((await s.checkPhoto(IMG('P'))).status, 'ok');
  handlers['/api/ai/lookbook/check'] = () => json({ ok: false, fallback: { reason: 'ai_unavailable' } });
  assert.equal((await s.checkPhoto(IMG('P'))).status, 'unavailable');
}

globalThis.fetch = realFetch;
clearInterval(keepAlive);
console.log('check-lookbook-client: OK');
