import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadContent } from '../content/index.ts';
import { ChapterContentSchema } from '../content/schema.ts';
import { createInitialState, runCommand } from './index.ts';
import { transformSync } from 'esbuild';

// Node cannot load assets.ts's Vite import.meta.glob. Execute the actual walker
// source with only its unused rendering-atlas import omitted; no movement logic
// is copied or mocked. cellFor is outside this geometry suite.
// Explicit opt-in to a committed FE implementation. Missing revisions fail loudly;
// never read a different worktree or fall back to local source after a git error.
const movementRevision = process.env.C2_MOVEMENT_REVISION;
const sourceAt = (path: string) => movementRevision
  ? execFileSync('git',['show',`${movementRevision}:${path}`],{cwd:new URL('../..',import.meta.url),encoding:'utf8'})
  : readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const walkerSource = sourceAt('src/game/room-walker.ts')
  .replace(/^import .* from '\.\/assets';\n/, '');
const walkerModule = transformSync(walkerSource,{loader:'ts',format:'esm',target:'es2022'});
const movement = await import(
  `data:text/javascript;base64,${Buffer.from(walkerModule.code).toString('base64')}`
) as typeof import('../game/room-walker.ts');
const { standClear, targetFor, tick, newWalker, WALK_SPEED } = movement;
if(movementRevision) console.log(`C2 movement revision: ${execFileSync('git',['rev-parse',`${movementRevision}^{commit}`],{encoding:'utf8'}).trim()}`);

