import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, runCommand, createInitialTree, dispatch, toJSON, fromJSON, CONTENT_VERSION,
  undo, redo, checkout, revert, replayPath, createChapterReplayTree, getChallengeWardrobe,
  createChallengeStudioDraft, validateChallengeStudioDraft, type GameState, type HistoryTree } from './index.ts';

const content = loadContent();
const [S1,S2,S3] = content.chapters.c3.areas.map(a=>a.id);
const [P1,P2,P3] = content.chapters.c3.puzzles.map(p=>p.id);
const [I1,I2,I3] = ['bien_nhan_tien_thay_boi','so_tu_vi_nguyen_ban_1962','thu_tay_thoa_thuan_boi_toan'];
const D = ['d-c3-mua-chuoc','d-c3-street-exit','d-c3-bagua','d-c3-so-tu-vi','d-c3-thoa-thuan',
  'd-c3-ban-sua','d-c3-vinh-stand','d-c3-ong-le-defeat','d-c3-ending'];
const answer = {silhouette:'tan_thoi',garmentId:'ao-dai-raglan',jewelryId:'kinh-mat-meo',footwearId:'guoc-moc'};
// Isolated command guard fixtures. Full walkthrough below obtains every C3 marker through commands.
function at(stage=0): GameState {
  const s=createInitialState(content);s.currentChapter='c3';
  const p=s.journey.c3; p.status='in_progress';p.currentArea=stage<2?S1:stage<4?S2:S3;
  p.unlockedAreaIds=[S1,S2,S3];p.completedDialogueIds=D.slice(0,stage);
  if(stage>=1)s.inventory.itemIds.push(I1);
  if(stage>=4){p.solvedPuzzleIds=[P1];s.inventory.itemIds.push(I2,I3);}
  if(stage>=7)p.solvedPuzzleIds.push(P2);
  if(stage>=9)p.solvedPuzzleIds.push(P3);
  return s;
}
function rejected(s:GameState,type:string,payload:unknown) {
  const before=structuredClone(s);const r=runCommand(s,{type,payload},content);
  assert.equal(r.ok,false,`${type} must reject`);assert.equal(r.state,s);assert.deepEqual(s,before);
}
function send(s:GameState,type:string,payload:unknown):GameState {
  const r=runCommand(s,{type,payload},content);assert.ok(r.ok,!r.ok?r.reason:'');return r.state;
}
function tap(s:GameState,id:string):GameState {
  const h=content.chapters.c3.areas.find(a=>a.id===s.journey.c3.currentArea)!.interactables.find(i=>i.id===id);
  assert.ok(h,`missing hotspot ${id}`);return send(s,'interact',{targetId:id,playerPos:h.pos});
}
function reload(tree:HistoryTree,version?:string):HistoryTree {
  const e=JSON.parse(toJSON(tree));if(version)e.contentVersion=version;
  const r=fromJSON(JSON.stringify(e),content);assert.ok(r.ok,!r.ok?r.reason:'');return r.tree;
}

