// POST /api/ai/avatar-portrait: turns the player's own photo into a pixel bust in the game's portrait style.
// The photo lives only in this request; the client pixelates and keeps the result (see src/game/player-portrait.ts).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ai } from './gemini-client.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import { LOOKBOOK_LIMITS } from '../../config/lookbook-limits.ts';
import { toFallbackReason } from './sanitize.ts';
import { checkPersonPhoto, splitDataUrl } from './lookbook-check.ts';

const PortraitRequestSchema = z.object({
  personImage: z.string().max(LOOKBOOK_LIMITS.maxChars.person).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
}).strict();

// Copy of a game portrait (cụ Loan, idle) in public/, so Vite ships it in dist/ for production.
const STYLE_REF_DIRS = process.env.NODE_ENV === 'production' ? ['dist', 'public'] : ['public', 'dist'];
const PORTRAIT_TIMEOUT_MS = 45_000;

const PROMPT = [
  'Image 1 is a photo of the player. Image 2 shows the art style of this game\'s character portraits.',
  'Draw the person from image 1 as a new pixel-art bust portrait in exactly the style of image 2:',
  'chunky visible pixels, clean dark outline, soft cel shading, slightly chibi proportions with large eyes, head and shoulders, facing the viewer, gentle smile.',
  'Keep what makes the person recognisable: face shape, hairstyle, hair length, hair colour, glasses if they wear them, skin tone.',
  'Dress them in a simple cream Vietnamese áo dài with a low standing collar.',
  'Flat solid soft pink background (#F4CAD7), no frame, no text, no watermark. One single portrait, square.'
].join(' ');

let styleRef: { mimeType: string; data: string } | null = null;
async function loadStyleRef() {
  for (const dir of STYLE_REF_DIRS) {
    if (styleRef) break;
    try {
      styleRef = { mimeType: 'image/png', data: (await readFile(path.resolve(process.cwd(), dir, 'portrait-style', 'style-ref.png'))).toString('base64') };
    } catch { /* try the next directory */ }
  }
  if (!styleRef) throw new Error('portrait style reference missing');
  return styleRef;
}

export async function handleAvatarPortrait(req: Request, res: Response): Promise<void> {
  const parsed = PortraitRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ ok: false }); return; }
  const ac = new AbortController();
  res.on('close', () => { if (!res.writableEnded) ac.abort(); });
  try {
    const check = await checkPersonPhoto(parsed.data.personImage, ac.signal);
    if (check.verdict === 'block') {
      res.status(422).json({ ok: false, fallback: { reason: 'safety_blocked', check } });
      return;
    }
    const response = await ai.models.generateContent({
      model: AI_MODELS.IMAGE_GENERATION_MODEL,
      contents: { parts: [
        { inlineData: splitDataUrl(parsed.data.personImage) },
        { inlineData: await loadStyleRef() },
        { text: PROMPT }
      ] },
      config: {
        abortSignal: AbortSignal.any([ac.signal, AbortSignal.timeout(PORTRAIT_TIMEOUT_MS)]),
        imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
      }
    });
    const image = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData;
    if (!image?.data) {
      res.json({ ok: false, fallback: { reason: 'invalid_output' } });
      return;
    }
    res.json({ ok: true, data: { image: `data:${image.mimeType ?? 'image/jpeg'};base64,${image.data}` } });
  } catch (err) {
    if (ac.signal.aborted) return;
    const reason = toFallbackReason(err);
    console.warn(`[avatar-portrait] reason=${reason}`);
    if (!res.headersSent) res.json({ ok: false, fallback: { reason } });
  }
}
