import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadContent } from '../src/content';
import { createInitialState, createInitialTree, dispatch, prune, replayPath, toJSON, fromJSON } from '../src/core';
import { worlds, canStand, move } from '../src/game/physics';

const content=loadContent();
let tree=createInitialTree(createInitialState(content));
const state=()=>tree.nodes[tree.headId].snapshot;
function send(type:string,payload:unknown) {
  const result=dispatch(tree,{type,payload},content);
  assert.equal(result.ok,true, !result.ok ? result.reason : '');
  if(result.ok)tree=result.tree;
}
assert.equal(dispatch(tree,{type:'puzzle/submit',payload:{puzzleId:'p-c0-chest-unlock',answer:'chia_khoa_dong_ba_chau'}},content).ok,false);
assert.equal(dispatch(tree,{type:'interact',payload:{targetId:'hitbox-cat',playerPos:{x:NaN,y:1}}},content).ok,false);
send('area/goTo',{areaId:'c0-s2-gac-xep-chiec-ruong'});
assert.equal(dispatch(tree,{type:'puzzle/submit',payload:{puzzleId:'p-c0-mannequin-hand',answer:'kim_gut_bang_bac'}},content).ok,false);
send('puzzle/submit',{puzzleId:'p-c0-cloth',answer:'interact'});
send('interact',{targetId:'hitbox-sewing-basket',playerPos:{x:.835,y:.784}});
send('puzzle/submit',{puzzleId:'p-c0-mannequin-hand',answer:'kim_gut_bang_bac'});
send('puzzle/submit',{puzzleId:'p-c0-chest-unlock',answer:'chia_khoa_dong_ba_chau'});
assert.equal(state().journey.prologue.activeDialogue?.dialogueId,'d-c0-ba-dan-do');
assert.ok(!state().notebook.unlockedClueIds.includes('clue-ba-dan-do'));
while(state().journey.prologue.activeDialogue) send('dialogue/advance',{});
assert.ok(state().notebook.unlockedClueIds.includes('clue-ba-dan-do'));
send('chapter/complete',{chapterId:'prologue'});send('reward/claim',{chapterId:'prologue'});
assert.equal(state().wallet.senNgoc,150);
assert.equal(dispatch(tree,{type:'reward/claim',payload:{chapterId:'prologue'}},content).ok,false);

