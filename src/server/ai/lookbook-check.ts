// Server-side check that a user photo is usable for a try-on. The photo is only held in memory for this call.
import { z } from 'zod';
import { Type, ThinkingLevel } from '@google/genai';
import { ai } from './gemini-client.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import type { LookbookCheckResult } from './lookbook-contract.ts';

const CHECK_TIMEOUT_MS = 15_000;

const CheckAnswerSchema = z.object({
  onePerson: z.boolean(),
  faceVisible: z.boolean(),
  fullBody: z.boolean(),
  looksAdult: z.boolean()
});

const CHECK_PROMPT = [
  'You review a photo before a virtual clothing try-on. Answer only with the JSON fields:',
  'onePerson: exactly one real person is clearly the subject (no groups, no crowd, not a drawing or a screenshot of a screen).',
  'faceVisible: the face is visible, facing the camera or close to it, not covered or cut off.',
  'fullBody: the body is visible from head to at least the knees.',
  'looksAdult: the person clearly looks like an adult.'
].join('\n');

/** Split "data:image/png;base64,AAAA" into the parts the SDK expects. */
export function splitDataUrl(value: string): { mimeType: string; data: string } {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(value);
  if (!match) throw new Error('not a data url');
  return { mimeType: match[1], data: match[2] };
}

export function toVerdict(a: z.infer<typeof CheckAnswerSchema>): LookbookCheckResult['verdict'] {
  if (!a.onePerson || !a.faceVisible || !a.looksAdult) return 'block';
  return a.fullBody ? 'ok' : 'warn';
}

/** Throws when the model fails or answers off-schema; the caller maps that to a reason code. */
export async function checkPersonPhoto(personImage: string, signal: AbortSignal): Promise<LookbookCheckResult> {
  const { mimeType, data } = splitDataUrl(personImage);
  const response = await ai.models.generateContent({
    model: AI_MODELS.VISION_MODEL,
    contents: { parts: [{ inlineData: { mimeType, data } }, { text: CHECK_PROMPT }] },
    config: {
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(CHECK_TIMEOUT_MS)]),
      // Low thinking: ~2.7s instead of ~6s for a yes/no check.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          onePerson: { type: Type.BOOLEAN },
          faceVisible: { type: Type.BOOLEAN },
          fullBody: { type: Type.BOOLEAN },
          looksAdult: { type: Type.BOOLEAN }
        },
        required: ['onePerson', 'faceVisible', 'fullBody', 'looksAdult']
      }
    }
  });
  let raw: unknown = {};
  try { raw = JSON.parse(response.text ?? '{}'); } catch { /* off-schema text: the parse below throws a ZodError -> invalid_output */ }
  const answer = CheckAnswerSchema.parse(raw);
  return { ...answer, verdict: toVerdict(answer) };
}
