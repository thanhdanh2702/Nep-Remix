import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../src/content';
import { createInitialState, createInitialTree, dispatch, runCommand } from '../src/core';

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

test('resubmitting a solved puzzle returns Vietnamese feedback without changing the tree', () => {
  const content = loadContent();
  const state = createInitialState(content);
  state.currentChapter = 'c1';
  state.journey.c1.status = 'in_progress';
  state.journey.c1.currentArea = 'c1-s2-ban-tho-nha-tho-ho';
  state.journey.c1.solvedPuzzleIds = ['p-c1-altar-cut-threads'];
  const tree = createInitialTree(state);
  for (const command of [
    { type: 'puzzle/submit', payload: { puzzleId: 'p-c1-altar-cut-threads', answer: 'keo_may_bang_dong' } },
    { type: 'item/use', payload: { targetPuzzleId: 'p-c1-altar-cut-threads', itemId: 'keo_may_bang_dong' } },
  ]) {
    const result = dispatch(tree, command, content);
    assert.equal(result.ok, false);
    if (result.ok) throw new Error('Solved puzzle unexpectedly accepted');
    assert.match(result.reason, /Câu đố.*đã được giải/);
    assert.equal(result.tree, tree);
  }
});
