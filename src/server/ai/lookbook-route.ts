// Lookbook HTTP layer: validation, per-IP unit limiter, daily cap, server-side photo check, SSE plumbing.
import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { LOOKBOOK_LIMITS } from '../../config/lookbook-limits.ts';
import { toFallbackReason } from './sanitize.ts';
import { checkPersonPhoto } from './lookbook-check.ts';
import { generateAngle, generateLookbook, isLookbookCached } from './lookbook-generate.ts';
import { hasCatalogIds } from './lookbook-prompt.ts';
import {
  LookbookAngleRequestSchema, LookbookCheckRequestSchema, LookbookRequestSchema,
  type LookbookRequest, type LookbookStreamEvent
} from './lookbook-contract.ts';

// ---- limiter: per-IP units in a window + global daily cap counted in quarter-lookbooks ----
const ipUnits = new Map<string, { units: number; resetAt: number }>();
const IP_MAP_SWEEP_SIZE = 1000;
let daily = { day: '', units: 0 };

function dailyLimit(): number {
  const value = Number.parseInt(process.env.LOOKBOOK_DAILY_LIMIT ?? '', 10);
  return Number.isFinite(value) && value >= 0 ? value : LOOKBOOK_LIMITS.dailyLimitDefault;
}

/** Spends `units` for this IP and for today, or returns why it is refused (nothing is spent then). */
function spend(ip: string, units: number): 'rate_limited' | 'quota_exhausted' | null {
  const now = Date.now();
  if (ipUnits.size > IP_MAP_SWEEP_SIZE) {
    for (const [key, record] of ipUnits) if (now > record.resetAt) ipUnits.delete(key);
  }
  let record = ipUnits.get(ip);
  if (!record || now > record.resetAt) record = { units: 0, resetAt: now + LOOKBOOK_LIMITS.windowMs };
  if (record.units + units > LOOKBOOK_LIMITS.unitsPerWindow) return 'rate_limited';
  const day = new Date(now).toISOString().slice(0, 10);
  if (daily.day !== day) daily = { day, units: 0 };
  if (daily.units + units > dailyLimit() * LOOKBOOK_LIMITS.lookbookUnits) return 'quota_exhausted';
  record.units += units;
  ipUnits.set(ip, record);
  daily.units += units;
  return null;
}

// ---- photos that already passed the check ----
// The age/one-person check is not deterministic: the same photo can pass /check and then fail a later
// re-check mid-shoot. Remember a SHA-256 digest (never the photo) of passed photos for a while.
const passedPhotos = new Map<string, number>();
const PASSED_PHOTO_TTL_MS = 30 * 60_000;
const PASSED_PHOTO_MAX = 500;
const photoDigest = (image: string) => crypto.createHash('sha256').update(image).digest('hex');

function rememberPassed(image: string): void {
  const now = Date.now();
  if (passedPhotos.size >= PASSED_PHOTO_MAX) {
    for (const [key, expiresAt] of passedPhotos) if (expiresAt < now) passedPhotos.delete(key);
    if (passedPhotos.size >= PASSED_PHOTO_MAX) passedPhotos.delete(passedPhotos.keys().next().value as string);
  }
  passedPhotos.set(photoDigest(image), now + PASSED_PHOTO_TTL_MS);
}

function hasPassed(image: string): boolean {
  const expiresAt = passedPhotos.get(photoDigest(image));
  return expiresAt !== undefined && expiresAt > Date.now();
}

// ---- shared gate for /lookbook and /lookbook/angle ----
function newAbort(res: Response): AbortController {
  const ac = new AbortController();
  // req 'close' fires once the body is read; only a response closed before it ended means the client left.
  res.on('close', () => { if (!res.writableEnded) ac.abort(); });
  return ac;
}