// Chapter 1 walk-through: pick -> combine -> use -> clues -> present -> styling -> complete, only through dispatch.
const c1=content.chapters.c1,c1Progress=()=>state().journey.c1;
const c1Area=(id:string)=>c1.areas.find(a=>a.id===id)!;
const tapAt=(areaId:string,targetId:string)=>send('interact',{targetId,playerPos:c1Area(areaId).interactables.find(i=>i.id===targetId)!.pos});
const readDialogue=(id:string)=>{
  assert.equal(c1Progress().activeDialogue?.dialogueId,id,`dialogue ${id} should be open`);
  let steps=0;while(c1Progress().activeDialogue){send('dialogue/advance',{});steps++;}
  assert.ok(steps>=2,`dialogue ${id} must have at least 2 nodes`);
  assert.ok(c1Progress().completedDialogueIds.includes(id));
};
const S1='c1-s1-buong-det-khoa-kin',S2='c1-s2-ban-tho-nha-tho-ho',S3='c1-s3-cong-dinh-doi-dau';
const clues=['clue-tiet-hanh-kha-phong','clue-thu-chong-cu-cam','clue-van-tu-ban-dat'];
assert.ok(c1.dialogues.every(d=>d.nodes.length>=2),'every c1 dialogue has >= 2 nodes');
assert.equal(c1.chapter.completionDialogueId,'d-c1-gate-exit');
assert.ok(c1.areas.every(a=>a.interactables.every(i=>i.side==='phai')),'c1 has no --trai art: every interactable is on the phai side');
for(const a of c1.areas) { // rects and arrows must be the ones drawn by scripts/pixel/draw-c1-rooms.py
  const layout=JSON.parse(readFileSync(`assets/areas/chapter-1/${a.id}/layout.json`,'utf8')) as {interactables:Record<string,{x:number;y:number;w:number;h:number}>;exits:Record<string,{dir:string}>};
  for(const i of a.interactables) {
    const r=layout.interactables[i.id];assert.ok(r&&i.rect,`rect missing for ${a.id}/${i.id}`);
    for(const k of ['x','y','w','h'] as const)assert.ok(Math.abs(i.rect![k]-r[k])<1e-4,`${a.id}/${i.id}.rect.${k} differs from layout.json`);
  }
  for(const key of Object.keys(a.exits)) {
    const arrow=a.exitArrows?.find(x=>x.exit===key);
    assert.ok(arrow,`exit ${key} of ${a.id} has no arrow`);assert.equal(arrow!.dir,layout.exits[key].dir,`arrow dir of ${a.id}/${key}`);
    assert.ok(c1.areas.some(x=>x.id===a.exits[key]),`exit ${key} of ${a.id} must lead to a c1 area`);
  }
}
send('chapter/enter',{chapterId:'c1'});
assert.equal(c1Progress().currentArea,S1);
assert.equal(dispatch(tree,{type:'chapter/complete',payload:{chapterId:'c1'}},content).ok,false,'cannot complete with unsolved puzzles');
tapAt(S1,'hitbox-cold-porridge');readDialogue('d-c1-porridge');
tapAt(S1,'hitbox-front-door');readDialogue('d-c1-locked-door');
tapAt(S1,'hitbox-loom-shuttle');tapAt(S1,'hitbox-belt-rack');
assert.ok(['con_thoi_go_mun','that_lung_lua_cham'].every(id=>state().inventory.itemIds.includes(id)));
assert.equal(dispatch(tree,{type:'area/goTo',payload:{areaId:S2}},content).ok,false,'s2 stays locked until the shutter is opened');
send('item/combine',{itemIds:['con_thoi_go_mun','that_lung_lua_cham']});
assert.ok(state().inventory.itemIds.includes('dung_cu_moc_then_cua'));
send('item/use',{itemId:'dung_cu_moc_then_cua',targetPuzzleId:'p-c1-escape'});
assert.ok(c1Progress().solvedPuzzleIds.includes('p-c1-escape'));
send('area/goTo',{areaId:S2});
tapAt(S2,'hitbox-honor-plaque');readDialogue('d-c1-tiet-hanh');
tapAt(S2,'hitbox-incense-burner');readDialogue('d-c1-incense');
// puzzle/submit: wrong answer leaves state untouched; right answer grants every reward, opens the dialogue and unlocks s3
assert.equal(dispatch(tree,{type:'area/goTo',payload:{areaId:S3}},content).ok,false,'s3 stays locked until the altar threads are cut');
const beforeAltar=JSON.stringify([c1Progress(),state().inventory,state().notebook]);
send('puzzle/submit',{puzzleId:'p-c1-altar-cut-threads',answer:'con_thoi_go_mun'});
assert.equal(JSON.stringify([c1Progress(),state().inventory,state().notebook]),beforeAltar,'wrong answer must not change state');
send('puzzle/submit',{puzzleId:'p-c1-altar-cut-threads',answer:'keo_may_bang_dong'});
assert.ok(['buc_thu_tay_chong_cu_Cam','to_van_tu_cam_co_dat'].every(id=>state().inventory.itemIds.includes(id)),'altar grants both evidence items');
assert.ok(c1Progress().unlockedAreaIds.includes(S3));
const afterAltar=JSON.stringify([state().inventory,state().notebook]);
const resubmit=dispatch(tree,{type:'puzzle/submit',payload:{puzzleId:'p-c1-altar-cut-threads',answer:'keo_may_bang_dong'}},content);
console.log('resubmit object:', resubmit);
assert.ok(!resubmit.ok&&/đã được giải/.test(resubmit.reason),'resubmit is rejected with a Vietnamese reason');
assert.equal(JSON.stringify([state().inventory,state().notebook]),afterAltar,'resubmit must not double rewards');
readDialogue('d-c1-thu-chong');
send('area/goTo',{areaId:S3});
send('puzzle/submit',{puzzleId:'p-c1-present-contract',answer:'buc_thu_tay_chong_cu_Cam'});
assert.ok(!c1Progress().solvedPuzzleIds.includes('p-c1-present-contract'),'wrong evidence does not solve the contract puzzle');
send('puzzle/submit',{puzzleId:'p-c1-present-contract',answer:'to_van_tu_cam_co_dat'});
send('puzzle/submit',{puzzleId:'p-c1-present-letter',answer:'buc_thu_tay_chong_cu_Cam'});
send('puzzle/submit',{puzzleId:'p-c1-styling-cam',answer:{silhouette:'ngu_than_tay_chen',garmentId:'ao-ngu-than-tay-chen',headwearId:'khan-van-den',footwearId:'guoc-moc'}});
tapAt(S3,'hitbox-stone-step');readDialogue('d-c1-giai-phong');
assert.ok(clues.every(id=>state().notebook.unlockedClueIds.includes(id)),'all c1 clues collected');
assert.ok(c1.puzzles.every(p=>c1Progress().solvedPuzzleIds.includes(p.id)),'all c1 puzzles solved');
tapAt(S3,'hitbox-village-gate-exit');readDialogue(c1.chapter.completionDialogueId!);
const walletBefore=state().wallet.senNgoc;
send('chapter/complete',{chapterId:'c1'});send('reward/claim',{chapterId:'c1'});
assert.equal(c1Progress().status,'completed');assert.equal(state().wallet.senNgoc,walletBefore+c1.chapter.reward.senNgoc);
assert.equal(dispatch(tree,{type:'reward/claim',payload:{chapterId:'c1'}},content).ok,false);
console.log('PASS: chapter 1 walk-through (pick, combine, use, plural puzzle rewards, clues, present, styling, completion dialogue, claim once).');

