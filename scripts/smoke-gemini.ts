import 'dotenv/config';
import { AI_MODELS } from '../src/config/ai-models.ts';

// Live check against the Gemini API. Needs GEMINI_API_KEY (.env or environment). Usage: npx tsx scripts/smoke-gemini.ts
if (!process.env.GEMINI_API_KEY) {
  console.error('FAIL: GEMINI_API_KEY missing (set it in .env or the environment)');
  process.exit(1);
}

// Loaded after the key check so gemini-client.ts does not print its own warning
const { ai } = await import('../src/server/ai/gemini-client.ts');

const brief = (err: unknown) => (err instanceof Error ? err.message : String(err)).split('\n')[0].slice(0, 160);
let failed = false;

try {
  const names = new Set<string>();
  for await (const m of await ai.models.list({ config: { pageSize: 100 } })) {
    names.add((m.name ?? '').replace(/^models\//, ''));
  }
  const missing = [AI_MODELS.VISION_MODEL, AI_MODELS.IMAGE_GENERATION_MODEL].filter((id) => !names.has(id));
  if (missing.length > 0) throw new Error(`not listed: ${missing.join(', ')}`);
  console.log(`OK list: ${AI_MODELS.VISION_MODEL}, ${AI_MODELS.IMAGE_GENERATION_MODEL} available`);
} catch (err) {
  failed = true;
  console.log(`FAIL list: ${brief(err)}`);
}

try {
  const res = await ai.models.generateContent({
    model: AI_MODELS.VISION_MODEL,
    contents: 'Trả lời đúng một từ: xin chào',
    config: { abortSignal: AbortSignal.timeout(30_000) }
  });
  if (!res.text?.trim()) throw new Error('empty text response');
  console.log(`OK text: ${AI_MODELS.VISION_MODEL}`);
} catch (err) {
  failed = true;
  console.log(`FAIL text: ${brief(err)}`);
}

try {
  const res = await ai.models.generateContent({
    model: AI_MODELS.IMAGE_GENERATION_MODEL,
    contents: { parts: [{ text: 'A small red dot on a plain white background.' }] },
    config: { abortSignal: AbortSignal.timeout(AI_MODELS.LOOKBOOK_TIMEOUT_MS), imageConfig: { aspectRatio: '1:1', imageSize: '1K' } }
  });
  const hasImage = res.candidates?.[0]?.content?.parts?.some((p) => p.inlineData?.data);
  if (!hasImage) throw new Error('no image in response');
  console.log(`OK image: ${AI_MODELS.IMAGE_GENERATION_MODEL}`);
} catch (err) {
  failed = true;
  console.log(`FAIL image: ${brief(err)}`);
}

process.exit(failed ? 1 : 0);
