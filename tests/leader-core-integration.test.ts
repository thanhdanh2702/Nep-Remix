import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../src/content';
import { createInitialState, runCommand } from '../src/core';

test('inverse snapshot commands cannot erase an already claimed chapter reward', () => {
  const content = loadContent();
  const before = createInitialState(content);
  before.journey.prologue.status = 'completed';
  before.journey.prologue.solvedPuzzleIds = content.chapters.prologue.puzzles.map(p => p.id);
  before.journey.prologue.completedDialogueIds = ['d-c0-ba-dan-do'];
  const claimed = runCommand(before, { type: 'reward/claim', payload: { chapterId: 'prologue' } }, content);
  assert.ok(claimed.ok);
  for (const type of ['dialogue/restore', 'interact/undo']) {
    const restored = runCommand(claimed.state, { type, payload: { previousState: before } }, content);
    assert.equal(restored.ok, false, type);
    assert.equal(restored.state, claimed.state, 'rejected restoration retains the entire current snapshot');
  }
});
