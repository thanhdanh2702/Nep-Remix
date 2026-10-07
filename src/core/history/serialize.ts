import type { HistoryTree } from './history-tree.ts';
import type { GameContent } from '../../content/index.ts';
import type { GameState } from '../state.ts';
import { validateState } from '../invariants.ts';
import { grantRewardGifts } from '../commands/journey/reward-commands.ts';
import { enqueueDialogues } from '../commands/journey/dialogue-queue.ts';

export const CONTENT_VERSION = 'sprint-02-core-1';
export interface SerializedHistoryEnvelope {
  saveFormatVersion: 'tiem-may-nep-save-v1';
  schemaVersion: string;
  contentVersion?: string;
  serializedAt: string;
  tree: HistoryTree;
}
export type FromJSONResult = { ok: true; tree: HistoryTree; migrated?: boolean } | { ok: false; reason: string };
export function toJSON(tree: HistoryTree): string {
  const envelope: SerializedHistoryEnvelope = {
    saveFormatVersion: 'tiem-may-nep-save-v1', schemaVersion: tree.version,
    contentVersion: CONTENT_VERSION, serializedAt: new Date(0).toISOString(), tree
  };
  return JSON.stringify(envelope);
}
function migrateSnapshot(original: GameState, content: GameContent, legacyC2: boolean): GameState {
  let state = structuredClone(original);
  state.claimedRewardIds ??= [];
  state.museum.unlockedCardIds ??= [];
  for (const [id, progress] of Object.entries(state.journey)) {
    const chapter = content.chapters[id];
    if (!chapter) throw new Error(`Unknown chapter ${id}`);
    // Reconstruct unread triggered dialogues from old snapshots, without completing them.
    if (!progress.dialogueQueue && !(id === 'c2' && legacyC2)) {
      const triggers = chapter.puzzles.filter(p => progress.solvedPuzzleIds.includes(p.id)).flatMap(p => {
        const sol = p.solution as { dialogueTriggerId?: string; dialogueTriggerIds?: string[] };
        return [sol.dialogueTriggerId, ...(sol.dialogueTriggerIds ?? [])].filter((value): value is string => !!value);
      });
      progress.dialogueQueue = [...new Set(triggers)].filter(d => d !== progress.activeDialogue?.dialogueId && !progress.completedDialogueIds.includes(d));
      if (!progress.activeDialogue && progress.dialogueQueue.length) {
        const dialogueId = progress.dialogueQueue.shift()!;
        const nodeId = chapter.dialogues.find(d => d.id === dialogueId)!.nodes[0].id;
        progress.activeDialogue = { dialogueId, currentNodeId: nodeId, history: [nodeId] };
      }
    }
    progress.puzzleDrafts ??= {};
    if (id === 'c2' && legacyC2) {
      // C2 no longer has a reverse fabric face. Preserve the room/progress;
      // normalize a legacy left-side snapshot to the supported art face.
      progress.side = 'mat_phai';
      for (const [puzzleId, draft] of Object.entries(progress.puzzleDrafts)) {
        const puzzle = chapter.puzzles.find(p => p.id === puzzleId);
        if (puzzle?.type !== 'order') continue;
        const ids = draft.type === 'order' ? draft.answer : null;
        if (!ids || !Array.isArray(ids) || new Set(ids).size !== ids.length
          || ids.some(piece => !puzzle.solution.requiredItemIds?.some(id => id === piece) || !state.inventory.itemIds.includes(piece))) {
          delete progress.puzzleDrafts[puzzleId];
          if (state.activeSession?.type === 'puzzle' && state.activeSession.puzzleId === puzzleId) {
            state.activeSession = { ...state.activeSession, valid: false, data: {} };
          }
        }
      }
      // Old engines could record a solve without delivering plural gifts.
      // Repair earned evidence only; never currency, loans, reads or solves.
      for (const puzzle of chapter.puzzles.filter(p => progress.solvedPuzzleIds.includes(p.id))) {
        const solution = puzzle.solution as { rewardItemId?: string; rewardItemIds?: string[] };
        state.inventory.itemIds = [...new Set([...state.inventory.itemIds,
          ...[solution.rewardItemId, ...(solution.rewardItemIds ?? [])].filter((id): id is string => !!id)])];
      }
      if (progress.status !== 'locked') {
        const recovery = [chapter.chapter.entryDialogueId, ...chapter.puzzles
          .filter(p => progress.solvedPuzzleIds.includes(p.id)).flatMap(p => {
            const solution = p.solution as { dialogueTriggerId?: string; dialogueTriggerIds?: string[] };
            return [solution.dialogueTriggerId, ...(solution.dialogueTriggerIds ?? [])];
          })];
        const queued = enqueueDialogues({ ...state, currentChapter: chapter.chapter.id }, recovery, content);
        progress.activeDialogue = queued.journey.c2.activeDialogue;
        progress.dialogueQueue = queued.journey.c2.dialogueQueue;
      }
    }
    if (progress.activeDialogue) {
      const dialogue = chapter.dialogues.find(d => d.id === progress.activeDialogue!.dialogueId);
      if (!dialogue) throw new Error('Saved dialogue does not exist');
      if (!dialogue.nodes.some(n => n.id === progress.activeDialogue!.currentNodeId)) {
        const first = dialogue.nodes[0].id;
        progress.activeDialogue = { ...progress.activeDialogue, dialogueId: dialogue.id, currentNodeId: first, history: [first] };
      }
    }
    if (progress.claimed) {
      state = grantRewardGifts(state, chapter.chapter.reward);
      state.claimedRewardIds = [...new Set([...state.claimedRewardIds!, chapter.chapter.reward.id])];
    }
  }
  return state;
}
export function fromJSON(jsonStr: string, content: GameContent): FromJSONResult {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') throw new Error('Save must be an object');
    if (parsed.saveFormatVersion && parsed.saveFormatVersion !== 'tiem-may-nep-save-v1') throw new Error('Unsupported save version');
    if (parsed.contentVersion && ![CONTENT_VERSION, 'sprint-01-core-1'].includes(parsed.contentVersion)) throw new Error('Unsupported content version');
    const candidate = parsed.tree ?? parsed;
    if (candidate.version !== '1.0.0') throw new Error('Unsupported schema version');
    if (!candidate.nodes || !candidate.nodes[candidate.rootId] || !candidate.nodes[candidate.headId]) throw new Error('Missing root/head snapshot');
    const tree: HistoryTree = structuredClone(candidate);
    const legacyC2 = parsed.contentVersion !== CONTENT_VERSION;
    let migrated = legacyC2;
    for (const [id, node] of Object.entries(tree.nodes)) {
      if (node.id !== id || !Array.isArray(node.childIds) || !node.snapshot
        || (node.parentId !== null && !tree.nodes[node.parentId])
        || node.childIds.some(child => !tree.nodes[child] || tree.nodes[child].parentId !== id)) throw new Error('Invalid history links');
      const seen = new Set<string>();
      let cursor: string | null = id;
      while (cursor !== null) {
        if (seen.has(cursor) || !tree.nodes[cursor]) throw new Error('Cyclic history');
        seen.add(cursor); cursor = tree.nodes[cursor].parentId;
      }
      const snapshot = migrateSnapshot(node.snapshot, content, legacyC2);
      migrated ||= JSON.stringify(snapshot) !== JSON.stringify(node.snapshot);
      node.snapshot = snapshot;
      const validation = validateState(snapshot, content);
      if (!validation.valid) throw new Error(validation.errors.join('; '));
    }
    if (tree.nodes[tree.rootId].parentId !== null) throw new Error('Invalid root');
    return { ok: true, tree, migrated };
  } catch (error) {
    return { ok: false, reason: `Bản lưu không hợp lệ: ${error instanceof Error ? error.message : String(error)}` };
  }
}