// Native measurements supplied by Frontend b6bb71a, not placeholder hitboxes.
// Import the real pure walker; RoomScene's C2 floor and STAND_GAP are adapter inputs.
const contentRevision = process.env.C2_CONTENT_REVISION;
const baseContent = loadContent();
// Compare committed integration content without merging it or mutating cached content.
// Catalog/commands stay those of this checkout; this is a cross-revision probe,
// not a claim that the integrated checkout's full suite has run.
const content = contentRevision ? { ...baseContent, chapters: { ...baseContent.chapters,
  c2: ChapterContentSchema.parse(JSON.parse(execFileSync('git',['show',`${contentRevision}:src/content/chapters/c2.json`],{encoding:'utf8'}))) }
} : baseContent;
if(contentRevision) console.log(`C2 content revision: ${execFileSync('git',['rev-parse',`${contentRevision}^{commit}`],{encoding:'utf8'}).trim()}`);
const areas = content.chapters.c2.areas;
const world = { w: 1672, h: 941 };
const floor = { top: .58 * world.h, bottom: .92 * world.h };
const placements = [
  [[.380,.469,.35,.43,.06,.08], [.606,.574,.58,.53,.06,.09], [.090,.454,.06,.41,.06,.09], [.767,.502,.74,.46,.06,.09], [.219,.409,.18,.28,.08,.25]],
  [[.248,.425,.21,.32,.08,.24], [.550,.400,.42,.22,.26,.35], [.837,.511,.739,.37,.201,.28]],
  [[.755,.634,.657,.44,.203,.39], [.294,.413,.26,.28,.08,.25], [.450,.650,.38,.50,.16,.32]],
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
    [{exit:'back',rect:{x:0,y:.45,w:.08,h:.45},dir:'left'},{exit:'hall',rect:{x:.92,y:.76,w:.08,h:.14},dir:'right'}],
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

test('measured hit rects contain manifest visible bounds (one native pixel rounding tolerance)', () => {
  const suffixes: Record<string,string> = {
    'hitbox-drawing-desk':'--manh-1.png','hitbox-fabric-basket':'--manh-2.png',
    'hitbox-gas-lamp':'--manh-3.png','hitbox-french-window':'--manh-4.png',
    'hitbox-drawing-easel':'--ban-ve-ghep.png','hitbox-grandfather-clock':'--chia-khoa.png',
    'hitbox-iron-safe':'--ket-mo.png','hitbox-reporters-crowd':'--nguoi-nghe.png',
    'hitbox-ong-le-shadow':'--ban-ve-treo.png',
  };
  for(const area of areas) for(const spot of area.interactables) {
    const suffix=suffixes[spot.id]; if(!suffix) continue; // shelf/podium are painted into background A
    const asset=manifest.assets.find((a:{path:string})=>a.path.endsWith(suffix)); assert.ok(asset);
    const [left,top,right,bottom]=asset.bounds; const r=spot.rect!;
    assert.ok(r.x*world.w<=left+1 && r.y*world.h<=top+1
      && (r.x+r.w)*world.w>=right-1 && (r.y+r.h)*world.h>=bottom-1,
      `${spot.id} clips manifest visible bounds`);
  }
});

// Adapter audit is opt-in because the FE revision is not merged into this branch.
// Execute exact source blocks; do not reimplement entry/arrival formulas here.
if (movementRevision) {
  const roomSource = sourceAt('src/game/RoomScene.tsx');
  const slice = (start: string, end: string) => {
    const a=roomSource.indexOf(start), b=roomSource.indexOf(end,a);
    assert.ok(a>=0 && b>a,`FE adapter source boundary changed: ${start}`);
    return roomSource.slice(a,b);
  };
  const scaleCode=transformSync(sourceAt('src/game/character-scale.ts'),{loader:'ts',format:'esm'}).code;
  const { HUMAN_HEIGHT }=await import(`data:text/javascript;base64,${Buffer.from(scaleCode).toString('base64')}`);
  assert.deepEqual({top:HUMAN_HEIGHT.c2.floorTop*world.h,bottom:HUMAN_HEIGHT.c2.floorBottom*world.h},floor,
    'FE floor changed: update the explicitly audited geometry inputs before using this suite');
  const definitions=slice('const floorOf =','// Every loaded view');
  const initialize=slice('    const entry = effectiveExitArrows.find','    const folder =');
  const go=slice('  const go = (i: Interactable) => {','  const hover =');
  const adapterCode=transformSync(`export function adapter(env) {
    const { HUMAN_HEIGHT, area, areaId, chapterId, effectiveExitArrows, prevArea, scene, world,
      walker, interact, pending, prefersReducedMotion, stop, paint, run,
      clampToFloor, newWalker, standClear, targetFor, arriveNow }=env;
    ${slice('const STAND_GAP =','const floorOf =')}
    ${definitions}
    ${go}
    return { initialize() { ${initialize} }, go };
  }`,{loader:'ts',format:'esm'}).code;
  const { adapter }=await import(`data:text/javascript;base64,${Buffer.from(adapterCode).toString('base64')}`);
  for(const area of areas) test(`FE ${movementRevision} spawn/return and both arrival modes: ${area.id}`,()=>{
    const origins: {x:number;y:number}[]=[];
    for(const previous of [undefined,...Object.values(area.exits)]) {
      const walker: {current: import('../game/room-walker.ts').Walker|null}={current:null};
      const instance=adapter({ ...movement,HUMAN_HEIGHT,area,areaId:area.id,chapterId:'c2',world,
        effectiveExitArrows:area.exitArrows,prevArea:{current:previous},scene:'c2',walker,
        interact:{current:()=>{}},pending:{current:null},prefersReducedMotion:()=>false,
        stop:()=>{},paint:()=>{},run:()=>{} });
      instance.initialize();assert.ok(walker.current);
      origins.push({x:walker.current.x,y:walker.current.y});
      assert.ok(walker.current.y>=floor.top && walker.current.y<=floor.bottom);
      if(previous===undefined) assert.deepEqual(origins.at(-1),standClear(area.id,
        movement.clampToFloor({x:area.spawn.x*world.w,y:area.spawn.y*world.h},floor,world.w),floor,world));
    }
    origins.push({x:.05*world.w,y:.75*world.h},{x:.95*world.w,y:.75*world.h});
    for(const spot of area.interactables) for(const from of origins) for(const reduced of [false,true]) {
      const state=createInitialState(content);state.currentChapter='c2';
      const ids=content.chapters.c2.puzzles.map(p=>p.id);
      const index=spot.action.type==='puzzle'?ids.indexOf(spot.action.targetId):ids.length;
      Object.assign(state.journey.c2,{status:'in_progress',currentArea:area.id,side:'mat_phai',
        completedDialogueIds:['d-c2-ca-nghi','d-c2-mat-ma','d-c2-bien-lai','d-c2-giao-keo'],solvedPuzzleIds:ids.slice(0,index)});
      state.inventory.itemIds.push('chia_khoa_ket_sat_bang_thau','bien_lai_tra_no_goc_1935','ban_ve_ao_dai_tan_thoi');
      const walker={current:newWalker(from)};
      const pending: {current:null|{id:string;fire:()=>void}}={current:null};
      let calls=0;
      const instance=adapter({...movement,HUMAN_HEIGHT,area,areaId:area.id,chapterId:'c2',world,scene:'c2',walker,pending,
        prefersReducedMotion:()=>reduced,stop:()=>{pending.current=null;},paint:()=>{},run:()=>{},
        interact:{current:(id:string,feet:{x:number;y:number})=>{
          calls++;assert.equal(id,spot.id);
          assert.deepEqual(feet,{x:walker.current.x/world.w,y:walker.current.y/world.h});
          const result=runCommand(state,{type:'interact',payload:{targetId:id,playerPos:feet}},content);
          assert.ok(result.ok,`${spot.id} from ${JSON.stringify(from)} reduced=${reduced}: ${!result.ok?result.reason:''}`);
        }} });
      instance.go(spot);
      if(!reduced) {
        assert.equal(calls,0);
        let arrived=false;
        for(let frame=0;frame<1000 && !arrived;frame++) ({walker:walker.current,arrived}=tick(walker.current,.05,WALK_SPEED*world.w));
        assert.ok(arrived);assert.ok(pending.current);pending.current.fire();
      }
      assert.equal(calls,1);
    }
  });

  // Optional acceptance gate for Tester 9d32c34's normal-motion reproducers.
  // These remain RED until FE routes around furniture; do not fix with radius.
  if(process.env.C2_CHECK_PATH_CLEARANCE==='1') for(const scenario of [
    {area:areas[0],start:'hitbox-gas-lamp',end:'hitbox-french-window',bug:'C2-GEO-002',
      footprint:{x:.30,y:.40,w:.19,h:.285}},
    {area:areas[1],start:'hitbox-grandfather-clock',end:'hitbox-iron-safe',bug:'C2-GEO-004',
      footprint:{x:.36,y:.21,w:.32,h:.497}},
  ]) test(`${scenario.bug}: actual FE go/tick path stays outside audited furniture`,()=>{
    const {area}=scenario;const walker={current:newWalker({x:area.spawn.x*world.w,y:area.spawn.y*world.h})};
    const pending:{current:null|{id:string;fire:()=>void}}={current:null};
    let reduced=true;
    const instance=adapter({...movement,HUMAN_HEIGHT,area,areaId:area.id,chapterId:'c2',world,scene:'c2',walker,pending,
      prefersReducedMotion:()=>reduced,stop:()=>{pending.current=null;},paint:()=>{},run:()=>{},interact:{current:()=>{}}});
    instance.go(area.interactables.find(i=>i.id===scenario.start)!);
    const from={x:walker.current.x,y:walker.current.y};
    reduced=false;instance.go(area.interactables.find(i=>i.id===scenario.end)!);
    let arrived=false;const clipped:{x:number;y:number}[]=[];const r=scenario.footprint;
    for(let frame=0;frame<1000 && !arrived;frame++) {
      ({walker:walker.current,arrived}=tick(walker.current,.05,WALK_SPEED*world.w));
      const {x,y}=walker.current;
      if(x>=r.x*world.w && x<=(r.x+r.w)*world.w && y>=r.y*world.h && y<=(r.y+r.h)*world.h) clipped.push({x,y});
    }
    assert.ok(arrived);
    assert.equal(clipped.length,0,`${scenario.bug}: from ${JSON.stringify(from)} crossed furniture ${clipped.length} ticks; first ${JSON.stringify(clipped[0])}`);
  });
}
