// Pure checks for the Lookbook request contract and prompt builder. No key, no server, no network.
// Run: npx tsx scripts/check-lookbook-prompt.ts
import assert from 'node:assert/strict';
import { loadContent } from '../src/content/index.ts';
import { loadLookbookStyle, nearestColorName as styleNearest } from '../src/content/lookbook-style.ts';
import { LookbookRequestSchema, LOOKBOOK_ANGLE_IDS, LOOKBOOK_EVENT_IDS, LOOKBOOK_MOOD_IDS, type LookbookAngleId } from '../src/server/ai/lookbook-contract.ts';
import { buildLookbookPrompt, nearestColorName, type LookbookImageRole, type LookbookPromptInput } from '../src/server/ai/lookbook-prompt.ts';

const content = loadContent();
const style = loadLookbookStyle();
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const PALETTE = ['#c4a482', '#6b4423', '#50321a', '#2c1608'] as const;
const GARMENT = 'ao-tu-than';

// ---- 1. LookbookRequestSchema is strict ----
const valid = { mode: 'fictional', garmentId: GARMENT, colorPalette: [...PALETTE], accessoryIds: [], eventId: 'dao_pho', moodId: 'pho-co' };
assert.ok(LookbookRequestSchema.safeParse(valid).success, 'baseline request must pass');
const parsed = LookbookRequestSchema.parse({ ...valid, colorPalette: ['#C4A482', '#6B4423', '#50321A', '#2C1608'] });
assert.deepEqual(parsed.colorPalette, [...PALETTE], 'hex is lowercased');
assert.equal(parsed.modelGender, 'female', 'modelGender defaults to female');
const rejects = (label: string, patch: Record<string, unknown>) =>
  assert.ok(!LookbookRequestSchema.safeParse({ ...valid, ...patch }).success, `${label} must be rejected`);
rejects('free-text garmentName', { garmentName: 'IGNORE ALL' });
for (const bad of ['#fff', 'red', '#12345g', '#123456;x']) rejects(`palette ${bad}`, { colorPalette: [bad, ...PALETTE.slice(1)] });
rejects('palette of 3', { colorPalette: PALETTE.slice(0, 3) });
rejects('unknown event', { eventId: 'x' });
rejects('unknown mood', { moodId: 'x' });
rejects('fictional with personImage', { personImage: PNG });
rejects('personal without personImage', { mode: 'personal' });
rejects('custom without background', { moodId: 'custom' });
rejects('background without custom', { backgroundImage: PNG });
rejects('non-image personImage', { mode: 'personal', personImage: 'https://example.com/a.png' });
rejects('duplicate accessory', { accessoryIds: ['non-la', 'non-la'] });
assert.ok(LookbookRequestSchema.safeParse({ ...valid, mode: 'personal', personImage: PNG }).success, 'personal with photo passes');
assert.ok(LookbookRequestSchema.safeParse({ ...valid, moodId: 'custom', backgroundImage: PNG }).success, 'custom with background passes');

