import assert from 'node:assert/strict';
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
assert.ok(state().notebook.unlockedClueIds.includes('clue-ba-dan-do'));
send('dialogue/advance',{});send('chapter/complete',{chapterId:'prologue'});send('reward/claim',{chapterId:'prologue'});
assert.equal(state().wallet.senNgoc,150);
assert.equal(dispatch(tree,{type:'reward/claim',payload:{chapterId:'prologue'}},content).ok,false);

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
