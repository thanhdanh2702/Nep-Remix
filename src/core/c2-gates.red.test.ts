import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, fromJSON, runCommand, toJSON } from './index.ts';

// M0 audit specifications against the pre-checkpoint Core baseline. Intentionally RED.
// Fixtures seed legacy progress to exercise direct-command guards, not a happy-path UI.
const content = loadContent();
const [S1, S2, S3] = content.chapters.c2.areas.map(area => area.id);
const [P1, P2, P3, P4, P5] = content.chapters.c2.puzzles.map(puzzle => puzzle.id);
const pieces = ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4'];
const key = 'chia_khoa_ket_sat_bang_thau';
const receipt = 'bien_lai_tra_no_goc_1935';
const contract = 'ban_giao_keo_ep_hon';
const sketch = 'ban_ve_ao_dai_tan_thoi';
const stateAt = (area = S1) => {
  const state = createInitialState(content);
  state.currentChapter = 'c2';
  Object.assign(state.journey.c2, { status: 'in_progress', currentArea: area,
    side: 'mat_phai', unlockedAreaIds: [S1, S2, S3] });
  return state;
};
const afterG1 = (area = S2) => {
  const state = stateAt(area);
  state.journey.c2.solvedPuzzleIds = [P1];
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma'];
  return state;
};
const afterG2 = () => {
  const state = afterG1(S3);
  state.journey.c2.solvedPuzzleIds.push(P2);
  state.journey.c2.completedDialogueIds.push('d-c2-bien-lai', 'd-c2-giao-keo');
  state.inventory.itemIds.push(receipt, contract, sketch);
  return state;
};
const reject = (state: ReturnType<typeof stateAt>, type: string, payload: unknown) => {
  const result = runCommand(state, { type, payload }, content);
  assert.equal(result.ok, false, `${type} must reject before mutation`);
  assert.equal(result.state, state);
};