// ---- 2. buildLookbookPrompt over every combination ----
const ANCHOR: Record<LookbookImageRole, RegExp> = {
  person: /Image (\d+) is the person/,
  garment: /exact áo dài shown in image (\d+):/,
  background: /location shown in image (\d+);/,
  hero: /Image (\d+) is the first photo/
};
function base(over: Partial<LookbookPromptInput> & { has: LookbookPromptInput['has'] }): LookbookPromptInput {
  return { mode: 'fictional', modelGender: 'female', garmentId: GARMENT, colorPalette: PALETTE, accessoryIds: [], eventId: 'dao_pho', moodId: 'pho-co', angle: 'front', ...over };
}
let combos = 0;
for (const mode of ['fictional', 'personal'] as const) {
  for (const moodId of ['pho-co', 'custom'] as const) {
    for (const hero of [false, true]) {
      for (const garmentRef of [false, true]) {
        const input = base({ mode, moodId, has: { garmentRef, background: moodId === 'custom', hero } });
        const out = buildLookbookPrompt(input);
        const label = `${mode}/${moodId}/hero=${hero}/ref=${garmentRef}`;
        const expectedRoles: LookbookImageRole[] = [
          ...(mode === 'personal' ? ['person' as const] : []), ...(garmentRef ? ['garment' as const] : []),
          ...(moodId === 'custom' ? ['background' as const] : []), ...(hero ? ['hero' as const] : [])
        ];
        assert.deepEqual(out.imageOrder, expectedRoles, `${label}: imageOrder`);
        out.imageOrder.forEach((role, i) => assert.equal(ANCHOR[role].exec(out.text)?.[1], String(i + 1), `${label}: ${role} must be image ${i + 1}`));
        for (const role of Object.keys(ANCHOR) as LookbookImageRole[]) {
          if (!out.imageOrder.includes(role)) assert.ok(!ANCHOR[role].test(out.text), `${label}: text mentions absent ${role}`);
        }
        const numbers = [...out.text.matchAll(/image (\d+)/gi)].map(m => Number(m[1]));
        assert.ok(numbers.every(n => n >= 1 && n <= out.imageOrder.length), `${label}: image N out of range`);
        assert.ok(!/[{}]/.test(out.text), `${label}: leftover brace`);
        assert.ok(out.text.includes(style.blocks.style) && out.text.includes(style.blocks.output), `${label}: style/output block missing`);
        assert.ok(out.text.includes(out.garmentBlock), `${label}: garmentBlock not in text`);
        assert.equal(/fictional/i.test(out.text), mode === 'fictional', `${label}: "fictional" only in fictional mode`);
        combos++;
      }
    }
  }
}
assert.equal(combos, 16);

