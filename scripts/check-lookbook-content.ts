// Guards the Lookbook prompt catalog (src/content/lookbook-style.json). Run: npx tsx scripts/check-lookbook-content.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadContent } from '../src/content/index.ts';
import { loadLookbookStyle, validateLookbookStyle, nearestColorName, describeColor, LookbookStyleSchema, type LookbookStyle } from '../src/content/lookbook-style.ts';

const content = loadContent();
const style = loadLookbookStyle();
const fail = (messages: string[]): never => { console.error(messages.join('\n')); process.exit(1); };
const problems: string[] = [];

// 1. The real catalog is healthy.
problems.push(...validateLookbookStyle(style, content));

// 2. Common blocks: no words that describe a Chinese garment, and no detail that belongs in a garment's promptEn.
const commonText: [string, string][] = [
  ...Object.entries(style.blocks).flatMap(([key, value]): [string, string][] =>
    typeof value === 'string' ? [[`blocks.${key}`, value]] : Object.entries(value).map(([sub, text]): [string, string] => [`blocks.${key}.${sub}`, text])),
  ...style.moods.map((m): [string, string] => [`moods.${m.id}`, m.prompt]),
  ...style.events.map((e): [string, string] => [`events.${e.id}`, e.prompt]),
  ...style.angles.map((a): [string, string] => [`angles.${a.id}`, a.prompt])
];
const FORBIDDEN = [/mandarin/i, /loose silk trousers/i, /qipao|cheongsam|chinese/i];
for (const [label, text] of commonText) for (const re of FORBIDDEN) if (re.test(text)) problems.push(`${label}: forbidden phrase ${re}`);
// A front-facing smile is decided by the event (mourning has none), never by the angle.
for (const angle of style.angles) if (/smile/i.test(angle.prompt)) problems.push(`angles.${angle.id}: expression belongs to the event block`);
for (const key of ['identityPersonal', 'garmentWithReference', 'garmentTextOnly', 'heroAnchor'] as const) {
  if (!style.blocks[key].includes('{')) problems.push(`blocks.${key}: lost its placeholders`);
}
for (const placeholder of ['{garmentPrompt}', '{mainColor}', '{accentColor}', '{accessories}']) {
  for (const key of ['garmentWithReference', 'garmentTextOnly'] as const) {
    if (!style.blocks[key].includes(placeholder)) problems.push(`blocks.${key}: missing ${placeholder}`);
  }
}
if (!style.moods.find(m => m.id === 'custom')?.prompt.includes('{background}')) problems.push('moods.custom: missing {background}');

// 3. Buttoned garments state Vietnamese side fastening; the four-panel dress ties at the waist instead.
for (const [id, text] of Object.entries(style.garments)) {
  if (id === 'ao-tu-than') { if (!/knotted|tied/.test(text)) problems.push(`garments.${id}: must say the front is tied`); }
  else if (!text.includes('Vietnamese side fastening')) problems.push(`garments.${id}: missing "Vietnamese side fastening"`);
  if (!/trousers|skirt/.test(text)) problems.push(`garments.${id}: must say what is worn below`);
}

// 4. Every color that can reach a prompt has a name: garment palettes (checked in validate) and the Workshop palettes.
// Copy of the palettes in src/game/Studio.tsx; update both together.
const studioPalettes = [
  ['#C4A482', '#6B4423', '#50321A', '#2C1608'], ['#637687', '#2D3E50', '#1E2A38', '#101720'], ['#E7A08E', '#B83A24', '#8B261E', '#3A1916'],
  ['#F3DF9F', '#CFA449', '#907030', '#382B02'], ['#B1D0BE', '#2D6A5D', '#204D44', '#102923'], ['#FFFFFF', '#F5EFEB', '#D6CCC2', '#8D8175']
];
for (const value of [...studioPalettes.flat(), ...content.garments.flatMap(g => g.defaultColorPalette)]) {
  if (nearestColorName(style, value).distance !== 0) problems.push(`colorNames: ${value} has no exact name`);
}
assert.equal(describeColor(style, '#B83A24'), 'vermilion red (#b83a24)');
assert.equal(nearestColorName(style, '#b83a25').hex, '#b83a24');

// 5. The reference-photo prompts in the doc repeat each promptEn verbatim; keep them in sync.
const doc = readFileSync('docs/06-design/ai-studio/lookbook-garment-reference-prompts.md', 'utf8');
for (const [id, text] of Object.entries(style.garments)) if (!doc.includes(text)) problems.push(`reference prompts doc: out of sync with garments.${id}`);

if (problems.length) fail(problems);

// 6. Each kind of damage is reported (and only once).
const clone = (): LookbookStyle => structuredClone(style);
const expectErrors = (label: string, broken: LookbookStyle, count: number, snippet: string, withContent = content): void => {
  const errors = validateLookbookStyle(broken, withContent);
  assert.equal(errors.length, count, `${label}: ${errors.join(' | ')}`);
  assert.ok(errors.some(e => e.includes(snippet)), `${label}: ${errors.join(' | ')}`);
};
const missingGarment = clone();
delete missingGarment.garments['ao-dai-popolin'];
expectErrors('missing garment', missingGarment, 1, 'missing ao-dai-popolin');
const extraAccessory = clone();
extraAccessory.accessories['khong-co'] = extraAccessory.accessories['non-la'];
expectErrors('extra accessory', extraAccessory, 1, 'unknown khong-co');
const missingEvent = clone();
missingEvent.events = missingEvent.events.filter(e => e.id !== 'tet');
expectErrors('missing event', missingEvent, 1, 'missing tet');
const braces = clone();
braces.garments['ao-dai-lemur'] = `${braces.garments['ao-dai-lemur']} {oops}.`;
expectErrors('brace', braces, 1, 'contains a brace');
const duplicateMood = clone();
duplicateMood.moods.push(duplicateMood.moods[0]);
expectErrors('duplicate mood', duplicateMood, 1, 'duplicate pho-co');
const shortHex = clone();
shortHex.colorNames.push({ hex: '#FFF', en: 'white' });
expectErrors('short hex', shortHex, 1, 'bad hex #FFF');
const duplicateHex = clone();
duplicateHex.colorNames.push({ ...duplicateHex.colorNames[0] });
expectErrors('duplicate hex', duplicateHex, 1, 'duplicate');
const colored = clone();
colored.garments['ao-dai-raglan'] = colored.garments['ao-dai-raglan'].replace('A 1960s', 'A red 1960s');
expectErrors('color word', colored, 1, 'names a color');
const farPalette = { ...content, garments: content.garments.map((g, i) => i === 0 ? { ...g, defaultColorPalette: ['#7f00ff', ...g.defaultColorPalette.slice(1)] as typeof g.defaultColorPalette } : g) };
expectErrors('palette too far', clone(), 1, 'away from', farPalette);
assert.ok(!LookbookStyleSchema.safeParse({ ...clone(), moods: [{ id: 'nope', labelVi: 'x', prompt: 'y' }] }).success);

console.log('check-lookbook-content: OK');
