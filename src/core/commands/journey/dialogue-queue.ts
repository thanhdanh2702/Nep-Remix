import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';

export function enqueueDialogues(state: GameState, ids: Array<string | undefined>, content: GameContent): GameState {
  const chapterId = state.currentChapter;
  const progress = state.journey[chapterId];
  const queue = [...(progress.dialogueQueue ?? [])];
  let active = progress.activeDialogue;
  for (const id of ids) {
    const dialogue = content.chapters[chapterId].dialogues.find(d => d.id === id);
    if (!dialogue || progress.completedDialogueIds.includes(dialogue.id) || active?.dialogueId === id || queue.includes(dialogue.id)) continue;
    if (!active) {
      const first = dialogue.nodes[0];
      active = { dialogueId: dialogue.id, currentNodeId: first.id, history: [first.id] };
    } else queue.push(dialogue.id);
  }
  return { ...state, journey: { ...state.journey, [chapterId]: { ...progress, activeDialogue: active, dialogueQueue: queue } } };
}