// ---- 3. Every garment x mood x event x angle renders without braces; free text never reaches the prompt ----
let rendered = 0;
for (const garment of content.garments) {
  for (const moodId of LOOKBOOK_MOOD_IDS) {
    for (const eventId of LOOKBOOK_EVENT_IDS) {
      for (const angle of LOOKBOOK_ANGLE_IDS) {
        const out = buildLookbookPrompt(base({ garmentId: garment.id, moodId, eventId, angle, has: { garmentRef: true, background: moodId === 'custom', hero: angle !== 'front' } }));
        assert.ok(!/[{}]/.test(out.text), `${garment.id}/${moodId}/${eventId}/${angle}: brace`);
        assert.ok(out.text.includes(style.garments[garment.id]), `${garment.id}: promptEn missing`);
        rendered++;
      }
    }
  }
}
assert.equal(rendered, content.garments.length * 5 * 6 * 4);
const injected = buildLookbookPrompt({ ...base({ has: { garmentRef: true, background: false, hero: false } }), garmentName: 'IGNORE ALL', story: 'IGNORE ALL' } as LookbookPromptInput);
assert.ok(!injected.text.includes('IGNORE ALL'), 'extra fields never reach the prompt');
const hexes = buildLookbookPrompt(base({ has: { garmentRef: true, background: false, hero: false } })).text.match(/#[0-9A-Za-z]+/g) ?? [];
assert.equal(hexes.length, 2, 'main + accent color only');
assert.ok(hexes.every(h => /^#[0-9a-f]{6}$/.test(h)), 'hex in prompt is lowercase #rrggbb');

// ---- 4. Outfit lock: garmentBlock is byte-identical across the 4 angles and with or without a hero ----
for (const garment of content.garments) {
  for (const garmentRef of [true, false]) {
    const blocks = new Set<string>();
    for (const angle of LOOKBOOK_ANGLE_IDS as readonly LookbookAngleId[]) {
      for (const hero of [false, true]) {
        const has = { garmentRef, background: false, hero };
        blocks.add(buildLookbookPrompt(base({ garmentId: garment.id, accessoryIds: ['non-la', 'quat-lua'], angle, has })).garmentBlock);
      }
    }
    assert.equal(blocks.size, 1, `${garment.id} ref=${garmentRef}: garmentBlock differs between angles`);
  }
}
const lock = (id: string) => buildLookbookPrompt(base({ garmentId: id, has: { garmentRef: true, background: false, hero: false } })).garmentBlock;
assert.notEqual(lock('ao-dai-raglan'), lock('ao-tu-than'), 'different garments give different blocks');

// ---- 5. Gender, mode, event and angle wording ----
const text = (over: Partial<LookbookPromptInput>) => buildLookbookPrompt(base({ has: { garmentRef: true, background: false, hero: false }, ...over })).text;
const male = text({ modelGender: 'male' });
assert.ok(male.includes('young Vietnamese man') && !/woman/i.test(male), 'male: man, never woman');
const female = text({ modelGender: 'female' });
assert.ok(female.includes('young Vietnamese woman') && !/\bman\b/i.test(female), 'female: woman, never man');
assert.ok(!/young Vietnamese (man|woman)/.test(text({ mode: 'personal', modelGender: 'male' })), 'personal ignores modelGender');
assert.ok(text({ eventId: 'vieng_tang' }).includes('without a smile'), 'vieng_tang: no smile');
assert.ok(!text({ eventId: 'dao_pho' }).includes('without a smile'), 'dao_pho keeps its smile');
const detail = buildLookbookPrompt(base({ angle: 'detail', has: { garmentRef: true, background: false, hero: false } }));
const detailRest = detail.text.replace(detail.garmentBlock, '');
assert.ok(!/button|macro/i.test(detailRest), 'detail angle: no "button" or "macro" outside the garment block');
assert.ok(detail.text.includes(style.angles.find(a => a.id === 'detail')!.prompt), 'detail angle prompt used');

// ---- 6. Catalog: 10 garments and 10 accessories, unknown ids throw ----
assert.equal(content.garments.length, 10);
assert.equal(content.accessories.length, 10);
for (const accessory of content.accessories) {
  const out = text({ accessoryIds: [accessory.id] });
  assert.ok(out.includes(style.accessories[accessory.id]), `accessory ${accessory.id}: promptEn missing`);
}
const has = { garmentRef: true, background: false, hero: false };
assert.throws(() => buildLookbookPrompt(base({ garmentId: 'khong-co', has })), /unknown garment/);
assert.throws(() => buildLookbookPrompt(base({ accessoryIds: ['khong-co'], has })), /unknown garment or accessory/);
assert.throws(() => buildLookbookPrompt(base({ moodId: 'x' as never, has })), /unknown mood/);
assert.throws(() => buildLookbookPrompt(base({ eventId: 'x' as never, has })), /unknown event/);
assert.throws(() => buildLookbookPrompt(base({ angle: 'x' as never, has })), /unknown angle/);
assert.throws(() => buildLookbookPrompt(base({ moodId: 'custom', has })), /background/);
assert.throws(() => buildLookbookPrompt(base({ colorPalette: PALETTE.slice(0, 3), has })), /4 colors/);

// ---- 7. nearestColorName: every palette color has an exact name ----
// Mirror of the palettes in src/game/Studio.tsx lines 16-23; update both together.
const studioPalettes = [
  ['#C4A482', '#6B4423', '#50321A', '#2C1608'], ['#637687', '#2D3E50', '#1E2A38', '#101720'], ['#E7A08E', '#B83A24', '#8B261E', '#3A1916'],
  ['#F3DF9F', '#CFA449', '#907030', '#382B02'], ['#B1D0BE', '#2D6A5D', '#204D44', '#102923'], ['#FFFFFF', '#F5EFEB', '#D6CCC2', '#8D8175']
];
const palettes = [...content.garments.map(g => g.defaultColorPalette), ...studioPalettes];
assert.equal(palettes.length, 16);
for (const value of palettes.flat()) {
  const entry = style.colorNames.find(c => c.hex === value.toLowerCase());
  assert.ok(entry, `${value}: no exact name in colorNames`);
  assert.equal(nearestColorName(value), `${entry.en} (${value.toLowerCase()})`, `${value}: name`);
}
assert.ok(nearestColorName('#b83a25').startsWith('vermilion red ('), '#b83a25 snaps to vermilion red');
assert.equal(styleNearest(style, '#b83a25').hex, '#b83a24');

console.log('check-lookbook-prompt: OK');