for (const itemId of pieces) test(`D0 blocks direct pickup ${itemId}`, () => {
  reject(stateAt(), 'item/pick', { itemId });
});
test('D0 blocks P1 open', () => reject(stateAt(), 'puzzle/open', { puzzleId: P1 }));
test('D0 blocks hotspot pickup as well as direct command', () => {
  const hotspot = content.chapters.c2.areas[0].interactables[0];
  reject(stateAt(), 'interact', { targetId: hotspot.id, playerPos: hotspot.pos });
});
for (const [from, to, gate] of [[S1, S2, 'G1'], [S2, S3, 'G2']] as const) {
  test(`${gate} blocks legacy unlockedAreaIds forward exit`, () => {
    reject(stateAt(from), 'area/goTo', { areaId: to });
  });
  test(`${gate} blocks legacy navStack forward goBack`, () => {
    const state = stateAt(from); state.journey.c2.navStack = [to];
    reject(state, 'area/goBack', {});
  });
}
test('G1 blocks direct key pickup in legacy S2', () => reject(stateAt(S2), 'item/pick', { itemId: key }));
test('G1 blocks direct safe submit with owned key on right side', () => {
  const state = stateAt(S2); state.inventory.itemIds.push(key);
  reject(state, 'puzzle/submit', { puzzleId: P2, answer: key });
});
test('safe opens on right side after G1', () => {
  assert.equal(runCommand(afterG1(), { type: 'puzzle/open', payload: { puzzleId: P2 } }, content).ok, true);
});
test('G2 requires both papers acknowledged before receipt', () => {
  const state = afterG1(S3); state.journey.c2.solvedPuzzleIds.push(P2);
  state.journey.c2.completedDialogueIds.push('d-c2-bien-lai');
  state.inventory.itemIds.push(receipt, contract);
  reject(state, 'puzzle/submit', { puzzleId: P3, answer: receipt });
});
test('sketch requires receipt presentation after G2', () => {
  reject(afterG2(), 'puzzle/submit', { puzzleId: P4, answer: sketch });
});
test('styling requires sketch presentation after G2 and receipt', () => {
  const state = afterG2(); state.journey.c2.solvedPuzzleIds.push(P3);
  reject(state, 'puzzle/open', { puzzleId: P5 });
});
test('all five puzzles without ending cannot complete C2', () => {
  const state = afterG2(); state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4, P5];
  reject(state, 'chapter/complete', { chapterId: 'c2' });
});
for (const [label, answer] of [
  ['unknown', ['unknown_piece']], ['duplicate', [pieces[0], pieces[0]]], ['unowned', [pieces[1]]],
] as const) test(`order draft rejects ${label} and retains previous draft`, () => {
  const state = stateAt(); state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.inventory.itemIds.push(pieces[0]);
  state.journey.c2.puzzleDrafts = { [P1]: { type: 'order', answer: [pieces[0]] } };
  reject(state, 'puzzle/updateDraft', { puzzleId: P1, draft: { type: 'order', answer: [...answer] } });
});
for (const answer of [[], [pieces[2]], [pieces[2], pieces[0]]]) test(`valid partial/wrong-order draft ${JSON.stringify(answer)} remains editable`, () => {
  const state = stateAt(); state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.inventory.itemIds.push(...pieces);
  const result = runCommand(state, { type: 'puzzle/updateDraft', payload: { puzzleId: P1, draft: { type: 'order', answer } } }, content);
  assert.ok(result.ok);
  assert.deepEqual(result.state.journey.c2.puzzleDrafts?.[P1], { type: 'order', answer });
});
for (const answer of [[], [pieces[0], pieces[0], pieces[2], pieces[3]], [...pieces].reverse(), [...pieces.slice(0, 3), 'unknown_piece']]) {
  test(`owned invalid order submit gives feedback without solve: ${JSON.stringify(answer)}`, () => {
    const state = stateAt(); state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
    state.inventory.itemIds.push(...pieces);
    const result = runCommand(state, { type: 'puzzle/submit', payload: { puzzleId: P1, answer } }, content);
    assert.ok(result.ok); assert.equal(result.state, state);
    assert.ok(result.events.some(event => event.type === 'puzzleFeedback' && event.payload.result === 'incorrect'));
  });
}
test('unowned complete order is a guard failure', () => {
  const state = stateAt(); state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  reject(state, 'puzzle/submit', { puzzleId: P1, answer: pieces });
});
for (const context of ['wrong room', 'wrong side', 'wrong chapter']) test(`P1 direct submit rejects ${context}`, () => {
  const state = stateAt(context === 'wrong room' ? S2 : S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi']; state.inventory.itemIds.push(...pieces);
  if (context === 'wrong side') state.journey.c2.side = 'mat_trai';
  if (context === 'wrong chapter') state.currentChapter = 'prologue';
  reject(state, 'puzzle/submit', { puzzleId: P1, answer: pieces });
});
test('first entry enqueues intro once, repeated entry preserves queue', () => {
  const state = createInitialState(content); state.journey.c2.status = 'in_progress';
  const entered = runCommand(state, { type: 'chapter/enter', payload: { chapterId: 'c2' } }, content);
  assert.ok(entered.ok);
  const progress = entered.state.journey.c2;
  assert.equal(progress.activeDialogue?.dialogueId, 'd-c2-ca-nghi');
  const left = { ...entered.state, currentChapter: 'prologue' as const };
  const reentered = runCommand(left, { type: 'chapter/enter', payload: { chapterId: 'c2' } }, content);
  assert.ok(reentered.ok);
  assert.deepEqual(reentered.state.journey.c2.activeDialogue, progress.activeDialogue);
  assert.deepEqual(reentered.state.journey.c2.dialogueQueue, progress.dialogueQueue);
});
test('reentry retains legacy room, stack, drafts and dialogue queue', () => {
  const state = afterG2(); state.currentChapter = 'prologue';
  state.journey.c2.navStack = [S1, S2];
  state.journey.c2.puzzleDrafts = { [P1]: { type: 'order', answer: pieces } };
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai'];
  state.journey.c2.dialogueQueue = ['d-c2-giao-keo'];
  const result = runCommand(state, { type: 'chapter/enter', payload: { chapterId: 'c2' } }, content);
  assert.ok(result.ok); assert.deepEqual(result.state.journey.c2, state.journey.c2);
});
test('safe gives both papers atomically; queue survives save; replay submit cannot grant again', () => {
  const state = afterG1(); state.inventory.itemIds.push(key);
  const result = runCommand(state, { type: 'puzzle/submit', payload: { puzzleId: P2, answer: key } }, content);
  assert.ok(result.ok);
  for (const item of [receipt, contract]) assert.equal(result.state.inventory.itemIds.filter(id => id === item).length, 1);
  assert.deepEqual(result.state.notebook.unlockedClueIds, []);
  assert.equal(result.state.journey.c2.activeDialogue?.dialogueId, 'd-c2-bien-lai');
  assert.deepEqual(result.state.journey.c2.dialogueQueue, ['d-c2-giao-keo']);
  const restored = fromJSON(toJSON(createInitialTree(result.state)), content); assert.ok(restored.ok);
  if (!restored.ok) return;
  const snapshot = restored.tree.nodes[restored.tree.headId].snapshot;
  assert.deepEqual(snapshot.journey.c2.dialogueQueue, ['d-c2-giao-keo']);
  reject(snapshot, 'puzzle/submit', { puzzleId: P2, answer: key });
});
test('new C2 reward is 100 Sen exactly once', () => {
  const state = afterG2(); state.journey.c2.status = 'completed';
  state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4, P5];
  // The pre-checkpoint catalog has no ending yet. Keep this fixture valid so the
  // RED signal is the 120/100 delta; the separate completion test covers D4.
  if (content.chapters.c2.dialogues.map(dialogue => String(dialogue.id)).includes('d-c2-ending')) {
    state.journey.c2.completedDialogueIds.push('d-c2-ending');
  }
  const result = runCommand(state, { type: 'reward/claim', payload: { chapterId: 'c2' } }, content);
  assert.ok(result.ok); assert.equal(result.state.wallet.senNgoc - state.wallet.senNgoc, 100);
  reject(result.state, 'reward/claim', { chapterId: 'c2' });
});
test('legacy claimed 120 Sen remains unchanged through save restore', () => {
  const state = afterG2(); state.journey.c2.status = 'completed'; state.journey.c2.claimed = true;
  state.claimedRewardIds = ['reward-c2']; state.wallet.senNgoc = 220;
  const restored = fromJSON(toJSON(createInitialTree(state)), content); assert.ok(restored.ok);
  if (!restored.ok) return;
  const snapshot = restored.tree.nodes[restored.tree.headId].snapshot;
  assert.equal(snapshot.wallet.senNgoc, 220);
  assert.equal(snapshot.journey.c2.completedDialogueIds.includes('d-c2-ending'), false);
  reject(snapshot, 'reward/claim', { chapterId: 'c2' });
});
