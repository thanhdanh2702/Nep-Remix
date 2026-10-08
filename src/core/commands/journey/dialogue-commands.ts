import { canReadC3Dialogue } from './c3-progress.ts';
import type { CommandDef, DomainEvent } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { enqueueDialogues } from './dialogue-queue.ts';

// Retained for source compatibility; tokens never grant authorization.
export const DIALOGUE_ADVANCE_TOKEN = 'INTERNAL_DIALOGUE_ADVANCE_TOKEN';
export interface ClueCollectPayload { clueId: string; internalToken?: string; fromDialogueNodeId?: string }
export const clueCollectCommand: CommandDef<ClueCollectPayload> = {
  type: 'clue/collect', kind: 'reversible',
  guard: () => ({ ok: false, reason: 'Acknowledge the dialogue node to collect its clue.' }),
  apply: state => ({ state }), invert: (_state, payload) => ({ type: 'clue/remove', payload: { clueId: payload.clueId } })
};

function current(state: GameState, content: GameContent) {
  const active = state.journey[state.currentChapter]?.activeDialogue;
  const dialogue = content.chapters[state.currentChapter]?.dialogues.find(d => d.id === active?.dialogueId);
  const node = dialogue?.nodes.find(n => n.id === active?.currentNodeId);
  return { active, dialogue, node };
}
function acknowledge(state: GameState, content: GameContent, nextId?: string) {
  const chapterId = state.currentChapter;
  const progress = state.journey[chapterId];
  const { active, dialogue, node } = current(state, content);
  const events: DomainEvent[] = [];
  let notebook = state.notebook;
  if (active!.mode !== 'reread' && node!.clueId && !notebook.unlockedClueIds.includes(node!.clueId)) {
    notebook = { ...notebook, unlockedClueIds: [...notebook.unlockedClueIds, node!.clueId] };
    events.push({ type: 'clueCollected', payload: { clueId: node!.clueId } });
  }
  const next = dialogue!.nodes.find(n => n.id === nextId);
  const nextProgress = {
    ...progress,
    completedDialogueIds: next || active!.mode === 'reread' ? progress.completedDialogueIds : [...new Set([...progress.completedDialogueIds, dialogue!.id])],
    activeDialogue: next ? { ...active!, currentNodeId: next.id, history: [...active!.history, next.id] } : null
  };
  let result = { ...state, notebook, journey: { ...state.journey, [chapterId]: nextProgress } };
  if (!next) {
    const queue = progress.dialogueQueue ?? [];
    result.journey[chapterId].dialogueQueue = [];
    result = enqueueDialogues(result, queue, content);
  }
  return { state: result, events };
}
export interface DialogueAdvancePayload {}
export const dialogueAdvanceCommand: CommandDef<DialogueAdvancePayload> = {
  type: 'dialogue/advance', kind: 'reversible',
  guard: (state, _payload, content) => {
    const { node, dialogue } = current(state, content);
    if (state.currentChapter === 'c3' && (!dialogue || !canReadC3Dialogue(state, dialogue.id, content))) return { ok: false, reason: 'C3 dialogue prerequisites are not completed.' };
    if (!node) return { ok: false, reason: 'No valid active dialogue node.' };
    if (node.choices?.length) return { ok: false, reason: 'Use dialogue/choose for this node.' };
    if (node.nextNodeId && !dialogue!.nodes.some(n => n.id === node.nextNodeId)) return { ok: false, reason: 'Dialogue link is invalid.' };
    return true;
  },
  apply: (state, _payload, content) => acknowledge(state, content, current(state, content).node!.nextNodeId),
  invert: state => ({ type: 'dialogue/restore', payload: { previousState: state } })
};
export interface DialogueChoosePayload { choiceIndex: number }
export const dialogueChooseCommand: CommandDef<DialogueChoosePayload> = {
  type: 'dialogue/choose', kind: 'reversible',
  guard: (state, payload, content) => {
    const { node, dialogue } = current(state, content);
    if (state.currentChapter === 'c3' && (!dialogue || !canReadC3Dialogue(state, dialogue.id, content))) return { ok: false, reason: 'C3 dialogue prerequisites are not completed.' };
    if (!Number.isInteger(payload.choiceIndex) || !node?.choices || payload.choiceIndex < 0 || payload.choiceIndex >= node.choices.length) return { ok: false, reason: 'Invalid dialogue choice.' };
    const nextId = node.choices[payload.choiceIndex].nextNodeId;
    if (nextId && !dialogue!.nodes.some(n => n.id === nextId)) return { ok: false, reason: 'Dialogue link is invalid.' };
    return true;
  },
  apply: (state, payload, content) => acknowledge(state, content, current(state, content).node!.choices![payload.choiceIndex].nextNodeId),
  invert: state => ({ type: 'dialogue/restore', payload: { previousState: state } })
};
