// Lookbook generation: front (hero) first, then turn/back/detail in parallel anchored on the hero image.
// Personal photos live only in the request: never cached, never logged.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Part } from '@google/genai';
import { ai } from './gemini-client.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import { LOOKBOOK_LIMITS } from '../../config/lookbook-limits.ts';
import { toFallbackReason } from './sanitize.ts';
import { splitDataUrl } from './lookbook-check.ts';
import { buildLookbookPrompt, type LookbookImageRole } from './lookbook-prompt.ts';
import { LOOKBOOK_ANGLE_IDS, type LookbookAngleId, type LookbookAngleRequest, type LookbookReason, type LookbookRequest, type LookbookStreamEvent } from './lookbook-contract.ts';

type ImageResult = { ok: true; image: string } | { ok: false; reason: LookbookReason };
type Inline = { mimeType: string; data: string };
type AngleImages = Record<LookbookAngleId, string>;

const SAFETY_FINISH = new Set(['SAFETY', 'IMAGE_SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_PROHIBITED_CONTENT']);
// A hero failure is retried once only when it failed fast; slow failures would blow the stream budget.
const HERO_RETRY_MAX_MS = 20_000;

// ---- garment reference photos (static assets, kept in RAM) ----
const refCache = new Map<string, string | null>();

async function loadGarmentRef(id: string): Promise<string | null> {
  const cached = refCache.get(id);
  if (cached !== undefined) return cached;
  const dirs = process.env.NODE_ENV === 'production' ? ['dist', 'public'] : ['public', 'dist'];
  for (const dir of /^[a-z0-9-]+$/.test(id) ? dirs : []) {
    try {
      const data = (await fs.readFile(path.resolve(process.cwd(), dir, 'lookbook-ref', `${id}.jpg`))).toString('base64');
      refCache.set(id, data);
      return data;
    } catch { /* try the other folder */ }
  }
  console.warn(`[lookbook] garment reference missing id=${id}: using text-only description`);
  refCache.set(id, null);
  return null;
}

// ---- hero token: proves the anchor image was produced by this server ----
let tokenSecret: string | null = null;

export function signHero(image: string): string {
  tokenSecret ??= process.env.LOOKBOOK_HERO_SECRET || crypto.randomBytes(32).toString('hex');
  return crypto.createHmac('sha256', tokenSecret).update(image).digest('hex');
}

function heroTokenValid(image: string, token: string): boolean {
  const expected = Buffer.from(signHero(image));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// ---- fictional-set cache: LRU (Map keeps insertion order), max 6 entries ----
const setCache = new Map<string, { images: AngleImages; expiresAt: number }>();

function cacheKeyOf(req: LookbookRequest): string | null {
  if (req.mode !== 'fictional' || req.moodId === 'custom') return null;
  const parts = [req.modelGender, req.garmentId, req.colorPalette, req.accessoryIds, req.eventId, req.moodId];
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

function cacheGet(key: string): AngleImages | null {
  const entry = setCache.get(key);
  setCache.delete(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  setCache.set(key, entry);
  return entry.images;
}

function cacheSet(key: string, images: AngleImages): void {
  setCache.delete(key);
  setCache.set(key, { images, expiresAt: Date.now() + LOOKBOOK_LIMITS.cacheTtlMs });
  while (setCache.size > LOOKBOOK_LIMITS.cacheMaxEntries) setCache.delete(setCache.keys().next().value as string);
}

/** True when generateLookbook would answer from the cache, so the request costs no Gemini call. */
export function isLookbookCached(req: LookbookRequest): boolean {
  const key = cacheKeyOf(req);
  return Boolean(key && !req.noCache && cacheGet(key));
}

// ---- one image call: never throws, returns a reason code ----
async function callImage(parts: Part[], signal: AbortSignal): Promise<ImageResult> {
  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.IMAGE_GENERATION_MODEL,
      contents: { parts },
      config: {
        abortSignal: AbortSignal.any([signal, AbortSignal.timeout(AI_MODELS.LOOKBOOK_TIMEOUT_MS)]),
        imageConfig: { aspectRatio: '3:4', imageSize: '1K' }
      }
    });
    const candidate = response.candidates?.[0];
    const outParts = candidate?.content?.parts ?? [];
    const imagePart = outParts.find(p => p.inlineData?.data);
    if (imagePart?.inlineData?.data) {
      return { ok: true, image: `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}` };
    }
    // Gemini refuses with finishReason STOP and a text-only answer, or with a block/finish reason.
    const blocked = Boolean(response.promptFeedback?.blockReason)
      || SAFETY_FINISH.has(String(candidate?.finishReason))
      || (outParts.length > 0 && outParts.every(p => typeof p.text === 'string'));
    return { ok: false, reason: blocked ? 'safety_blocked' : 'invalid_output' };
  } catch (err) {
    if ((err as { status?: unknown } | null)?.status === 403) console.warn('[lookbook] gemini answered 403: billing/credit or permission?');
    return { ok: false, reason: toFallbackReason(err) };
  }
}

