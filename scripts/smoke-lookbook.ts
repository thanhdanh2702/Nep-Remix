import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Live Lookbook smoke: runs the real pipeline (generateLookbook) and saves the photos so a human can judge them.
// Costs money: ~$0.135 per lookbook (4 images at ~$0.034). Needs GEMINI_API_KEY (.env or environment).
// Usage:   npx tsx scripts/smoke-lookbook.ts
// Env:     SMOKE_LOOKBOOK_COUNT=1..3     how many of the 3 configs below to run, in order (default 1)
//          SMOKE_LOOKBOOK_PICK=3,1       run exactly these configs (1-based) instead of the first COUNT
//          SMOKE_MODEL_GENDER=male       override modelGender for the fictional runs (default female)
//          SMOKE_PERSON_PHOTO=<file>     also run one personal lookbook (check first). Photos stay in artifacts/: delete them after viewing
//          SMOKE_OUT_DIR=<dir>           where to write the photos (default artifacts/lookbook-smoke/<timestamp>)
if (!process.env.GEMINI_API_KEY) {
  console.error('FAIL: GEMINI_API_KEY missing (set it in .env or the environment)');
  process.exit(1);
}

// Loaded after the key check so gemini-client.ts does not print its own warning
const { ai } = await import('../src/server/ai/gemini-client.ts');
const { generateLookbook } = await import('../src/server/ai/lookbook-generate.ts');
const { checkPersonPhoto } = await import('../src/server/ai/lookbook-check.ts');
const { loadContent } = await import('../src/content/index.ts');
const { LookbookRequestSchema, LOOKBOOK_ANGLE_IDS } = await import('../src/server/ai/lookbook-contract.ts');
type Request = import('../src/server/ai/lookbook-contract.ts').LookbookRequest;

const brief = (err: unknown) => (err instanceof Error ? err.message : String(err)).split('\n')[0].slice(0, 160);
const content = loadContent();
const paletteOf = (garmentId: string) => content.garmentsById.get(garmentId)!.defaultColorPalette.map(c => c.toLowerCase()) as Request['colorPalette'];

const CONFIGS = [
  { garmentId: 'ao-ngu-than-tay-chen', moodId: 'pho-co', eventId: 'dao_pho' },
  { garmentId: 'ao-dai-raglan', moodId: 'vuon-hoa', eventId: 'tet' },
  { garmentId: 'ao-tu-than', moodId: 'san-nha', eventId: 'vieng_tang' }
] as const;

const picks = process.env.SMOKE_LOOKBOOK_PICK
  ? process.env.SMOKE_LOOKBOOK_PICK.split(',').map(n => Number(n.trim()))
  : Array.from({ length: Math.min(3, Math.max(1, Number(process.env.SMOKE_LOOKBOOK_COUNT ?? 1) || 1)) }, (_, i) => i + 1);
if (picks.some(n => !Number.isInteger(n) || n < 1 || n > CONFIGS.length)) {
  console.error('FAIL: SMOKE_LOOKBOOK_PICK must list numbers 1-3');
  process.exit(1);
}
const gender = process.env.SMOKE_MODEL_GENDER === 'male' ? 'male' : 'female';
const outRoot = process.env.SMOKE_OUT_DIR ?? path.join('artifacts', 'lookbook-smoke', new Date().toISOString().replace(/[:.]/g, '-'));

// Count the real image calls (the pipeline may retry the hero once).
let geminiCalls = 0;
const realGenerate = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = ((params: Parameters<typeof realGenerate>[0]) => { geminiCalls++; return realGenerate(params); }) as typeof realGenerate;

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
let failed = false;

async function runLookbook(label: string, raw: Record<string, unknown>): Promise<void> {
  const parsed = LookbookRequestSchema.safeParse(raw);
  if (!parsed.success) { failed = true; console.log(`FAIL ${label}: request invalid (${parsed.error.issues[0]?.path.join('.')})`); return; }
  const dir = path.join(outRoot, label);
  mkdirSync(dir, { recursive: true });
  const callsBefore = geminiCalls;
  const startedAt = Date.now();
  let firstImageMs: number | undefined;
  const results: Record<string, string> = {};
  try {
    await generateLookbook(parsed.data, event => {
      if (event.type !== 'angle') return;
      const { id, status, image, reason } = event.data;
      results[id] = status === 'done' ? 'done' : `error:${reason}`;
      if (status === 'done' && image) {
        firstImageMs ??= Date.now() - startedAt;
        const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(image);
        if (match) writeFileSync(path.join(dir, `${id}.${EXT[match[1]] ?? 'bin'}`), Buffer.from(match[2], 'base64'));
      }
    }, new AbortController().signal);
  } catch (err) {
    failed = true;
    console.log(`FAIL ${label}: ${brief(err)}`);
    return;
  }
  const done = LOOKBOOK_ANGLE_IDS.filter(id => results[id] === 'done').length;
  const calls = geminiCalls - callsBefore;
  console.log(`${done === 4 ? 'OK  ' : 'FAIL'} ${label}: ${LOOKBOOK_ANGLE_IDS.map(id => `${id}=${results[id] ?? 'missing'}`).join(' ')}`);
  console.log(`     ${done}/4 images, ${calls} image calls, firstImageMs=${firstImageMs ?? 'none'}, total=${Date.now() - startedAt}ms -> ${dir}`);
  if (done !== 4) failed = true;
  if (calls > 5) console.log('     WARN: more than 5 image calls');
  if (firstImageMs === undefined || firstImageMs > 15_000) console.log('     WARN: firstImageMs over 15000');
}

console.log(`smoke-lookbook: ${picks.length} fictional lookbook(s), modelGender=${gender}, noCache, out=${outRoot}`);
for (const n of picks) {
  const config = CONFIGS[n - 1];
  await runLookbook(`${n}-${config.garmentId}-${config.eventId}`, {
    mode: 'fictional', modelGender: gender, ...config, colorPalette: paletteOf(config.garmentId), accessoryIds: [], noCache: true
  });
}

const photoFile = process.env.SMOKE_PERSON_PHOTO;
if (photoFile) {
  const mime = { '.png': 'image/png', '.webp': 'image/webp' }[path.extname(photoFile).toLowerCase()] ?? 'image/jpeg';
  const personImage = `data:${mime};base64,${readFileSync(photoFile).toString('base64')}`;
  try {
    const check = await checkPersonPhoto(personImage, AbortSignal.timeout(30_000));
    console.log(`check: verdict=${check.verdict} onePerson=${check.onePerson} faceVisible=${check.faceVisible} fullBody=${check.fullBody} looksAdult=${check.looksAdult}`);
    if (check.verdict === 'block') failed = true;
    else {
      const config = CONFIGS[0];
      await runLookbook(`personal-${config.garmentId}`, {
        mode: 'personal', personImage, ...config, colorPalette: paletteOf(config.garmentId), accessoryIds: [], noCache: true
      });
    }
  } catch (err) {
    failed = true;
    console.log(`FAIL check: ${brief(err)}`);
  }
  console.log('Personal photos were written to the output folder: delete them after viewing.');
}

process.exit(failed ? 1 : 0);
