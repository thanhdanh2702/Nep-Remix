import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadContent } from '../content';
import { createInitialState } from '../core';
import { isChapterPlayable } from './chapter-availability';

test('C2 and C3 are available through normal selection and C4/C5 stay unavailable', () => {
  const source = readFileSync(new URL('./Game.tsx', import.meta.url), 'utf8');
  assert.match(source, /if\(!isChapterPlayable\(id, state\)\)/);
  assert.match(source, /state\.journey\[id\]\.status==='locked'/);
  const state = createInitialState(loadContent());
  assert.equal(isChapterPlayable('c2', state), true);
  assert.equal(isChapterPlayable('c3', state), true);
  state.journey.c2.status = 'completed';
  assert.equal(isChapterPlayable('c3', state), true);
  for (const id of ['c4', 'c5'] as const) assert.equal(isChapterPlayable(id, state), false);
});
