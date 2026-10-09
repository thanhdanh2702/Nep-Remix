// Lookbook prompt catalog: every English word that goes into a Lookbook photo prompt lives in lookbook-style.json.
// Pure (no node APIs) so the server and the browser can both import it. Check: npx tsx scripts/check-lookbook-content.ts
import { z } from 'zod';
import styleJson from './lookbook-style.json';
import studioJson from './studio.json';
import type { GameContent } from './index.ts';

const hex = z.string().regex(/^#[0-9a-f]{6}$/);
const promptEn = z.string().min(40).max(600);

export const LookbookStyleSchema = z.object({
  version: z.number().int(),
  blocks: z.object({
    identityPersonal: z.string().min(1),
    identityFictional: z.object({ female: z.string().min(1), male: z.string().min(1) }),
    heroAnchor: z.string().min(1),
    garmentWithReference: z.string().min(1),
    garmentTextOnly: z.string().min(1),
    accessoriesLead: z.string().min(1),
    moodLead: z.string().min(1),
    style: z.string().min(1),
    output: z.string().min(1)
  }),
  moods: z.array(z.object({ id: z.enum(['pho-co', 'vuon-hoa', 'tuong-voi', 'san-nha', 'custom']), labelVi: z.string().min(1), prompt: z.string().min(1) })),
  events: z.array(z.object({ id: z.enum(['tet', 'dam_cuoi', 'be_giang', 'le_chua', 'vieng_tang', 'dao_pho']), prompt: z.string().min(1) })),
  angles: z.array(z.object({ id: z.enum(['front', 'turn', 'back', 'detail']), labelVi: z.string().min(1), prompt: z.string().min(1) })),
  garments: z.record(z.string(), promptEn),
  accessories: z.record(z.string(), promptEn),
  colorNames: z.array(z.object({ hex, en: z.string().min(1) }))
});
export type LookbookStyle = z.infer<typeof LookbookStyleSchema>;

let cachedStyle: LookbookStyle | null = null;

export function loadLookbookStyle(): LookbookStyle {
  if (!cachedStyle) cachedStyle = LookbookStyleSchema.parse(styleJson);
  return cachedStyle;
}

const COLOR_NAME_MAX_DISTANCE = 48;
// Garment text never names a color: the color comes from the palette so the same prompt serves every recolor.
const COLOR_WORDS = /\b(red|blue|green|yellow|white|black|pink|purple|gold|golden|brown|gr[ae]y|indigo|orange|ivory|cream|beige)\b/i;
const NON_VIETNAMESE_TERMS = /\b(mandarin|qipao|cheongsam|chinese)\b/i;

function rgb(value: string): [number, number, number] {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Closest named color to `value` (any case, `#rrggbb`) and its RGB Euclidean distance. */
export function nearestColorName(style: LookbookStyle, value: string): { hex: string; en: string; distance: number } {
  const [r, g, b] = rgb(value.toLowerCase());
  let best = { hex: style.colorNames[0].hex, en: style.colorNames[0].en, distance: Infinity };
  for (const entry of style.colorNames) {
    const [er, eg, eb] = rgb(entry.hex);
    const distance = Math.hypot(r - er, g - eg, b - eb);
    if (distance < best.distance) best = { hex: entry.hex, en: entry.en, distance };
  }
  return best;
}

/** "vermilion red (#b83a24)": the exact text used for {mainColor} and {accentColor}. */
export function describeColor(style: LookbookStyle, value: string): string {
  return `${nearestColorName(style, value).en} (${value.toLowerCase()})`;
}

function compareIds(label: string, have: string[], want: string[], errors: string[]): void {
  for (const id of want) if (!have.includes(id)) errors.push(`${label}: missing ${id}`);
  for (const id of have) if (!want.includes(id)) errors.push(`${label}: unknown ${id}`);
}

function findDuplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}

/** Returns every problem found (empty array = healthy). `content` supplies the garment and accessory catalog. */
export function validateLookbookStyle(style: LookbookStyle, content: Pick<GameContent, 'garments' | 'accessories'>): string[] {
  const errors: string[] = [];
  compareIds('garments', Object.keys(style.garments), content.garments.map(g => g.id), errors);
  compareIds('accessories', Object.keys(style.accessories), content.accessories.map(a => a.id), errors);
  compareIds('events', style.events.map(e => e.id), (studioJson.events as { id: string }[]).map(e => e.id), errors);
  for (const id of findDuplicates(style.moods.map(m => m.id))) errors.push(`moods: duplicate ${id}`);
  for (const id of findDuplicates(style.angles.map(a => a.id))) errors.push(`angles: duplicate ${id}`);
  for (const id of findDuplicates(style.events.map(e => e.id))) errors.push(`events: duplicate ${id}`);
  const hexes = style.colorNames.map(c => c.hex);
  for (const value of hexes) if (!/^#[0-9a-f]{6}$/.test(value)) errors.push(`colorNames: bad hex ${value}`);
  for (const value of findDuplicates(hexes)) errors.push(`colorNames: duplicate ${value}`);
  const texts: [string, string][] = [
    ...Object.entries(style.garments).map(([id, text]): [string, string] => [`garments.${id}`, text]),
    ...Object.entries(style.accessories).map(([id, text]): [string, string] => [`accessories.${id}`, text])
  ];
  for (const [label, text] of texts) {
    if (/[{}]/.test(text)) errors.push(`${label}: contains a brace`);
    if (!text.endsWith('.')) errors.push(`${label}: must end with a period`);
    if (NON_VIETNAMESE_TERMS.test(text)) errors.push(`${label}: names a non-Vietnamese garment`);
  }
  for (const [id, text] of Object.entries(style.garments)) {
    if (COLOR_WORDS.test(text)) errors.push(`garments.${id}: names a color`);
  }
  if (hexes.every(v => /^#[0-9a-f]{6}$/.test(v))) {
    for (const garment of content.garments) {
      for (const value of garment.defaultColorPalette) {
        const near = nearestColorName(style, value);
        if (near.distance > COLOR_NAME_MAX_DISTANCE) errors.push(`garments.${garment.id}: ${value} is ${Math.round(near.distance)} away from ${near.hex}`);
      }
    }
  }
  return errors;
}
