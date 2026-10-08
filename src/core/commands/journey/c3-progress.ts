import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import { isGateSatisfied } from './gate.ts';

// Internal C3 reconciliation. A solve is retained through migration; reading is never inferred.
// Queueing a later step is safe, but activating/acknowledging it must recheck its gate.
const recoveryTriggers = [
  ['p-c3-bagua-lock', 'd-c3-so-tu-vi', 'd-c3-thoa-thuan'],
  ['p-c3-present-evidence', 'd-c3-vinh-stand', 'd-c3-ong-le-defeat'],
  ['p-c3-styling-mai', 'd-c3-ending'],
];
const rooms: Record<string, string> = {
  'd-c3-mua-chuoc': 'c3-s1-tiem-may-da-kao', 'd-c3-street-exit': 'c3-s1-tiem-may-da-kao',
  'd-c3-bagua': 'c3-s2-phong-phong-thuy', 'd-c3-so-tu-vi': 'c3-s2-phong-phong-thuy',
  'd-c3-thoa-thuan': 'c3-s2-phong-phong-thuy',
  'd-c3-ban-sua': 'c3-s3-dinh-thu-doi-dau', 'd-c3-vinh-stand': 'c3-s3-dinh-thu-doi-dau',
  'd-c3-ong-le-defeat': 'c3-s3-dinh-thu-doi-dau', 'd-c3-ending': 'c3-s3-dinh-thu-doi-dau',
};
export function canReadC3Dialogue(state: GameState, id: string, content: GameContent): boolean {
  const p = state.journey.c3;
  const dialogue = content.chapters.c3.dialogues.find(d => d.id === id);
  return state.currentChapter === 'c3' && p.status !== 'locked' && p.side === 'mat_phai'
    && (!rooms[id] || rooms[id] === p.currentArea) && !!dialogue && isGateSatisfied(state, dialogue.when);
}

export function reconcileC3Progress(state: GameState, content: GameContent): GameState {
  if (state.currentChapter !== 'c3') return state;
  const p = state.journey.c3;
  if (p.status === 'locked') return state;
  let active = p.activeDialogue;
  const queued = [...(p.dialogueQueue ?? [])];
  if (active && !canReadC3Dialogue(state, active.dialogueId, content)) {
    if (active.mode !== 'reread') queued.unshift(active.dialogueId);
    active = null;
  }
  if (!p.claimed) {
    for (const [puzzleId, ...ids] of recoveryTriggers) {
      if (p.solvedPuzzleIds.includes(puzzleId) && canReadC3Dialogue(state, ids[0], content)) queued.push(...ids);
    }
  }
  const queue = [...new Set(queued)].filter(id => id !== active?.dialogueId
    && !p.completedDialogueIds.includes(id) && content.chapters.c3.dialogues.some(d => d.id === id)
    && recoveryTriggers.every(([, first, ...rest]) => ![first, ...rest].includes(id) || canReadC3Dialogue(state, first, content)));
  if (!active) {
    const index = queue.findIndex(id => canReadC3Dialogue(state, id, content));
    if (index >= 0) {
      const id = queue.splice(index, 1)[0];
      const first = content.chapters.c3.dialogues.find(d => d.id === id)!.nodes[0].id;
      active = { dialogueId: id, currentNodeId: first, history: [first] };
    }
  }
  return { ...state, journey: { ...state.journey, c3: { ...p, activeDialogue: active, dialogueQueue: queue } } };
}
