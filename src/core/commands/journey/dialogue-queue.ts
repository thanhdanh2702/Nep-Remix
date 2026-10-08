import { reconcileC3Progress } from './c3-progress.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';

export function enqueueDialogues(state: GameState, ids: Array<string | undefined>, content: GameContent, source: 'trigger' | 'interaction' = 'trigger'): GameState {
  const chapterId = state.currentChapter;
  const progress = state.journey[chapterId];
  const queue = [...(progress.dialogueQueue ?? [])];
  let active = progress.activeDialogue;
  for (const id of ids) {
    const dialogue = content.chapters[chapterId].dialogues.find(d => d.id === id);
    if (!dialogue || active?.dialogueId === id || queue.includes(dialogue.id)) continue;
    const completed = progress.completedDialogueIds.includes(dialogue.id);
    if (completed && (source === 'trigger' || active)) continue;
    if (!active) {
      const first = dialogue.nodes[0];
      active = { dialogueId: dialogue.id, currentNodeId: first.id, history: [first.id],
        ...(completed ? { mode: 'reread' as const } : {}) };
    } else queue.push(dialogue.id);
  }
  const next = { ...state, journey: { ...state.journey, [chapterId]: { ...progress, activeDialogue: active, dialogueQueue: queue } } };
  return chapterId === 'c3' ? reconcileC3Progress(next, content) : next;
}
