import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, dispatch, runCommand, fromJSON, toJSON } from './index.ts';
import { evaluatePuzzleAnswer } from './commands/journey/puzzle-commands.ts';
const content = loadContent();
const fresh = () => createInitialState(content);
test('use requires exact unique set and action token', () => {
  const puzzle = content.chapters.c4.puzzles.find(p => p.id === 'p-c4-embroider-flower')!;
  for (const answer of [[], ['kim_theu_thep'], ['kim_theu_thep','kim_theu_thep'], 'kim_theu_thep', ['kim_theu_thep','cuon_chi_to_dao','keo_may_bang_dong']]) assert.equal(evaluatePuzzleAnswer(puzzle, answer), false);
  assert.equal(evaluatePuzzleAnswer(puzzle, ['cuon_chi_to_dao','kim_theu_thep']), true);
  assert.equal(evaluatePuzzleAnswer(content.chapters.prologue.puzzles[0], {}), false);
});
test('remote puzzle and public solve/skip cannot mutate progress', () => {
  const state = fresh();
  for (const type of ['puzzle/submit','puzzle/solve','puzzle/skip','item/use']) {
    const result = runCommand(state,{type,payload:{puzzleId:'p-c0-cloth',answer:'interact',itemId:'keo_may_bang_dong',targetPuzzleId:'p-c0-cloth'}},content);
    assert.equal(result.ok,false,type); assert.equal(result.state,state);
  }
});
test('multi-trigger queue grants clues only upon acknowledging current node and survives save', () => {
  const state = fresh(); state.currentChapter='c1'; state.journey.c1.status='in_progress'; state.journey.c1.currentArea='c1-s2-ban-tho-nha-tho-ho';
  const solved=runCommand(state,{type:'puzzle/submit',payload:{puzzleId:'p-c1-altar-cut-threads',answer:'keo_may_bang_dong'}},content);
  assert.ok(solved.ok); if(!solved.ok)return;
  assert.deepEqual(solved.state.notebook.unlockedClueIds,[]);
  assert.deepEqual((solved.state.journey.c1 as any).dialogueQueue,['d-c1-van-tu']);
  const restored=fromJSON(toJSON(createInitialTree(solved.state)),content); assert.ok(restored.ok); if(!restored.ok)return;
  let tree=restored.tree;
  for(let i=0;i<4;i++){const r=dispatch(tree,{type:'dialogue/advance',payload:{}},content);assert.ok(r.ok);if(r.ok)tree=r.tree;}
  const final=tree.nodes[tree.headId].snapshot;
  assert.deepEqual(final.journey.c1.completedDialogueIds,['d-c1-thu-chong','d-c1-van-tu']);
  assert.deepEqual(final.notebook.unlockedClueIds,['clue-thu-chong-cu-cam','clue-van-tu-ban-dat']);
});
test('completion requires ending and reward grants every gift once; legacy repair does not add Sen', () => {
  const state=fresh(); state.journey.prologue.solvedPuzzleIds=content.chapters.prologue.puzzles.map(p=>p.id);
  assert.equal(runCommand(state,{type:'chapter/complete',payload:{chapterId:'prologue'}},content).ok,false);
  state.journey.prologue.completedDialogueIds=['d-c0-ba-dan-do'];
  const completed=runCommand(state,{type:'chapter/complete',payload:{chapterId:'prologue'}},content);assert.ok(completed.ok);if(!completed.ok)return;
  const claimed=runCommand(completed.state,{type:'reward/claim',payload:{chapterId:'prologue'}},content);assert.ok(claimed.ok);if(!claimed.ok)return;
  assert.equal(claimed.state.wallet.senNgoc,150);
  assert.ok(claimed.state.inventory.itemIds.includes('thuoc_go_tho_may_1888'));
  assert.ok((claimed.state.museum as any).unlockedCardIds.includes(content.chapters.prologue.chapter.reward.cardIds![0]));
  assert.deepEqual(claimed.state.museum.readCardIds,[]);
  assert.equal(runCommand(claimed.state,{type:'reward/claim',payload:{chapterId:'prologue'}},content).ok,false);
  const legacy=structuredClone(claimed.state);legacy.inventory.itemIds=[];delete (legacy.museum as any).unlockedCardIds;delete (legacy as any).claimedRewardIds;
  const restored=fromJSON(toJSON(createInitialTree(legacy)),content);assert.ok(restored.ok);if(!restored.ok)return;
  const repaired=restored.tree.nodes[restored.tree.headId].snapshot;
  assert.equal(repaired.wallet.senNgoc,150);assert.ok(repaired.inventory.itemIds.includes('thuoc_go_tho_may_1888'));
});
test('malformed payload is a rejected command, not an exception',()=>{
  for(const type of ['puzzle/submit','item/use','interact','dialogue/choose']) assert.equal(runCommand(fresh(),{type,payload:null},content).ok,false);
});
test('persistent typed drafts survive close/reopen and reject wrong discriminators', () => {
  const state=fresh(); state.journey.prologue.currentArea='c0-s2-gac-xep-chiec-ruong';
  const draft={type:'use',answer:'kim_gut_bang_bac'};
  const result=runCommand(state,{type:'puzzle/updateDraft',payload:{puzzleId:'p-c0-mannequin-hand',draft}},content);
  assert.ok(result.ok);if(!result.ok)return;
  assert.equal(runCommand(state,{type:'puzzle/updateDraft',payload:{puzzleId:'p-c0-mannequin-hand',draft:{type:'code',answer:'12'}}},content).ok,false);
  const opened=runCommand(result.state,{type:'puzzle/open',payload:{puzzleId:'p-c0-mannequin-hand'}},content);assert.ok(opened.ok);if(!opened.ok)return;
  const closed=runCommand(opened.state,{type:'puzzle/close',payload:{}},content);assert.ok(closed.ok);if(!closed.ok)return;
  assert.deepEqual(closed.state.journey.prologue.puzzleDrafts?.['p-c0-mannequin-hand'],draft);
  const reset=runCommand(closed.state,{type:'puzzle/resetDraft',payload:{puzzleId:'p-c0-mannequin-hand'}},content);assert.ok(reset.ok);if(reset.ok)assert.equal(reset.state.journey.prologue.puzzleDrafts?.['p-c0-mannequin-hand'],undefined);
});
test('claimed rewards cannot be erased by replay or history travel', async () => {
  const {undo,checkout}=await import('./index.ts');
  const state=fresh(); state.journey.prologue.status='completed';
  let tree=createInitialTree(state);
  const result=dispatch(tree,{type:'reward/claim',payload:{chapterId:'prologue'}},content);assert.ok(result.ok);if(!result.ok)return;tree=result.tree;
  assert.equal(undo(tree).ok,false);
  assert.equal(checkout(tree,tree.rootId,content).ok,false);
  const replay=runCommand(tree.nodes[tree.headId].snapshot,{type:'chapter/replay',payload:{chapterId:'prologue'}},content);
  assert.equal(replay.ok,false);
});
test('migration rejects malformed non-head snapshots, unsupported versions and cyclic links', () => {
  const tree=createInitialTree(fresh());
  for(const value of [{...tree,version:'999'}, {...tree,nodes:{...tree.nodes,[tree.rootId]:{...tree.nodes[tree.rootId],parentId:tree.rootId}}}, {...tree,nodes:{...tree.nodes,[tree.rootId]:{...tree.nodes[tree.rootId],snapshot:{}}}}]) assert.equal(fromJSON(JSON.stringify(value),content).ok,false);
});
