import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadContent } from '../content/index.ts';
import { createInitialState, runCommand } from './index.ts';
import { transformSync } from 'esbuild';

// Node cannot load assets.ts's Vite import.meta.glob. Execute the actual walker
// source with only its unused rendering-atlas import omitted; no movement logic
// is copied or mocked. cellFor is outside this geometry suite.
const walkerSource = readFileSync(new URL('../game/room-walker.ts', import.meta.url),'utf8')
  .replace(/^import .* from '\.\/assets';\n/, '');
const walkerModule = transformSync(walkerSource,{loader:'ts',format:'esm',target:'es2022'});
const { standClear, targetFor, tick, newWalker, WALK_SPEED } = await import(
  `data:text/javascript;base64,${Buffer.from(walkerModule.code).toString('base64')}`
) as typeof import('../game/room-walker.ts');

// Native measurements supplied by Frontend b6bb71a, not placeholder hitboxes.
// Import the real pure walker; RoomScene's C2 floor and STAND_GAP are adapter inputs.
const content = loadContent();
const areas = content.chapters.c2.areas;
const world = { w: 1672, h: 941 };
const floor = { top: .58 * world.h, bottom: .92 * world.h };
const placements = [
  [[.380,.469,.35,.43,.06,.08], [.606,.574,.58,.53,.06,.09], [.090,.454,.06,.41,.06,.09], [.767,.502,.74,.46,.06,.09], [.219,.409,.18,.28,.08,.25]],
  [[.248,.425,.21,.32,.08,.24], [.550,.400,.42,.22,.26,.35], [.837,.511,.74,.37,.20,.28]],
  [[.755,.634,.66,.44,.20,.38], [.294,.413,.26,.28,.08,.25], [.450,.650,.38,.50,.16,.32]],
];
const manifest = JSON.parse(readFileSync(new URL('../../assets/areas/chapter-2/manifest.json', import.meta.url), 'utf8'));

test('C2 layout uses background A native metadata and measured floor spawns', () => {
  assert.equal(manifest.version,4); assert.equal(manifest.backgroundChoice,'A');
  const backgrounds = manifest.assets.filter((a: {path:string}) => /--phai\.png$/.test(a.path));
  assert.equal(backgrounds.length,3);
  backgrounds.forEach((a: {width:number;height:number}) => assert.deepEqual([a.width,a.height],[1672,941]));
  areas.forEach((area,n) => {
    assert.deepEqual(area.logicalSize,world);
    assert.deepEqual(area.spawn,[{x:.25,y:.75},{x:.15,y:.75},{x:.12,y:.75}][n]);
    assert.ok(area.spawn.y>=.58 && area.spawn.y<=.92);
    assert.deepEqual(area.sides,{phai:true,trai:false});
  });
});

for (const [n,area] of areas.entries()) for (const [k,spot] of area.interactables.entries()) {
  test(`native placement and real walker reach both approaches: ${spot.id}`, () => {
    const [x,y,rx,ry,w,h] = placements[n][k];
    assert.deepEqual(spot.pos,{x,y}); assert.deepEqual(spot.rect,{x:rx,y:ry,w,h});
    const state = createInitialState(content); state.currentChapter='c2';
    const puzzles = content.chapters.c2.puzzles.map(p=>p.id);
    const index = spot.action.type==='puzzle' ? puzzles.indexOf(spot.action.targetId) : puzzles.length;
    Object.assign(state.journey.c2,{status:'in_progress',currentArea:area.id,side:'mat_phai',
      completedDialogueIds:['d-c2-ca-nghi','d-c2-mat-ma','d-c2-bien-lai','d-c2-giao-keo'],
      solvedPuzzleIds:puzzles.slice(0,index)});
    state.inventory.itemIds.push(...['manh_ban_ve_ao_dai_1','manh_ban_ve_ao_dai_2','manh_ban_ve_ao_dai_3','manh_ban_ve_ao_dai_4','chia_khoa_ket_sat_bang_thau','bien_lai_tra_no_goc_1935','ban_giao_keo_ep_hon','ban_ve_ao_dai_tan_thoi'] as const);
    for (const fromX of [.05,.95]) {
      const from = {x:fromX*world.w,y:area.spawn.y*world.h};
      const aim = targetFor({x:rx*world.w,y:ry*world.h,w:w*world.w,h:h*world.h},from,floor,world.w,.045*world.w);
      const to = standClear(area.id,aim.to,floor,world);
      assert.ok(to.y>=floor.top && to.y<=floor.bottom);
      let walker: import('../game/room-walker.ts').Walker = {...newWalker(from),goal:{to,face:aim.face}};
      let arrived = false;
      for(let frame=0;frame<1000 && !arrived;frame++) ({walker,arrived}=tick(walker,.05,WALK_SPEED*world.w));
      assert.ok(arrived,'walker must arrive using real tick');
      // Guard currently uses 800×500; also require native radius reach, so the
      // content does not depend on RoomScene spoofing playerPos as spot.pos.
      assert.ok(Math.hypot(x*world.w-to.x,y*world.h-to.y)<=spot.radius*world.w,
        `native radius ${spot.radius} does not reach walker feet ${JSON.stringify(to)}`);
      const result=runCommand(state,{type:'interact',payload:{targetId:spot.id,playerPos:{x:to.x/world.w,y:to.y/world.h}}},content);
      assert.ok(result.ok,!result.ok?result.reason:'');
    }
    const far = runCommand(state,{type:'interact',payload:{targetId:spot.id,playerPos:{x:x<.5?1:0,y:1}}},content);
    assert.equal(far.ok,false); if(!far.ok) assert.match(far.reason,/too far/);
  });
}

test('C2 measured exits exist; expanded mobile piece 4 target does not overlap S1 arrow', () => {
  const expected = [
    [{exit:'window',rect:{x:.88,y:.20,w:.10,h:.55},dir:'right'}],
    [{exit:'back',rect:{x:0,y:.45,w:.08,h:.45},dir:'left'},{exit:'hall',rect:{x:.92,y:.35,w:.08,h:.45},dir:'right'}],
    [{exit:'back',rect:{x:0,y:.45,w:.08,h:.45},dir:'left'}],
  ];
  areas.forEach((a,n) => assert.deepEqual(a.exitArrows,expected[n]));
  const piece = areas[0].interactables.find(i=>i.id==='hitbox-french-window')!.rect!;
  const exit = areas[0].exitArrows![0].rect;
  for(const width of [390,844,768,1280,1440]) {
    const right = (piece.x+piece.w/2)*width + Math.max(44,piece.w*width)/2;
    const left = (exit.x+exit.w/2)*width - Math.max(44,exit.w*width)/2;
    assert.ok(right<left,`44px targets overlap at stage width ${width}`);
  }
});

test('S2 floor exit does not intercept safe clicks after 44px touch expansion', () => {
  const safe=areas[1].interactables.find(i=>i.id==='hitbox-iron-safe')!.rect!;
  const arrow=areas[1].exitArrows!.find(a=>a.exit==='hall')!.rect;
  for(const width of [300,390,844,768,1280,1440]) {
    const height=width*941/1672;
    const safeBottom=(safe.y+safe.h/2)*height+Math.max(44,safe.h*height)/2;
    const arrowTop=(arrow.y+arrow.h/2)*height-Math.max(44,arrow.h*height)/2;
    assert.ok(safeBottom<arrowTop,`exit intercepts safe at stage width ${width}`);
  }
});
