// Pure prompt builder: every word comes from lookbook-style.json, picked by catalog id. No client text, no I/O.
import { loadContent } from '../../content/index.ts';
import { describeColor, loadLookbookStyle } from '../../content/lookbook-style.ts';
import type { LookbookAngleId, LookbookEventId, LookbookMode, LookbookMoodId } from './lookbook-contract.ts';

export type LookbookImageRole = 'person' | 'garment' | 'background' | 'hero';

export interface LookbookPromptInput {
  mode: LookbookMode;
  modelGender: 'female' | 'male';
  garmentId: string;
  colorPalette: readonly string[];
  accessoryIds: readonly string[];
  eventId: LookbookEventId;
  moodId: LookbookMoodId;
  angle: LookbookAngleId;
  has: { garmentRef: boolean; background: boolean; hero: boolean };
}

export interface LookbookPrompt {
  text: string;
  /** The outfit lock: identical for every angle and with or without a hero anchor. */
  garmentBlock: string;
  /** Order in which the images must be attached to the model call (1-based numbering in the text). */
  imageOrder: LookbookImageRole[];
}

/** "vermilion red (#b83a24)": nearest named color from the catalog. */
export function nearestColorName(hex: string): string {
  return describeColor(loadLookbookStyle(), hex);
}

/** True when every id exists in the garment/accessory catalog and the style blocks. */
export function hasCatalogIds(garmentId: string, accessoryIds: readonly string[]): boolean {
  const style = loadLookbookStyle();
  const content = loadContent();
  return content.garmentsById.has(garmentId) && garmentId in style.garments
    && accessoryIds.every(id => content.accessories.some(a => a.id === id) && id in style.accessories);
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key] : whole));
}

function pick<T extends { id: string }>(list: T[], id: string, label: string): T {
  const found = list.find(item => item.id === id);
  if (!found) throw new Error(`lookbook prompt: unknown ${label}`);
  return found;
}

export function buildLookbookPrompt(input: LookbookPromptInput): LookbookPrompt {
  const style = loadLookbookStyle();
  const { blocks } = style;
  if (!hasCatalogIds(input.garmentId, input.accessoryIds)) throw new Error('lookbook prompt: unknown garment or accessory');
  if (input.colorPalette.length !== 4) throw new Error('lookbook prompt: colorPalette needs 4 colors');
  const mood = pick(style.moods, input.moodId, 'mood');
  const event = pick(style.events, input.eventId, 'event');
  const angle = pick(style.angles, input.angle, 'angle');
  if (mood.id === 'custom' && !input.has.background) throw new Error('lookbook prompt: custom mood needs a background image');

  const imageOrder: LookbookImageRole[] = [];
  if (input.mode === 'personal') imageOrder.push('person');
  if (input.has.garmentRef) imageOrder.push('garment');
  if (mood.id === 'custom') imageOrder.push('background');
  if (input.has.hero) imageOrder.push('hero');
  const numbers: Record<string, string> = {};
  imageOrder.forEach((role, index) => { numbers[role] = String(index + 1); });

  const accessories = input.accessoryIds.length
    ? `${blocks.accessoriesLead}${input.accessoryIds.map(id => style.accessories[id]).join(' ')} `
    : '';
  const garmentBlock = fill(input.has.garmentRef ? blocks.garmentWithReference : blocks.garmentTextOnly, {
    ...numbers,
    garmentPrompt: style.garments[input.garmentId],
    mainColor: describeColor(style, input.colorPalette[1]),
    accentColor: describeColor(style, input.colorPalette[3]),
    accessories
  });

  const identity = input.mode === 'personal' ? blocks.identityPersonal : blocks.identityFictional[input.modelGender];
  const text = [
    fill(identity, numbers),
    input.has.hero ? fill(blocks.heroAnchor, numbers) : '',
    garmentBlock,
    fill(blocks.moodLead + mood.prompt, numbers),
    event.prompt,
    angle.prompt,
    blocks.style,
    blocks.output
  ].filter(Boolean).join('\n\n');

  if (/[{}]/.test(text)) throw new Error('lookbook prompt: unresolved placeholder');
  return { text, garmentBlock, imageOrder };
}
