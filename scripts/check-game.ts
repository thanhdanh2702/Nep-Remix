import assert from 'node:assert/strict';
import { loadContent } from '../src/content';
import { createInitialState, createInitialTree, dispatch, nearestInteractable, prune, replayPath, toJSON, fromJSON } from '../src/core';
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

// Reachability checks use foot collisions and actual nearest-target priority.
for(const area of content.chapters.prologue.areas) {
  const world=worlds[area.id];assert.ok(canStand(world.spawn,world));
  let initial=createInitialState(content);
  initial={...initial,journey:{...initial.journey,prologue:{...initial.journey.prologue,currentArea:area.id}}};
  const visited=new Set<string>(), queue=[world.spawn];
  for(let index=0;index<queue.length;index++) {
    const p=queue[index];
    for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8]]) {
      const next={x:p.x+dx,y:p.y+dy},key=`${next.x},${next.y}`;
      if(!visited.has(key) && canStand(next,world)){visited.add(key);queue.push(next);}
    }
  }
  for(const target of area.interactables.filter(i=>i.side!=='trai')) {
    const current=structuredClone(initial);
    if(target.id==='hitbox-chest-lock')current.journey.prologue.solvedPuzzleIds=['p-c0-cloth'];
    assert.ok(queue.some(p=>nearestInteractable(current,content,{x:p.x/800,y:p.y/500})===target.id),`Unreachable target ${target.id}`);
  }
}
const world=worlds.hub,p=world.spawn;
const straight=move(p,{x:1,y:0},.04,world),diagonal=move(p,{x:1,y:1},.04,world);
assert.ok(Math.abs(Math.hypot(straight.x-p.x,straight.y-p.y)-Math.hypot(diagonal.x-p.x,diagonal.y-p.y))<.001);
const tableWorld=worlds['c0-s1-tiem-may-chieu'];
assert.deepEqual(move({x:488,y:380},{x:1,y:0},.05,tableWorld),{x:488,y:380});

// A long linear save must remain under 200 nodes and replay after checkpointing.
for(let i=0;i<450;i++){send('profile/update',{name:`An ${i%10}`});tree=prune(tree,200);}
assert.ok(Object.keys(tree.nodes).length<=200);
const replay=replayPath(tree,tree.headId,content);assert.ok(replay.ok && replay.matchesSnapshot);
const restored=fromJSON(toJSON(tree),content);assert.ok(restored.ok);
const previousHead=tree.headId;send('profile/update',{name:'An'});assert.notEqual(tree.headId,previousHead);
assert.equal(Object.keys(tree.nodes).length,201);
console.log('PASS: full prologue, item guards, reward deduplication, normalized input, all interaction paths, collision, diagonal speed, bounded save and replay.');
