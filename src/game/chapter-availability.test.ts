import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content';
import { createInitialState, createInitialTree, fromJSON, toJSON } from '../core';
import { isChapterPlayable } from './chapter-availability';

test('chapters with implemented UI are open immediately; later chapters stay unavailable', () => {
  const state = createInitialState(loadContent());
  assert.equal(isChapterPlayable('c3', state), true);
  state.journey.c2.status = 'in_progress';
  assert.equal(isChapterPlayable('c3', state), true);
  state.journey.c2.status = 'completed';
  assert.equal(isChapterPlayable('c3', state), true);
  for (const id of ['prologue', 'c1', 'c2'] as const) assert.equal(isChapterPlayable(id, state), true);
  for (const id of ['c4', 'c5'] as const) assert.equal(isChapterPlayable(id, state), false);
  for (const id of ['prologue', 'c1', 'c2', 'c3'] as const) assert.equal(state.journey[id].status, id === 'c2' ? 'completed' : 'in_progress');
});

test('existing saves open ready chapters without granting progress or rewards', () => {
  const content = loadContent(), state = createInitialState(content);
  for (const id of ['c1', 'c2', 'c3'] as const) state.journey[id].status = 'locked';
  const before = structuredClone(state), loaded = fromJSON(toJSON(createInitialTree(state)), content);
  assert.equal(loaded.ok, true);
  if (!loaded.ok) return;
  const restored = loaded.tree.nodes[loaded.tree.headId].snapshot;
  for (const id of ['c1', 'c2', 'c3'] as const) {
    assert.equal(restored.journey[id].status, 'in_progress');
    assert.deepEqual({ ...restored.journey[id], status: 'locked' }, before.journey[id]);
  }
  assert.deepEqual(restored.wallet, before.wallet);
  assert.deepEqual(restored.closet, before.closet);
  assert.deepEqual(restored.inventory, before.inventory);
  for (const id of ['c4', 'c5'] as const) assert.deepEqual(restored.journey[id], before.journey[id]);
});
