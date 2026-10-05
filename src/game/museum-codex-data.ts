import type { GameState } from '../core';
import type { GameContent } from '../content';
import { COMBINATION_RECIPES } from '../core/commands/journey/item-commands';
import { portraitFor, type Portrait } from './npc-portraits';

// Pure derivations for the museum codex: nothing here is stored in the save.

/** Speakers that never get a codex entry: the player, or a recording that only repeats a character. */
const EXCLUDED_SPEAKERS = new Set(['An']);
/** Different speaker labels for the same person share one entry (same sprite id in npc-portraits). */
const SPEAKER_ALIASES: Record<string, string> = {
  'Mẹ Phương': 'Cô Phương',
  'Băng ghi âm Bà Mai': 'Bà Mai',
};
/** Items consumed by item/combine, keyed by what they make. */
const COMBINED_FROM: Record<string, string[]> = Object.fromEntries(
  Object.entries(COMBINATION_RECIPES).map(([inputs, output]) => [output, inputs.split('+')]));

export interface CodexCharacter {
  name: string;
  chapterId: string;
  chapterTitle: string;
  met: boolean;
  portrait: Portrait;
}

export interface CodexItem {
  id: string;
  name: string;
  description: string;
  found: boolean;
}

export const canonicalSpeaker = (speaker: string) => SPEAKER_ALIASES[speaker] ?? speaker;

/** Every non-player speaker in content (chapter order, first appearance), flagged met by completed dialogues. */
export function metSpeakers(state: GameState, content: GameContent): CodexCharacter[] {
  const roster = new Map<string, CodexCharacter>();
  for (const chapterId of content.chapterOrder) {
    const chapter = content.chapters[chapterId];
    const done = new Set(state.journey[chapterId as keyof GameState['journey']]?.completedDialogueIds ?? []);
    for (const dialogue of chapter.dialogues) {
      if (EXCLUDED_SPEAKERS.has(dialogue.speaker)) continue;
      const name = canonicalSpeaker(dialogue.speaker);
      const entry = roster.get(name) ?? { name, chapterId, chapterTitle: chapter.chapter.title, met: false, portrait: portraitFor(name) };
      if (done.has(dialogue.id)) entry.met = true;
      roster.set(name, entry);
    }
  }
  return [...roster.values()];
}

/**
 * All catalog items; found = in the bag now, or obtained earlier and spent. Spent items are recovered from the
 * solved puzzles that took, presented or granted them (content validation guarantees every required item is
 * obtained before its puzzle), from claimed chapter rewards, and from combine recipes.
 */
export function foundItems(state: GameState, content: GameContent): CodexItem[] {
  const found = new Set(state.inventory.itemIds);
  for (const chapterId of content.chapterOrder) {
    const chapter = content.chapters[chapterId];
    const progress = state.journey[chapterId as keyof GameState['journey']];
    if (!progress) continue;
    if (progress.claimed) for (const id of chapter.chapter.reward.itemIds ?? []) found.add(id);
    for (const puzzle of chapter.puzzles) {
      if (!progress.solvedPuzzleIds.includes(puzzle.id)) continue;
      const s = puzzle.solution as {
        requiredItemId?: string; requiredItemIds?: string[]; rewardItemId?: string; rewardItemIds?: string[]; presentedItemId?: string;
      };
      for (const id of [s.requiredItemId, s.presentedItemId, s.rewardItemId, ...(s.requiredItemIds ?? []), ...(s.rewardItemIds ?? [])]) {
        if (id) found.add(id);
      }
    }
  }
  for (const [output, parts] of Object.entries(COMBINED_FROM)) if (found.has(output)) for (const id of parts) found.add(id);
  return content.items.map(item => ({ id: item.id, name: item.name, description: item.description, found: found.has(item.id) }));
}
