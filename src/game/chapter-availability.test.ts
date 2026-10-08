import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content';
import { createInitialState } from '../core';
import { isChapterPlayable } from './chapter-availability';

test('C3 demo is available only after C2 completion; later chapters stay unavailable', () => {
  const state = createInitialState(loadContent());
  assert.equal(isChapterPlayable('c3', state), false);
  state.journey.c2.status = 'in_progress';
  assert.equal(isChapterPlayable('c3', state), false);
  state.journey.c2.status = 'completed';
  assert.equal(isChapterPlayable('c3', state), true);
  for (const id of ['prologue', 'c1', 'c2'] as const) assert.equal(isChapterPlayable(id, state), true);
  for (const id of ['c4', 'c5'] as const) assert.equal(isChapterPlayable(id, state), false);
});