async function runAngle(endpoint: string, req: LookbookRequest, angle: LookbookAngleId, hero: string | null, garmentRef: string | null, signal: AbortSignal): Promise<ImageResult> {
  const prompt = buildLookbookPrompt({
    mode: req.mode, modelGender: req.modelGender, garmentId: req.garmentId, colorPalette: req.colorPalette,
    accessoryIds: req.accessoryIds, eventId: req.eventId, moodId: req.moodId, angle,
    has: { garmentRef: garmentRef !== null, background: req.backgroundImage !== undefined, hero: hero !== null }
  });
  const sources: Record<LookbookImageRole, Inline | null> = {
    person: req.personImage ? splitDataUrl(req.personImage) : null,
    garment: garmentRef ? { mimeType: 'image/jpeg', data: garmentRef } : null,
    background: req.backgroundImage ? splitDataUrl(req.backgroundImage) : null,
    hero: hero ? splitDataUrl(hero) : null
  };
  const parts: Part[] = prompt.imageOrder.map(role => ({ inlineData: sources[role] as Inline }));
  parts.push({ text: prompt.text });
  const result = await callImage(parts, signal);
  if (!result.ok && !signal.aborted) console.warn(`[lookbook] ${endpoint} angle=${angle} reason=${result.reason}`);
  return result;
}

export async function generateLookbook(req: LookbookRequest, emit: (e: LookbookStreamEvent) => void, signal: AbortSignal): Promise<void> {
  const key = cacheKeyOf(req);
  const hit = key && !req.noCache ? cacheGet(key) : null;
  const images: Partial<AngleImages> = {};
  const send = (id: LookbookAngleId, result: ImageResult) => emit({
    type: 'angle',
    data: result.ok
      ? { id, status: 'done', image: result.image, ...(id === 'front' ? { heroToken: signHero(result.image) } : {}) }
      : { id, status: 'error', reason: result.reason }
  });
  emit({ type: 'start', data: { total: 4, cached: hit !== null } });
  if (hit) {
    for (const id of LOOKBOOK_ANGLE_IDS) send(id, { ok: true, image: hit[id] });
    emit({ type: 'done', data: { completed: 4 } });
    return;
  }

  const budget = AbortSignal.any([signal, AbortSignal.timeout(LOOKBOOK_LIMITS.streamBudgetMs)]);
  const garmentRef = await loadGarmentRef(req.garmentId);
  const startedAt = Date.now();
  let hero = await runAngle('lookbook', req, 'front', null, garmentRef, budget);
  if (!hero.ok && !budget.aborted && hero.reason !== 'timeout' && hero.reason !== 'safety_blocked' && Date.now() - startedAt < HERO_RETRY_MAX_MS) {
    hero = await runAngle('lookbook', req, 'front', null, garmentRef, budget);
  }
  if (signal.aborted) return;
  if (hero.ok) images.front = hero.image;
  send('front', hero);

  const rest = LOOKBOOK_ANGLE_IDS.filter(id => id !== 'front');
  if (!hero.ok && hero.reason === 'safety_blocked') {
    for (const id of rest) send(id, hero);
    emit({ type: 'done', data: { completed: 0 } });
    return;
  }
  await Promise.all(rest.map(async id => {
    const result = await runAngle('lookbook', req, id, hero.ok ? hero.image : null, garmentRef, budget);
    if (signal.aborted) return;
    if (result.ok) images[id] = result.image;
    send(id, result);
  }));
  if (signal.aborted) return;
  const completed = Object.keys(images).length;
  if (key && completed === 4) cacheSet(key, images as AngleImages);
  emit({ type: 'done', data: { completed } });
}

type AngleOutcome = { ok: true; id: LookbookAngleId; image: string; heroToken?: string } | { ok: false; reason: LookbookReason };

export async function generateAngle(req: LookbookAngleRequest, signal: AbortSignal): Promise<AngleOutcome> {
  // A hero only counts as an anchor when its token proves this server made it; otherwise generate unanchored.
  const anchor = req.angle !== 'front' && req.heroImage && req.heroToken && heroTokenValid(req.heroImage, req.heroToken) ? req.heroImage : null;
  const result = await runAngle('angle', req, req.angle, anchor, await loadGarmentRef(req.garmentId), signal);
  if (!result.ok) return result;
  return { ok: true, id: req.angle, image: result.image, ...(req.angle === 'front' ? { heroToken: signHero(result.image) } : {}) };
}
