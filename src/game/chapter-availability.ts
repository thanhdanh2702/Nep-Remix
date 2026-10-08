import type { ChapterId } from '../content/schema';
import type { GameState } from '../core';
const PLAYABLE: ChapterId[] = ['prologue', 'c1', 'c2', 'c3'];
export function isChapterPlayable(id: ChapterId, state: GameState): boolean {
  return PLAYABLE.includes(id) && (id !== 'c3' || state.journey.c2.status === 'completed');
}