test('C3 content contract: three puzzles, right face, no extra paper pickups, reward and fiction text',()=>{
  const c=content.chapters.c3;assert.equal(c.puzzles.length,3);
  assert.equal(c.areas[0].interactables.some(h=>h.action.type==='puzzle'),false);
  for(const a of c.areas){assert.equal(a.sides.trai,false);assert.equal(Object.values(a.exits??{}).includes('prologue'),false);}
  assert.equal(c.areas.flatMap(a=>a.interactables).some(h=>h.action.type==='item'&&[I2,I3].includes(h.action.targetId)),false);
  assert.equal(c.chapter.reward.senNgoc,100);assert.equal(c.chapter.completionDialogueId,D[8]);
  assert.deepEqual(c.chapter.reward.garmentIds,['ao-dai-raglan','ao-dai-co-thuyen']);
  assert.deepEqual(c.chapter.reward.cardIds,['card-ky-thuat-ao-dai-raglan-1960','card-phe-phan-hu-tuc-boi-toan']);
  const text=JSON.stringify(c);assert.doesNotMatch(text,/45 độ|đại cát|giờ Thìn|sát phu/);
  assert.ok(text.includes('Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi.'));
});
for(const stage of [0,1])test(`S1 exit cannot bypass unread receipt/street, stage ${stage}`,()=>rejected(at(stage),'area/goTo',{areaId:S2}));
for(const stage of [0,1,2])test(`lock requires all early readings ${stage}`,()=>{
  const s=at(stage);s.journey.c3.currentArea=S2;
  for(const type of ['puzzle/open','puzzle/submit'])rejected(s,type,{puzzleId:P1,answer:'CAN_TON'});
});
for(const context of ['room','side','chapter','locked'])test(`direct lock submit rejects wrong ${context}`,()=>{
  const s=at(3);if(context==='room')s.journey.c3.currentArea=S1;
  if(context==='side')s.journey.c3.side='mat_trai';if(context==='chapter')s.currentChapter='c2';if(context==='locked')s.journey.c3.status='locked';
  rejected(s,'puzzle/submit',{puzzleId:P1,answer:'CAN_TON'});
});
for(const value of ['','CAN_','TON_CAN','CAN TON',{},[],null,42])test(`invalid code cannot solve ${JSON.stringify(value)}`,()=>{
  const s=at(3);const r=runCommand(s,{type:'puzzle/submit',payload:{puzzleId:P1,answer:value}},content);
  assert.deepEqual(r.state,s);assert.deepEqual(r.state.journey.c3.solvedPuzzleIds,[]);
});
test('chest atomic gifts, ordered unread queue, matching session closes, duplicate refuses',()=>{
  let s=send(at(3),'puzzle/open',{puzzleId:P1});s=send(s,'puzzle/submit',{puzzleId:P1,answer:'CAN_TON'});
  for(const id of [I2,I3])assert.equal(s.inventory.itemIds.filter(i=>i===id).length,1);
  assert.equal(s.activeSession,null);assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[3]);
  assert.deepEqual(s.journey.c3.dialogueQueue,[D[4]]);assert.equal(s.journey.c3.completedDialogueIds.includes(D[3]),false);
  assert.deepEqual(s.notebook.unlockedClueIds,[]);rejected(s,'puzzle/submit',{puzzleId:P1,answer:'CAN_TON'});
});
for(const missing of [D[3],D[4],D[5],I2,I3])test(`present/item-use guarded by ${missing}`,()=>{
  const s=at(6);s.journey.c3.completedDialogueIds=s.journey.c3.completedDialogueIds.filter(id=>id!==missing);
  s.inventory.itemIds=s.inventory.itemIds.filter(id=>id!==missing);
  rejected(s,'puzzle/submit',{puzzleId:P2,answer:I2});rejected(s,'item/use',{itemId:I2,targetPuzzleId:P2});
});
test('unread letter blocks forward and forged back stack',()=>{
  const s=at(4);s.journey.c3.currentArea=S2;s.journey.c3.navStack=[S3];
  rejected(s,'area/goTo',{areaId:S3});rejected(s,'area/goBack',{});
});
test('present rejects wrong item; correct item queues Vinh then Mai',()=>{
  let s=at(6);const wrong=send(s,'puzzle/submit',{puzzleId:P2,answer:I3});assert.deepEqual(wrong,s);
  s=send(s,'item/use',{itemId:I2,targetPuzzleId:P2});assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[6]);
  assert.deepEqual(s.journey.c3.dialogueQueue,[D[7]]);assert.ok(s.inventory.itemIds.includes(I2)&&s.inventory.itemIds.includes(I3));
  rejected(s,'puzzle/open',{puzzleId:P3});
});
for(const type of ['puzzle/solve','puzzle/skip','clue/collect','dialogue/skip'])test(`no shortcut via ${type}`,()=>{
  rejected(at(0),type,{puzzleId:P1,clueId:'clue-bagua-hint'});
});
test('Vinh hotspot and stale active Mai/ending cannot bypass dialogue gates',()=>{
  rejected(at(5),'interact',{targetId:'hitbox-vinh-support',playerPos:content.chapters.c3.areas[2].interactables.find(i=>i.id==='hitbox-vinh-support')!.pos});
  for(const id of [D[7],D[8]]){
    const s=at(6);s.journey.c3.activeDialogue={dialogueId:id as never,currentNodeId:'node-1',history:['node-1']};
    rejected(s,'dialogue/advance',{});rejected(s,'dialogue/choose',{choiceIndex:0});
  }
});
for(const missing of [...D.slice(0,8),I1,I2,I3,P1,P2])test(`styling guards full E: missing ${missing}`,()=>{
  const s=at(8);s.journey.c3.completedDialogueIds=s.journey.c3.completedDialogueIds.filter(id=>id!==missing);
  s.inventory.itemIds=s.inventory.itemIds.filter(id=>id!==missing);s.journey.c3.solvedPuzzleIds=s.journey.c3.solvedPuzzleIds.filter(id=>id!==missing);
  rejected(s,'puzzle/submit',{puzzleId:P3,answer});assert.equal(getChallengeWardrobe(s,P3,content).ok,false);
});
test('loan wardrobe is catalog scoped, draft typed/persistent, cancel does not grant ownership',()=>{
  let s=at(8);s.wallet.senNgoc=0;s.closet.unlockedGarmentIds=[];s.closet.unlockedAccessoryIds=[];
  const w=getChallengeWardrobe(s,P3,content);assert.ok(w.ok);assert.deepEqual(w.borrowedGarmentIds,['ao-dai-raglan']);
  assert.deepEqual(w.borrowedAccessoryIds,['kinh-mat-meo','guoc-moc']);
  const d=createChallengeStudioDraft(s,P3,content);assert.ok(d.ok);
  assert.equal(validateChallengeStudioDraft(s,P3,{...d.draft,challengePuzzleId:P1},content).ok,false);
  assert.equal(validateChallengeStudioDraft(s,P3,{...d.draft,garmentId:'ao-dai-co-thuyen'},content).ok,false);
  s=send(s,'puzzle/open',{puzzleId:P3});s=send(s,'puzzle/updateDraft',{puzzleId:P3,draft:{type:'styling',answer:{...answer,color0:'#112233'}}});
  rejected(s,'puzzle/updateDraft',{puzzleId:P3,draft:{type:'code',answer:'CAN_TON'}});
  rejected(s,'puzzle/submit',{puzzleId:P3,answer:{...answer,jewelryId:'unknown'}});
  s=send(s,'puzzle/close',{});s=reload(createInitialTree(s)).nodes['node-root'].snapshot;
  const resumed=createChallengeStudioDraft(s,P3,content);assert.ok(resumed.ok);assert.equal(resumed.draft.colorPalette[0],'#112233');
  assert.deepEqual(s.closet.unlockedGarmentIds,[]);assert.deepEqual(s.closet.unlockedAccessoryIds,[]);
  assert.equal(getChallengeWardrobe({...s,currentChapter:'c2'},P3,content).ok,false);
});
for(const missing of [...D,I1,I2,I3,P1,P2,P3])test(`complete and pending claim require full F: missing ${missing}`,()=>{
  const s=at(9);s.journey.c3.status='completed';s.journey.c3.completedDialogueIds=s.journey.c3.completedDialogueIds.filter(id=>id!==missing);
  s.inventory.itemIds=s.inventory.itemIds.filter(id=>id!==missing);s.journey.c3.solvedPuzzleIds=s.journey.c3.solvedPuzzleIds.filter(id=>id!==missing);
  rejected(s,'chapter/complete',{chapterId:'c3'});rejected(s,'reward/claim',{chapterId:'c3'});
});
test('command walkthrough, reload between documents, ending acknowledgement, claim/replay/history boundaries',()=>{
  let tree=createInitialTree(at());const s=()=>tree.nodes[tree.headId].snapshot;
  const cmd=(type:string,payload:unknown)=>{const r=dispatch(tree,{type,payload},content);assert.ok(r.ok,!r.ok?r.reason:'');tree=r.tree;};
  const hit=(id:string)=>{const next=tap(s(),id);const h=content.chapters.c3.areas.find(a=>a.id===s().journey.c3.currentArea)!.interactables.find(i=>i.id===id)!;
    cmd('interact',{targetId:id,playerPos:h.pos});assert.deepEqual(s(),next);};
  const ack=()=>cmd('dialogue/advance',{});
  cmd('item/pick',{itemId:I1});assert.deepEqual(s().journey.c3.completedDialogueIds,[]);
  hit('hitbox-c3-read-receipt');ack();hit('hitbox-street-exit');ack();cmd('area/goTo',{areaId:S2});
  hit('hitbox-bagua-mirror');ack();cmd('puzzle/open',{puzzleId:P1});cmd('puzzle/updateDraft',{puzzleId:P1,draft:{type:'code',answer:'CAN_'}});
  cmd('puzzle/close',{});tree=reload(tree);assert.equal(s().journey.c3.puzzleDrafts?.[P1].answer,'CAN_');
  cmd('puzzle/submit',{puzzleId:P1,answer:'CAN_TON'});const solved=tree.headId;
  const undone=undo(tree);assert.ok(undone.ok);assert.equal(undone.tree.nodes[undone.tree.headId].snapshot.journey.c3.solvedPuzzleIds.includes(P1),false);
  const redone=redo(undone.tree);assert.ok(redone.ok);tree=redone.tree;assert.equal(tree.headId,solved);
  tree=reload(tree);ack();tree=reload(tree);assert.equal(s().journey.c3.activeDialogue?.dialogueId,D[4]);
  rejected(s(),'area/goTo',{areaId:S3});ack();cmd('area/goTo',{areaId:S3});hit('hitbox-c3-read-revision');ack();
  cmd('puzzle/submit',{puzzleId:P2,answer:I2});ack();tree=reload(tree);ack();
  cmd('puzzle/submit',{puzzleId:P3,answer});assert.equal(s().journey.c3.activeDialogue?.dialogueId,D[8]);
  rejected(s(),'chapter/complete',{chapterId:'c3'});ack();cmd('chapter/complete',{chapterId:'c3'});
  tree=reload(tree);const before=s().wallet.senNgoc;const beforeClaim=tree.headId;
  cmd('reward/claim',{chapterId:'c3'});assert.equal(s().wallet.senNgoc-before,100);
  for(const id of content.chapters.c3.chapter.reward.garmentIds!)assert.ok(s().closet.unlockedGarmentIds.includes(id));
  for(const id of content.chapters.c3.chapter.reward.cardIds!)assert.ok(s().museum.unlockedCardIds!.includes(id));
  rejected(s(),'reward/claim',{chapterId:'c3'});tree=reload(tree);rejected(s(),'reward/claim',{chapterId:'c3'});
  assert.equal(undo(tree).ok,false);assert.equal(checkout(tree,beforeClaim,content).ok,false);assert.equal(revert(tree,solved,content).ok,false);
  const replay=replayPath(tree,tree.headId,content);assert.ok(replay.ok);assert.equal(replay.matchesSnapshot,true);
  const practice=createChapterReplayTree(tree,'c3',content);assert.ok(practice.ok);assert.equal(practice.tree.replayOfChapter,'c3');
  const rewardAttempt=at(9);rewardAttempt.claimedRewardIds=practice.tree.nodes[practice.tree.headId].snapshot.claimedRewardIds;
  rewardAttempt.journey.c3.status='completed';rejected(rewardAttempt,'reward/claim',{chapterId:'c3'});
});
for(const version of ['sprint-01-core-1','sprint-02-core-1','raw'])test(`legacy ${version} migrates every node, clears old readings, retains solved/items/wallet and is idempotent`,()=>{
  const old=at(9);old.journey.c3.status='completed';old.journey.c3.side='mat_trai';old.journey.c3.activeDialogue={dialogueId:D[8] as never,currentNodeId:'old-node',history:['old-node']};
  old.notebook.unlockedClueIds=['clue-so-tu-vi-goc'];
  let tree=createInitialTree(old);tree.nodes['child']={...structuredClone(tree.nodes[tree.rootId]),id:'child',parentId:tree.rootId,childIds:[]};tree.nodes[tree.rootId].childIds=['child'];tree.headId='child';
  const envelope=JSON.parse(toJSON(tree));envelope.contentVersion=version;
  const r=fromJSON(JSON.stringify(version==='raw'?tree:envelope),content);assert.ok(r.ok,!r.ok?r.reason:'');
  for(const n of Object.values(r.tree.nodes)){
    const p=n.snapshot.journey.c3;assert.equal(p.currentArea,S1);assert.equal(p.side,'mat_phai');assert.deepEqual(p.completedDialogueIds,[]);
    assert.deepEqual(p.solvedPuzzleIds,[P1,P2,P3]);assert.equal(p.status,'completed');assert.equal(p.claimed,false);
    assert.equal(n.snapshot.wallet.senNgoc,old.wallet.senNgoc);assert.equal(p.activeDialogue?.dialogueId===D[8],false);
    assert.deepEqual(n.snapshot.notebook.unlockedClueIds,[]);rejected(n.snapshot,'reward/claim',{chapterId:'c3'});
  }
  assert.deepEqual(reload(r.tree),r.tree);
});
test('legacy solved recovery waits for current readings, then queues without solving or auto-ack',()=>{
  const old=at(9);old.journey.c3.status='completed';let tree=reload(createInitialTree(old),'sprint-02-core-1');
  let s=tree.nodes[tree.headId].snapshot;s=tap(s,'hitbox-c3-read-receipt');s=send(s,'dialogue/advance',{});
  s=tap(s,'hitbox-street-exit');s=send(s,'dialogue/advance',{});s=send(s,'area/goTo',{areaId:S2});
  s=tap(s,'hitbox-bagua-mirror');s=send(s,'dialogue/advance',{});assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[3]);
  s=send(s,'dialogue/advance',{});s=send(s,'dialogue/advance',{});s=send(s,'area/goTo',{areaId:S3});
  s=tap(s,'hitbox-c3-read-revision');s=send(s,'dialogue/advance',{});assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[6]);
  s=send(s,'dialogue/advance',{});assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[7]);
  assert.equal(s.journey.c3.completedDialogueIds.includes(D[8]),false);s=send(s,'dialogue/advance',{});
  assert.equal(s.journey.c3.activeDialogue?.dialogueId,D[8]);rejected(s,'reward/claim',{chapterId:'c3'});
  s=send(s,'dialogue/advance',{});const cash=s.wallet.senNgoc;s=send(s,'reward/claim',{chapterId:'c3'});assert.equal(s.wallet.senNgoc,cash+100);
});
test('legacy claimed150 repairs both garments/cards, preserves money and C4, no forced readings',()=>{
  const s=at(9);s.journey.c3.claimed=true;s.journey.c3.status='completed';s.journey.c3.completedDialogueIds=[];
  s.wallet.senNgoc=250;s.claimedRewardIds=[];s.journey.c4.status='in_progress';
  const tree=reload(createInitialTree(s),'sprint-02-core-1');const r=tree.nodes[tree.headId].snapshot;
  assert.equal(r.wallet.senNgoc,250);assert.equal(r.journey.c4.status,'in_progress');assert.equal(r.journey.c3.activeDialogue,null);
  assert.deepEqual(r.claimedRewardIds,['reward-c3']);assert.ok(r.closet.unlockedGarmentIds.includes('ao-dai-co-thuyen'));
  assert.ok(r.museum.unlockedCardIds!.includes('card-phe-phan-hu-tuc-boi-toan'));assert.deepEqual(reload(tree),tree);
  rejected(r,'reward/claim',{chapterId:'c3'});
});
test('sprint02 C2 snapshot is not migrated again when version bumps',()=>{
  const s=at();s.journey.c2.status='in_progress';s.journey.c2.activeDialogue=null;s.journey.c2.dialogueQueue=[];
  const before=structuredClone(s.journey.c2);const r=reload(createInitialTree(s),'sprint-02-core-1').nodes['node-root'].snapshot;
  assert.deepEqual(r.journey.c2,before);assert.equal(CONTENT_VERSION,'sprint-03-core-1');
});
test('invalid drafts/sessions are repaired per C3; valid partial draft and missing dialogue node survive reload',()=>{
  const s=at(3);s.journey.c3.puzzleDrafts={[P1]:{type:'styling',answer:{garmentId:'unknown'}}};
  s.activeSession={type:'puzzle',puzzleId:P1,chapterId:'c3',puzzleType:'styling',valid:true,data:{},history:[]};
  let r=reload(createInitialTree(s)).nodes['node-root'].snapshot;assert.equal(r.journey.c3.puzzleDrafts?.[P1],undefined);assert.equal(r.activeSession,null);
  const valid=at(3);valid.journey.c3.puzzleDrafts={[P1]:{type:'code',answer:'CAN_'}};
  valid.journey.c3.activeDialogue={dialogueId:D[2] as never,currentNodeId:'deleted',history:['deleted']};
  r=reload(createInitialTree(valid)).nodes['node-root'].snapshot;assert.deepEqual(r.journey.c3.puzzleDrafts,valid.journey.c3.puzzleDrafts);
  assert.equal(r.journey.c3.activeDialogue?.currentNodeId,'node-1');assert.equal(r.journey.c3.solvedPuzzleIds.includes(P1),false);
});
test('legacy solved stages never queue an ending/confrontation before prerequisites',()=>{
  const tree=reload(createInitialTree(at(9)),'sprint-02-core-1');const s=tree.nodes[tree.headId].snapshot;
  assert.equal(s.journey.c3.dialogueQueue!.includes(D[8]),false);
  assert.equal(s.journey.c3.dialogueQueue!.includes(D[6]),false);
  assert.equal(s.journey.c3.dialogueQueue!.includes(D[7]),false);
});
test('current-format stale queue cannot activate or retain early ending',()=>{
  const s=at(6);s.journey.c3.dialogueQueue=[D[8],D[7]];
  const r=reload(createInitialTree(s)).nodes['node-root'].snapshot;
  assert.equal(r.journey.c3.activeDialogue,null);assert.deepEqual(r.journey.c3.dialogueQueue,[]);
});
test('migration clears only invalid C3 Studio session; unrelated studio and valid puzzle draft retained',()=>{
  const s=at(8);const d=createChallengeStudioDraft(s,P3,content);assert.ok(d.ok);
  s.activeSession={...d.draft,garmentId:'unknown'};
  assert.equal(reload(createInitialTree(s)).nodes['node-root'].snapshot.activeSession,null);
  s.activeSession={...d.draft};
  assert.deepEqual(reload(createInitialTree(s)).nodes['node-root'].snapshot.activeSession,s.activeSession);
  delete s.activeSession.challengePuzzleId;
  assert.deepEqual(reload(createInitialTree(s)).nodes['node-root'].snapshot.activeSession,s.activeSession);
});
test('styling draft persists through solve and reload, without leaking loan ownership',()=>{
  let s=at(8);s=send(s,'puzzle/updateDraft',{puzzleId:P3,draft:{type:'styling',answer}});
  s=send(s,'puzzle/submit',{puzzleId:P3,answer});const r=reload(createInitialTree(s)).nodes['node-root'].snapshot;
  assert.deepEqual(r.journey.c3.puzzleDrafts?.[P3],{type:'styling',answer});assert.deepEqual(r.closet,s.closet);
});
test('C3 malformed draft/active dialogue snapshots cannot be checked out or restored by inverse command',()=>{
  const s=at(6);const tree=createInitialTree(s);tree.nodes['node-root'].snapshot.journey.c3.puzzleDrafts={[P2]:{type:'code',answer:'CAN_TON'}};
  assert.equal(checkout(tree,'node-root',content).ok,false);
  const invalid=at(6);invalid.journey.c3.activeDialogue={dialogueId:D[8] as never,currentNodeId:'node-1',history:['node-1']};
  rejected(s,'dialogue/restore',{previousState:invalid});
});
test('claim gifts cannot be removed by inverse snapshot even if ledger is retained',()=>{
  let s=send(at(9),'chapter/complete',{chapterId:'c3'});s=send(s,'reward/claim',{chapterId:'c3'});
  const invalid=structuredClone(s);invalid.closet.unlockedGarmentIds=invalid.closet.unlockedGarmentIds.filter(id=>id!=='ao-dai-raglan');
  rejected(s,'dialogue/restore',{previousState:invalid});
});
for(const draft of [null,[],{}, {type:'code',answer:44}, {type:'present',answer:[I2]},
  {type:'present',answer:'unknown'}, {type:'present',answer:'keo_cat_vai_dong'},
  {type:'styling',answer:[]}, {type:'styling',answer:{color0:1}},
  {type:'styling',answer:{eventContextId:'unknown'}}, {type:'styling',answer:{garmentId:'unknown'}},
  {type:'styling',answer:{garmentId:'ao-dai-co-thuyen'}}, {type:'styling',answer:{silhouette:'tu_than'}},
  {type:'styling',answer:{footwearId:'kinh-mat-meo'}}, {type:'styling',answer:{jewelryId:'unknown'}},
  {type:'styling',answer:{headwearId:'khan-van-den'}}, {type:'styling',answer:{motifId:'unknown'}},
])test(`restore drops malformed/unauthorized draft ${JSON.stringify(draft)}`,()=>{
  const s=at(8);const id=(draft as {type?:string})?.type==='present'?P2:(draft as {type?:string})?.type==='code'?P1:P3;
  s.closet.unlockedAccessoryIds=[];s.journey.c3.puzzleDrafts={[id]:draft as never};
  const r=reload(createInitialTree(s)).nodes['node-root'].snapshot;assert.deepEqual(r.journey.c3.puzzleDrafts,{});
});
for(const [id,draft] of [[P1,{type:'code',answer:''}],[P2,{type:'present',answer:''}],[P2,{type:'present',answer:I2}],
  [P3,{type:'styling',answer:{}}],[P3,{type:'styling',answer:{...answer,headwearId:'',motifId:''}}]])test(`valid stored draft retained ${JSON.stringify(draft)}`,()=>{
  const s=at(8);s.journey.c3.puzzleDrafts={[id as string]:draft as never};
  assert.deepEqual(reload(createInitialTree(s)).nodes['node-root'].snapshot.journey.c3.puzzleDrafts,s.journey.c3.puzzleDrafts);
});
test('malformed C3 puzzle session repairs safely instead of rejecting the entire save',()=>{
  const s=at(3);s.activeSession={type:'puzzle',puzzleId:P1,chapterId:'c3',puzzleType:'code',valid:true,data:null as never};
  assert.equal(reload(createInitialTree(s)).nodes['node-root'].snapshot.activeSession,null);
});
test('C3 new envelope rejects corrupted/unknown version without mutating original bytes',()=>{
  for(const bytes of ['{broken',JSON.stringify({...JSON.parse(toJSON(createInitialTree(at()))),contentVersion:'sprint-99-core-1'})]) {
    assert.equal(fromJSON(bytes,content).ok,false);
  }
});
test('undo/redo around ending and completion never acknowledges or claims on behalf of player',()=>{
  let s=send(at(8),'puzzle/submit',{puzzleId:P3,answer});let tree=createInitialTree(s);
  const r=dispatch(tree,{type:'dialogue/advance',payload:{}},content);assert.ok(r.ok);tree=r.tree;
  const back=undo(tree);assert.ok(back.ok);const waiting=back.tree.nodes[back.tree.headId].snapshot;
  assert.equal(waiting.journey.c3.activeDialogue?.dialogueId,D[8]);assert.equal(waiting.journey.c3.completedDialogueIds.includes(D[8]),false);
  rejected(waiting,'chapter/complete',{chapterId:'c3'});
  tree=redo(back.tree).tree;const completed=dispatch(tree,{type:'chapter/complete',payload:{chapterId:'c3'}},content);assert.ok(completed.ok);
  const beforeComplete=undo(completed.tree);assert.ok(beforeComplete.ok);s=beforeComplete.tree.nodes[beforeComplete.tree.headId].snapshot;
  rejected(s,'reward/claim',{chapterId:'c3'});assert.equal(s.wallet.senNgoc,at(8).wallet.senNgoc);
});
test('locked C3 cannot collect/read through interact, including the item/pick alternative',()=>{
  const s=at();s.journey.c3.status='locked';const h=content.chapters.c3.areas[0].interactables.find(h=>h.action.targetId===I1)!;
  rejected(s,'interact',{targetId:h.id,playerPos:h.pos});rejected(s,'item/pick',{itemId:I1});
});
test('legacy chest solve repairs both earned papers without granting receipt, loans, reading or money',()=>{
  const s=at(9);s.inventory.itemIds=s.inventory.itemIds.filter(id=>![I1,I2,I3].includes(id));s.wallet.senNgoc=17;
  const r=reload(createInitialTree(s),'sprint-02-core-1').nodes['node-root'].snapshot;
  assert.equal(r.inventory.itemIds.includes(I1),false);assert.ok(r.inventory.itemIds.includes(I2)&&r.inventory.itemIds.includes(I3));
  assert.equal(r.wallet.senNgoc,17);assert.deepEqual(r.closet,s.closet);assert.deepEqual(r.journey.c3.completedDialogueIds,[]);
  assert.equal(r.journey.c3.activeDialogue,null);assert.deepEqual(r.journey.c3.dialogueQueue,[]);
});
