import type { GameContent } from '../../content/index.ts';
import type { ChapterId } from '../../content/schema.ts';
import { createInitialState } from '../state.ts';
import { createInitialTree, type HistoryTree } from './history-tree.ts';

/** Isolated practice tree. Never replace/autosave the main tree with this tree. */
export function createChapterReplayTree(main: HistoryTree, chapterId: ChapterId, content: GameContent):
  { ok: true; tree: HistoryTree } | { ok: false; reason: string } {
  const original = main.nodes[main.headId]?.snapshot;
  if (!original || original.journey[chapterId]?.status !== 'completed') return { ok: false, reason: 'Complete the chapter before replaying.' };
  const state = createInitialState(content);
  state.currentChapter = chapterId;
  state.journey[chapterId].status = 'in_progress';
  // Replay can practice the story but has no claimable reward.
  state.claimedRewardIds = [content.chapters[chapterId].chapter.reward.id];
  return { ok: true, tree: { ...createInitialTree(state), replayOfChapter: chapterId } };
}
