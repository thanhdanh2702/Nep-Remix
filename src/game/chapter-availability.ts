import type { ChapterId } from '../content/schema';
import type { GameState } from '../core';
import { OPEN_CHAPTER_IDS } from '../core/chapter-access';
export function isChapterPlayable(id: ChapterId, _state: GameState): boolean {
  return OPEN_CHAPTER_IDS.includes(id);
}