// Point-and-click rooms: every hit rect stays inside the 8:5 stage and every exit arrow resolves.
const inUnit=(r:{x:number;y:number;w:number;h:number})=>r.x>=0&&r.y>=0&&r.w>=0&&r.h>=0&&r.x+r.w<=1&&r.y+r.h<=1;
for(const chapter of Object.values(content.chapters))for(const area of chapter.areas) {
  for(const target of area.interactables)assert.ok(!target.rect||inUnit(target.rect),`Rect out of [0,1] on ${area.id}/${target.id}`);
  for(const arrow of area.exitArrows??[]) {
    assert.ok(arrow.exit in area.exits,`Exit arrow ${arrow.exit} not in exits of ${area.id}`);
    assert.ok(!arrow.via||area.interactables.some(i=>i.id===arrow.via),`Exit arrow via ${arrow.via} missing on ${area.id}`);
    assert.ok(inUnit(arrow.rect),`Exit arrow rect out of [0,1] on ${area.id}`);
  }
}
// Hub: spawn is standable and diagonal movement is normalized.
const world=worlds.hub;assert.ok(canStand(world.spawn,world));const p=world.spawn;
const straight=move(p,{x:1,y:0},.04,world),diagonal=move(p,{x:1,y:1},.04,world);
assert.ok(Math.abs(Math.hypot(straight.x-p.x,straight.y-p.y)-Math.hypot(diagonal.x-p.x,diagonal.y-p.y))<.001);

// A long linear save must remain under 200 nodes and replay after checkpointing.
for(let i=0;i<450;i++){send('profile/update',{name:`An ${i%10}`});tree=prune(tree,200);}
assert.ok(Object.keys(tree.nodes).length<=200);
const replay=replayPath(tree,tree.headId,content);assert.ok(replay.ok && replay.matchesSnapshot);
const restored=fromJSON(toJSON(tree),content);assert.ok(restored.ok);
const previousHead=tree.headId;send('profile/update',{name:'An'});assert.notEqual(tree.headId,previousHead);
assert.equal(Object.keys(tree.nodes).length,201);
console.log('PASS: full prologue, item guards, reward deduplication, normalized input, room hit rects and exit arrows, hub collision, diagonal speed, bounded save and replay.');
