import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, dispatch, fromJSON, toJSON, runCommand,
  CONTENT_VERSION, checkout, undo, createChapterReplayTree } from './index.ts';
const content = loadContent();
const [S1,S2,S3] = content.chapters.c2.areas.map(a => a.id);
const [P1,P2,P3,P4,P5] = content.chapters.c2.puzzles.map(p => p.id);
const pieces = ['manh_ban_ve_ao_dai_1','manh_ban_ve_ao_dai_2','manh_ban_ve_ao_dai_3','manh_ban_ve_ao_dai_4'];
function ready() {
  const state = createInitialState(content); state.currentChapter = 'c2';
  Object.assign(state.journey.c2,{status:'in_progress',currentArea:S2,unlockedAreaIds:[S1,S2,S3],
    solvedPuzzleIds:[P1],completedDialogueIds:['d-c2-ca-nghi','d-c2-mat-ma']});
  state.inventory.itemIds.push(...pieces,'ban_ve_ao_dai_tan_thoi','chia_khoa_ket_sat_bang_thau');
  return state;
}
function legacyBytes(state = ready()) {
  const envelope = JSON.parse(toJSON(createInitialTree(state))); envelope.contentVersion = 'sprint-01-core-1';
  return JSON.stringify(envelope);
}
test('save accepts old/new/unversioned content, rejects unknown version and marks migration', () => {
  assert.equal(CONTENT_VERSION,'sprint-03-core-1');
  const state = ready();
  for (const bytes of [legacyBytes(state),JSON.stringify(createInitialTree(state)),toJSON(createInitialTree(state))]) {
    const result = fromJSON(bytes,content); assert.ok(result.ok);
    if (result.ok) assert.equal(result.migrated,JSON.parse(bytes).contentVersion !== CONTENT_VERSION);
  }
  const unknown = JSON.parse(legacyBytes()); unknown.contentVersion = 'sprint-99-core-1';
  assert.equal(fromJSON(JSON.stringify(unknown),content).ok,false);
});
test('legacy completed but unclaimed C2 cannot claim or complete before recovery reading', () => {
  const state = ready(); state.journey.c2.status = 'completed'; state.journey.c2.currentArea = S3;
  state.journey.c2.solvedPuzzleIds = [P1,P2,P3,P4,P5];
  for (const type of ['chapter/complete','reward/claim']) {
    const result = runCommand(state,{type,payload:{chapterId:'c2'}},content);
    assert.equal(result.ok,false); assert.equal(result.state,state);
  }
  state.journey.c2.completedDialogueIds.push('d-c2-ending');
  assert.equal(runCommand(state,{type:'reward/claim',payload:{chapterId:'c2'}},content).ok,false,'ending alone cannot bypass unread papers');
});
test('safe queue, clue acknowledgement and reread survive every node reload without duplicate rewards', () => {
  let tree = createInitialTree(ready());
  const send = (type:string,payload:unknown) => { const result = dispatch(tree,{type,payload},content); assert.ok(result.ok,!result.ok?result.reason:''); if(result.ok)tree=result.tree; };
  const snapshot = () => tree.nodes[tree.headId].snapshot;
  const reload = () => { const restored = fromJSON(toJSON(tree),content); assert.ok(restored.ok); if(restored.ok)tree=restored.tree; };
  send('puzzle/submit',{puzzleId:P2,answer:'chia_khoa_ket_sat_bang_thau'}); reload();
  assert.deepEqual(snapshot().notebook.unlockedClueIds,[]);
  assert.equal(snapshot().journey.c2.activeDialogue?.dialogueId,'d-c2-bien-lai');
  assert.deepEqual(snapshot().journey.c2.dialogueQueue,['d-c2-giao-keo']);
  assert.equal(runCommand(snapshot(),{type:'area/goTo',payload:{areaId:S3}},content).ok,false);
  send('dialogue/advance',{}); reload();
  assert.deepEqual(snapshot().notebook.unlockedClueIds,['clue-bien-lai-goc-1935']);
  assert.equal(snapshot().journey.c2.activeDialogue?.dialogueId,'d-c2-giao-keo');
  assert.equal(runCommand(snapshot(),{type:'area/goTo',payload:{areaId:S3}},content).ok,false);
  send('dialogue/advance',{}); reload();
  assert.deepEqual(snapshot().notebook.unlockedClueIds,['clue-bien-lai-goc-1935','clue-giao-keo-ep-hon']);
  send('area/goTo',{areaId:S3});
  for (const item of ['bien_lai_tra_no_goc_1935','ban_giao_keo_ep_hon']) assert.equal(snapshot().inventory.itemIds.filter(id=>id===item).length,1);
  assert.equal(runCommand(snapshot(),{type:'clue/collect',payload:{clueId:'clue-bien-lai-goc-1935'}},content).ok,false);
});
test('legacy S3 restores unread triggers even with an existing empty queue; no auto-read or Sen', () => {
  const state = ready(); state.journey.c2.currentArea = S3; state.journey.c2.solvedPuzzleIds = [P1,P2,P3,P4,P5];
  state.journey.c2.completedDialogueIds = []; state.journey.c2.dialogueQueue = [];
  state.inventory.itemIds.push('bien_lai_tra_no_goc_1935','ban_giao_keo_ep_hon');
  const result = fromJSON(legacyBytes(state),content); assert.ok(result.ok); if(!result.ok)return;
  const snapshot = result.tree.nodes[result.tree.headId].snapshot;
  assert.equal(snapshot.journey.c2.currentArea,S3);
  assert.equal(snapshot.journey.c2.activeDialogue?.dialogueId,'d-c2-ca-nghi');
  assert.deepEqual(snapshot.journey.c2.dialogueQueue,['d-c2-mat-ma','d-c2-bien-lai','d-c2-giao-keo','d-c2-ending']);
  assert.deepEqual(snapshot.journey.c2.completedDialogueIds,[]);
  assert.equal(snapshot.wallet.senNgoc,state.wallet.senNgoc);
  assert.equal(snapshot.journey.c2.claimed,false);
  assert.equal(runCommand(snapshot,{type:'area/goTo',payload:{areaId:S2}},content).ok,true,'reverse exit recovers without a forward gate');
});
test('migration revalidates order drafts on every history snapshot, preserves owned partial ordering', () => {
  const state = ready(); state.journey.c2.currentArea = S1;
  state.journey.c2.solvedPuzzleIds = [];
  state.journey.c2.puzzleDrafts = {[P1]:{type:'order',answer:[pieces[2],pieces[0]]}};
  const root = createInitialTree(state);
  const next = dispatch(root,{type:'puzzle/updateDraft',payload:{puzzleId:P1,draft:{type:'order',answer:[pieces[1],pieces[0]]}}},content); assert.ok(next.ok); if(!next.ok)return;
  const envelope = JSON.parse(toJSON(next.tree)); envelope.contentVersion = 'sprint-01-core-1';
  envelope.tree.nodes[envelope.tree.rootId].snapshot.journey.c2.puzzleDrafts[P1].answer = [pieces[0],pieces[0],'unknown'];
  const restored = fromJSON(JSON.stringify(envelope),content); assert.ok(restored.ok); if(!restored.ok)return;
  assert.equal(restored.tree.nodes[restored.tree.rootId].snapshot.journey.c2.puzzleDrafts?.[P1],undefined);
  assert.deepEqual(restored.tree.nodes[restored.tree.headId].snapshot.journey.c2.puzzleDrafts?.[P1],{type:'order',answer:[pieces[1],pieces[0]]});
  for (const node of Object.values(restored.tree.nodes)) assert.deepEqual(node.snapshot.journey.c2.solvedPuzzleIds,[]);
});
test('legacy claimed120 preserves ledger, every snapshot money, reread mode and gift repair without loan grants', () => {
  const state = ready(); state.journey.c2.status = 'completed'; state.journey.c2.claimed = true;
  state.journey.c2.solvedPuzzleIds = [P1,P2,P3,P4,P5]; state.wallet.senNgoc = 370;
  state.journey.c2.activeDialogue = {dialogueId:'d-c2-mat-ma',currentNodeId:'old-node',history:['old-node'],mode:'reread'};
  const restored = fromJSON(legacyBytes(state),content); assert.ok(restored.ok); if(!restored.ok)return;
  const snapshot = restored.tree.nodes[restored.tree.headId].snapshot;
  assert.equal(snapshot.wallet.senNgoc,370); assert.ok(snapshot.claimedRewardIds?.includes('reward-c2'));
  assert.equal(snapshot.journey.c2.activeDialogue?.mode,'reread');
  assert.equal(snapshot.journey.c2.activeDialogue?.currentNodeId,'node-1');
  for(const id of content.chapters.c2.chapter.reward.garmentIds!) assert.ok(snapshot.closet.unlockedGarmentIds.includes(id));
  assert.deepEqual(snapshot.closet.unlockedAccessoryIds,state.closet.unlockedAccessoryIds);
  assert.equal(snapshot.journey.c2.completedDialogueIds.includes('d-c2-ending'),false);
  assert.equal(runCommand(snapshot,{type:'reward/claim',payload:{chapterId:'c2'}},content).ok,false);
});
test('current save roundtrip retains borrowed draft, main progress and active ending node exactly', () => {
  const state = ready(); state.journey.c2.currentArea = S3;
  state.journey.c2.solvedPuzzleIds = [P1,P2,P3,P4,P5];
  state.journey.c2.completedDialogueIds.push('d-c2-bien-lai','d-c2-giao-keo');
  state.journey.c2.activeDialogue = {dialogueId:'d-c2-ending',currentNodeId:'node-2',history:['node-1','node-2']};
  state.journey.c2.puzzleDrafts = {[P5]:{type:'styling',answer:{silhouette:'tan_thoi',garmentId:'ao-dai-lemur',headwearId:'khan-van-den',footwearId:'guoc-moc',color0:'#abcd'}}};
  const tree = createInitialTree(state); const restored = fromJSON(toJSON(tree),content); assert.ok(restored.ok);
  if(restored.ok) assert.deepEqual(restored.tree,tree);
});
test('new C2 completion/reward cannot farm via reload, undo, checkout or replay', () => {
  const state = ready(); state.journey.c2.currentArea = S3;
  state.journey.c2.solvedPuzzleIds = [P1,P2,P3,P4,P5];
  state.journey.c2.completedDialogueIds.push('d-c2-bien-lai','d-c2-giao-keo','d-c2-ending');
  let tree = createInitialTree(state);
  const completed = dispatch(tree,{type:'chapter/complete',payload:{chapterId:'c2'}},content); assert.ok(completed.ok); if(!completed.ok)return; tree=completed.tree;
  const claimed = dispatch(tree,{type:'reward/claim',payload:{chapterId:'c2'}},content); assert.ok(claimed.ok); if(!claimed.ok)return; tree=claimed.tree;
  const restored = fromJSON(toJSON(tree),content); assert.ok(restored.ok); if(!restored.ok)return; tree=restored.tree;
  const snapshot = tree.nodes[tree.headId].snapshot;
  assert.equal(snapshot.wallet.senNgoc,state.wallet.senNgoc+100);
  assert.equal(undo(tree).ok,false); assert.equal(checkout(tree,tree.rootId,content).ok,false);
  assert.equal(runCommand(snapshot,{type:'reward/claim',payload:{chapterId:'c2'}},content).ok,false);
  const replay = createChapterReplayTree(tree,'c2',content); assert.ok(replay.ok);
  if(replay.ok) {
    assert.equal(replay.tree.nodes[replay.tree.headId].snapshot.journey.c2.activeDialogue?.dialogueId,'d-c2-ca-nghi');
    assert.equal(dispatch(replay.tree,{type:'reward/claim',payload:{chapterId:'c2'}},content).ok,false);
    assert.equal(snapshot.wallet.senNgoc,state.wallet.senNgoc+100);
  }
});
test('legacy missing queue repairs earned evidence and supported side without changing wallet', () => {
  const state = ready(); state.journey.c2.solvedPuzzleIds.push(P2);
  state.journey.c2.side = 'mat_trai'; state.features.latVai = true;
  state.journey.c2.completedDialogueIds = [];
  delete state.journey.c2.dialogueQueue;
  const restored = fromJSON(legacyBytes(state),content); assert.ok(restored.ok); if(!restored.ok)return;
  const snapshot = restored.tree.nodes[restored.tree.headId].snapshot;
  assert.equal(snapshot.journey.c2.side,'mat_phai');
  assert.equal(snapshot.journey.c2.activeDialogue?.dialogueId,'d-c2-ca-nghi');
  for (const item of ['bien_lai_tra_no_goc_1935','ban_giao_keo_ep_hon','ban_ve_ao_dai_tan_thoi']) assert.equal(snapshot.inventory.itemIds.filter(id=>id===item).length,1);
  assert.equal(snapshot.wallet.senNgoc,state.wallet.senNgoc);
});
test('legacy unclaimed at S3 can read recovery queue then claim exactly 100 without losing solves', () => {
  const state = ready(); state.journey.c2.currentArea=S3;state.journey.c2.status='completed';
  state.journey.c2.solvedPuzzleIds=[P1,P2,P3,P4,P5];state.journey.c2.completedDialogueIds=[];
  const loaded=fromJSON(legacyBytes(state),content);assert.ok(loaded.ok);if(!loaded.ok)return;
  let tree=loaded.tree;let budget=20;
  while(tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue){
    assert.ok(budget-->0);const advanced=dispatch(tree,{type:'dialogue/advance',payload:{}},content);assert.ok(advanced.ok);if(advanced.ok)tree=advanced.tree;
  }
  const snapshot=tree.nodes[tree.headId].snapshot;
  assert.deepEqual(snapshot.journey.c2.solvedPuzzleIds,[P1,P2,P3,P4,P5]);
  assert.equal(snapshot.journey.c2.currentArea,S3);assert.equal(snapshot.wallet.senNgoc,state.wallet.senNgoc);
  const claimed=dispatch(tree,{type:'reward/claim',payload:{chapterId:'c2'}},content);assert.ok(claimed.ok);
  if(claimed.ok)assert.equal(claimed.tree.nodes[claimed.tree.headId].snapshot.wallet.senNgoc,state.wallet.senNgoc+100);
});
test('Frontend store adapter backs up exact old-version bytes before writing migrated C2', async () => {
  const {restoreGame,saveGame,SAVE_KEY,SAVE_BACKUP_KEY}=await import('../game/store.ts');
  const original=legacyBytes();const bytes=new Map([[SAVE_KEY,original]]);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>bytes.get(key)??null,setItem:(key:string,value:string)=>bytes.set(key,value),
  }});
  try {
    const restored=restoreGame();assert.equal(restored.status,'migrated');
    assert.equal(saveGame(restored.tree),true);assert.equal(bytes.get(SAVE_BACKUP_KEY),original);
    assert.equal(JSON.parse(bytes.get(SAVE_KEY)!).contentVersion,CONTENT_VERSION);
  } finally {delete (globalThis as {localStorage?:unknown}).localStorage;}
});
test('backup write failure leaves old C2 save untouched and reports save failure', async () => {
  const {restoreGame,saveGame,SAVE_KEY,SAVE_BACKUP_KEY}=await import('../game/store.ts');
  const original=legacyBytes();const bytes=new Map([[SAVE_KEY,original]]);const writes:string[]=[];
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>bytes.get(key)??null,setItem:(key:string,value:string)=>{
      writes.push(key);if(key===SAVE_BACKUP_KEY)throw new Error('backup blocked');bytes.set(key,value);
    },
  }});
  try {
    const restored=restoreGame();assert.equal(restored.status,'migrated');
    assert.equal(saveGame(restored.tree),false);assert.equal(bytes.get(SAVE_KEY),original);
    assert.deepEqual(writes,[SAVE_BACKUP_KEY]);
  } finally {delete (globalThis as {localStorage?:unknown}).localStorage;}
});