/** Validates, charges the limiter and re-checks the person photo. Answers the client itself and returns false when refused. */
async function admit(req: Request, res: Response, data: LookbookRequest | undefined, units: number, ac: AbortController): Promise<boolean> {
  if (!data || !hasCatalogIds(data.garmentId, data.accessoryIds)) {
    res.status(400).json({ ok: false });
    return false;
  }
  const denied = spend(req.ip || req.socket.remoteAddress || 'unknown', units);
  if (denied) {
    res.status(429).json({ ok: false, fallback: { reason: denied } });
    return false;
  }
  if (data.mode === 'personal' && !hasPassed(data.personImage as string)) {
    try {
      const check = await checkPersonPhoto(data.personImage as string, ac.signal);
      if (check.verdict === 'block') {
        res.status(422).json({ ok: false, fallback: { reason: 'safety_blocked' }, check });
        return false;
      }
      rememberPassed(data.personImage as string);
    } catch (err) {
      if (ac.signal.aborted) return false;
      const reason = toFallbackReason(err);
      console.warn(`[lookbook] recheck reason=${reason}`);
      res.json({ ok: false, fallback: { reason } });
      return false;
    }
  }
  return true;
}

function failUnexpected(res: Response, endpoint: string, err: unknown): void {
  console.warn(`[lookbook] ${endpoint} reason=ai_unavailable (${err instanceof Error ? err.name : 'unknown'})`);
  if (!res.headersSent) res.status(500).json({ ok: false });
  else if (!res.writableEnded) res.end();
}

// ---- POST /api/ai/lookbook/check ----
export async function handleLookbookCheck(req: Request, res: Response): Promise<void> {
  const parsed = LookbookCheckRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ ok: false }); return; }
  const ac = newAbort(res);
  try {
    const check = await checkPersonPhoto(parsed.data.personImage, ac.signal);
    if (check.verdict !== 'block') rememberPassed(parsed.data.personImage);
    res.json({ ok: true, data: check });
  } catch (err) {
    if (ac.signal.aborted) return;
    const reason = toFallbackReason(err);
    console.warn(`[lookbook] check reason=${reason}`);
    res.json({ ok: false, fallback: { reason } });
  }
}

// ---- POST /api/ai/lookbook (SSE) ----
export async function handleLookbook(req: Request, res: Response): Promise<void> {
  const parsed = LookbookRequestSchema.safeParse(req.body);
  const ac = newAbort(res);
  try {
    // A cached set costs no Gemini call, so it does not use up the visitor's or the day's quota.
    const units = parsed.data && isLookbookCached(parsed.data) ? 0 : LOOKBOOK_LIMITS.lookbookUnits;
    if (!(await admit(req, res, parsed.data, units, ac)) || !parsed.data) return;
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const beat = setInterval(() => { if (!res.writableEnded) res.write(': ping\n\n'); }, LOOKBOOK_LIMITS.heartbeatMs);
    const emit = (event: LookbookStreamEvent) => {
      if (ac.signal.aborted || res.writableEnded) return;
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
    };
    try {
      await generateLookbook(parsed.data, emit, ac.signal);
    } finally {
      clearInterval(beat);
      if (!res.writableEnded) res.end();
    }
  } catch (err) {
    failUnexpected(res, 'lookbook', err);
  }
}

// ---- POST /api/ai/lookbook/angle ----
export async function handleLookbookAngle(req: Request, res: Response): Promise<void> {
  const parsed = LookbookAngleRequestSchema.safeParse(req.body);
  const ac = newAbort(res);
  try {
    if (!(await admit(req, res, parsed.data, LOOKBOOK_LIMITS.angleUnits, ac)) || !parsed.data) return;
    const result = await generateAngle(parsed.data, ac.signal);
    if (ac.signal.aborted) return;
    if (!result.ok) { res.json({ ok: false, fallback: { reason: result.reason } }); return; }
    res.json({ ok: true, data: { id: result.id, image: result.image, ...(result.heroToken ? { heroToken: result.heroToken } : {}) } });
  } catch (err) {
    failUnexpected(res, 'angle', err);
  }
}
