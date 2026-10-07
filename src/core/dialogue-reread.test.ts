import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, dispatch, fromJSON, toJSON, runCommand } from './index.ts';
import { enqueueDialogues } from './commands/journey/dialogue-queue.ts';

const content = loadContent();
const mirror = content.chapters.prologue.areas[0].interactables.find(i => i.id === 'hitbox-mirror')!;
const clickMirror = { type: 'interact', payload: { targetId: mirror.id, playerPos: mirror.pos } };
const advance = { type: 'dialogue/advance', payload: {} };

test('explicit mirror reread opens again; automatic trigger still ignores completed dialogue', () => {
  const initial = createInitialState(content);
  const opened = runCommand(initial, clickMirror, content); assert.ok(opened.ok);
  const read = runCommand(opened.state, advance, content); assert.ok(read.ok);
  const triggered = enqueueDialogues(read.state, ['d-c0-mirror'], content);
  assert.equal(triggered.journey.prologue.activeDialogue, null);
  const reopened = runCommand(read.state, clickMirror, content); assert.ok(reopened.ok);
  assert.equal(reopened.state.journey.prologue.activeDialogue?.dialogueId, 'd-c0-mirror');
  assert.equal(reopened.state.journey.prologue.activeDialogue?.mode, 'reread');
  const finished = runCommand(reopened.state, advance, content); assert.ok(finished.ok);
  assert.deepEqual(finished.state, read.state);
  assert.deepEqual(finished.events, []);
});

test('rereading clue dialogue survives reload and never grants a missing clue or duplicate completion', () => {
  const state = createInitialState(content);
  state.currentChapter = 'c1'; state.journey.c1.status = 'in_progress';
  state.journey.c1.currentArea = 'c1-s2-ban-tho-nha-tho-ho';
  state.journey.c1.completedDialogueIds = ['d-c1-tiet-hanh'];
  const hotspot = content.chapters.c1.areas[1].interactables.find(i => i.id === 'hitbox-honor-plaque')!;
  const opened = runCommand(state, { type: 'interact', payload: { targetId: hotspot.id, playerPos: hotspot.pos } }, content); assert.ok(opened.ok);
  assert.equal(opened.state.journey.c1.activeDialogue?.mode, 'reread');
  const restored = fromJSON(toJSON(createInitialTree(opened.state)), content); assert.ok(restored.ok);
  let tree = restored.tree;
  for (let step = 0; step < 2; step++) {
    const result = dispatch(tree, advance, content); assert.ok(result.ok); assert.deepEqual(result.events, []); tree = result.tree;
  }
  assert.deepEqual(tree.nodes[tree.headId].snapshot, state);
});

test('explicit reread cannot replace active unread dialogue or its queue', () => {
  const state = createInitialState(content);
  state.journey.prologue.completedDialogueIds = ['d-c0-mirror'];
  state.journey.prologue.activeDialogue = { dialogueId: 'd-c0-stairs', currentNodeId: 'node-1', history: ['node-1'] };
  state.journey.prologue.dialogueQueue = ['d-c0-ba-dan-do'];
  const result = runCommand(state, clickMirror, content);
  assert.equal(result.ok, false); assert.equal(result.state, state);
});

test('clicking the active dialogue resumes its current node instead of restarting', () => {
  const state = createInitialState(content);
  state.currentChapter = 'c1'; state.journey.c1.status = 'in_progress'; state.journey.c1.currentArea = 'c1-s2-ban-tho-nha-tho-ho';
  const hotspot = content.chapters.c1.areas[1].interactables.find(i => i.id === 'hitbox-honor-plaque')!;
  const command = { type: 'interact', payload: { targetId: hotspot.id, playerPos: hotspot.pos } };
  const opened = runCommand(state, command, content); assert.ok(opened.ok);
  const read = runCommand(opened.state, advance, content); assert.ok(read.ok);
  const resumed = runCommand(read.state, command, content); assert.ok(resumed.ok);
  assert.deepEqual(resumed.state, read.state);
  assert.equal(resumed.state.journey.c1.activeDialogue?.currentNodeId, 'node-2');
});

test('reread choices preserve progress and promote unread trigger queue', () => {
  const custom = { ...content, chapters: { ...content.chapters, prologue: structuredClone(content.chapters.prologue) } };
  const dialogue = custom.chapters.prologue.dialogues.find(d => d.id === 'd-c0-mirror')!;
  dialogue.nodes[0].choices = [{ text: 'Xem tiếp', nextNodeId: 'end' }];
  dialogue.nodes.push({ id: 'end', text: 'Kết', clueId: 'clue-ba-dan-do' });
  const state = createInitialState(custom); state.journey.prologue.completedDialogueIds = ['d-c0-mirror'];
  const opened = runCommand(state, clickMirror, custom); assert.ok(opened.ok);
  const queued = enqueueDialogues(opened.state, ['d-c0-stairs', 'd-c0-stairs', 'd-c0-mirror'], custom);
  const chosen = runCommand(queued, { type: 'dialogue/choose', payload: { choiceIndex: 0 } }, custom); assert.ok(chosen.ok);
  assert.equal(chosen.state.journey.prologue.activeDialogue?.mode, 'reread');
  const finished = runCommand(chosen.state, advance, custom); assert.ok(finished.ok);
  assert.deepEqual(finished.state.notebook.unlockedClueIds, []);
  assert.deepEqual(finished.events, []);
  assert.deepEqual(finished.state.journey.prologue.completedDialogueIds, ['d-c0-mirror']);
  assert.equal(finished.state.journey.prologue.activeDialogue?.dialogueId, 'd-c0-stairs');
  assert.equal(finished.state.journey.prologue.activeDialogue?.mode, undefined);
});
