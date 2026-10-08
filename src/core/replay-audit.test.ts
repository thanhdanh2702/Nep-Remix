import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, createChapterReplayTree, dispatch, prune, runCommand, fromJSON, toJSON } from './index.ts';
import { saveGame, SAVE_KEY } from '../game/store.ts';

const content = loadContent();
test('replay requires completion and leaves pending-claim main tree byte-for-byte intact', () => {
  const main = createInitialTree(createInitialState(content));
  assert.equal(createChapterReplayTree(main, 'c1', content).ok, false);
  const original = main.nodes[main.headId].snapshot;
  original.journey.c1.status = 'completed';
  const before = toJSON(main);
  const replay = createChapterReplayTree(main, 'c1', content); assert.ok(replay.ok);
  const state = replay.tree.nodes[replay.tree.headId].snapshot;
  assert.equal(state.currentChapter, 'c1');
  assert.equal(state.journey.c1.status, 'in_progress');
  assert.deepEqual(state.journey.c1.solvedPuzzleIds, []);
  assert.deepEqual(state.journey.c1.completedDialogueIds, []);
  state.journey.c1.hintTiers['p-c1-escape'] = 1;
  assert.equal(toJSON(main), before);
  assert.equal(runCommand(original, {type:'reward/claim',payload:{chapterId:'c1'}},content).ok,true);
});

test('practice C1 can be completed but cannot claim, save or mutate the main wallet/closet', () => {
  const main = createInitialTree(createInitialState(content)); main.nodes[main.headId].snapshot.journey.c1.status = 'completed';
  const before = toJSON(main);
  const replay = createChapterReplayTree(main, 'c1', content); assert.ok(replay.ok);
  let tree = replay.tree;
  const current = () => tree.nodes[tree.headId].snapshot;
  const send = (type: string, payload: unknown) => { const result = dispatch(tree, {type,payload}, content); assert.ok(result.ok, !result.ok ? result.reason : ''); tree = result.tree; };
  const tap = (id: string) => { const area = content.chapters.c1.areas.find(a => a.id === current().journey.c1.currentArea)!; const i = area.interactables.find(i => i.id === id)!; send('interact', {targetId:id,playerPos:i.pos}); };
  const read = () => { let budget = 20; while(current().journey.c1.activeDialogue) {assert.ok(budget-- > 0); send('dialogue/advance',{});} };
  tap('hitbox-loom-shuttle'); tap('hitbox-belt-rack'); send('item/combine',{itemIds:['con_thoi_go_mun','that_lung_lua_cham']});
  send('item/use',{itemId:'dung_cu_moc_then_cua',targetPuzzleId:'p-c1-escape'}); send('area/goTo',{areaId:'c1-s2-ban-tho-nha-tho-ho'});
  send('item/use',{itemId:'keo_may_bang_dong',targetPuzzleId:'p-c1-altar-cut-threads'}); read(); send('area/goTo',{areaId:'c1-s3-cong-dinh-doi-dau'});
  send('puzzle/submit',{puzzleId:'p-c1-present-contract',answer:'to_van_tu_cam_co_dat'}); send('puzzle/submit',{puzzleId:'p-c1-present-letter',answer:'buc_thu_tay_chong_cu_Cam'});
  tap('hitbox-stone-step'); read();
  send('puzzle/submit',{puzzleId:'p-c1-styling-cam',answer:{silhouette:'ngu_than_tay_chen',garmentId:'ao-ngu-than-tay-chen',headwearId:'khan-van-den',footwearId:'guoc-moc'}});
  tap('hitbox-village-gate-exit'); read(); send('chapter/complete',{chapterId:'c1'});
  const result = dispatch(tree,{type:'reward/claim',payload:{chapterId:'c1'}},content); assert.equal(result.ok,false); assert.equal(result.tree,tree);
  assert.equal(current().wallet.senNgoc,100); assert.equal(current().closet.unlockedGarmentIds.includes('ao-ngu-than-tay-thung'),false);
  const compacted = prune(tree,2); assert.equal(compacted.replayOfChapter,'c1');
  const restored = fromJSON(toJSON(compacted),content); assert.ok(restored.ok); assert.equal(restored.tree.replayOfChapter,'c1');
  const writes: string[] = [];
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>before,setItem:(key:string)=>writes.push(key)}});
  try { assert.equal(saveGame(restored.tree),false); assert.deepEqual(writes,[]); assert.equal(localStorage.getItem(SAVE_KEY),before); }
  finally {delete (globalThis as any).localStorage;}
  assert.equal(toJSON(main),before);
});
