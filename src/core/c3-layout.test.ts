import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { transformSync } from 'esbuild';
import { loadContent } from '../content/index.ts';
import type { Area, Interactable, ExitArrow } from '../content/schema.ts';
import { createInitialState, runCommand, createInitialTree, toJSON, fromJSON } from './index.ts';

// Reviewed Leader numeric snapshot plus corrected FE handoff (demo readiness review).
// Snapshot walker a7af192… was re-reviewed after FE changed only findPath boundary
// tolerance to 1e-4 (current fingerprint below); all computedArrivals are unchanged.
// FE helper probes are explicit: C3_MOVEMENT_CHECKOUT=/absolute/FE/checkout.
// Geometry suite requires explicit FE checkout; no SKIP or silent local fallback.
const input = {
  "baseline": "c61d98fec539caec8d9481753247aeaaab16ca23",
  "sourceCheckout": "/Users/thanhdanh/Nep-Remix-frontend",
  "status": "REVIEW INPUT ONLY — not final geometry approval",
  "fingerprints": {
    "src/game/C3-LAYOUT-HANDOFF.md": "8149d5b9b5c15fb3d829305d5e8423f6664fbb1b96e70302cad7c78f536f0417",
    "src/game/c3-m1.test.ts": "7ab1471c19114dced8af6963c6a0736282005a0655b2a9c797b98a5c3747f6df",
    "src/game/room-walker.ts": "31063822f43a41dfc8b0d17276724c891409877bbaf8cc82bc33384479792cad",
    "src/game/RoomScene.tsx": "66a6eded8a4aa0cebfcdae5bd121164ab7e173c96334fcc1876bfec3f5dd02b2",
    "src/game/room-render.ts": "59be77c9087e14e534c53cd3f517e244c91fe15708e827dd637e088a0183aa7b",
    "src/game/character-scale.ts": "2cda1b2172950fd6e82cfc24926fa91aeeff84512c4c00f21c6429715829ebfa",
    "src/game/c3-layout.test.ts": "f7d97dca15412c1ebe1946d22eab711f59ae2755042503f351be6563de70da25"
  },
  "world": {
    "w": 1672,
    "h": 941
  },
  "standGap": 0.045,
  "floor": {
    "top": 639.88,
    "bottom": 865.72
  },
  "limitations": [
    "Distances are independently computed feasibility checks, not actual Core guards or visual acceptance.",
    "Spawn S2/S3 current implementation produces y=639.88; FE now proposes y=795.145/819.611 for fallback only. Final spawn remains pending Leader decision/visual acceptance.",
    "Corrected FE handoff matches source-derived computedArrivals; keep exact native conversions, not rounded normalized values.",
    "No runtime files changed by Leader."
  ],
  "proposed": [
    {"id": "hitbox-fabric-attic", "area": "c3-s1-tiem-may-da-kao", "pos": [1246, 550], "radius": 0.19, "rect": {"x": 1180, "y": 460, "w": 130, "h": 180}, "left": [1140, 790], "right": [1350, 790]},
    {"id": "hitbox-c3-read-receipt", "area": "c3-s1-tiem-may-da-kao", "pos": [1246, 550], "radius": 0.19, "rect": {"x": 1180, "y": 460, "w": 130, "h": 180}, "left": [1140, 790], "right": [1350, 790]},
    {"id": "hitbox-gramophone", "area": "c3-s1-tiem-may-da-kao", "pos": [1420, 600], "radius": 0.16, "rect": {"x": 1350, "y": 500, "w": 140, "h": 180}, "left": [1350, 790], "right": [1480, 790]},
    {"id": "hitbox-street-exit", "area": "c3-s1-tiem-may-da-kao", "pos": [880, 780], "radius": 0.15, "rect": {"x": 752, "y": 750, "w": 250, "h": 170}, "left": [820, 820], "right": [940, 820]},
    {"id": "hitbox-incense-bowl", "area": "c3-s2-phong-phong-thuy", "pos": [580, 620], "radius": 0.16, "rect": {"x": 480, "y": 500, "w": 180, "h": 160}, "left": [480, 795], "right": [680, 795]},
    {"id": "hitbox-bagua-mirror", "area": "c3-s2-phong-phong-thuy", "pos": [990, 580], "radius": 0.18, "rect": {"x": 900, "y": 480, "w": 180, "h": 170}, "left": [880, 795], "right": [1040, 795]},
    {"id": "hitbox-bagua-chest", "area": "c3-s2-phong-phong-thuy", "pos": [1190, 580], "radius": 0.19, "rect": {"x": 1080, "y": 420, "w": 220, "h": 230}, "left": [1080, 795], "right": [1260, 795]},
    {"id": "hitbox-salon-table", "area": "c3-s3-dinh-thu-doi-dau", "pos": [840, 620], "radius": 0.19, "rect": {"x": 680, "y": 480, "w": 320, "h": 260}, "left": [750, 840], "right": [920, 840]},
    {"id": "hitbox-c3-read-revision", "area": "c3-s3-dinh-thu-doi-dau", "pos": [840, 620], "radius": 0.19, "rect": {"x": 750, "y": 480, "w": 260, "h": 240}, "left": [750, 840], "right": [920, 840]},
    {"id": "hitbox-vinh-support", "area": "c3-s3-dinh-thu-doi-dau", "pos": [480, 740], "radius": 0.16, "rect": {"x": 400, "y": 420, "w": 160, "h": 390}, "left": [380, 820], "right": [580, 820]},
    {"id": "hitbox-styling-mai", "area": "c3-s3-dinh-thu-doi-dau", "pos": [780, 740], "radius": 0.16, "rect": {"x": 700, "y": 420, "w": 160, "h": 390}, "left": [680, 825], "right": [880, 825]}
  ],
  "computedArrivals": [
    {"id": "hitbox-fabric-attic", "approaches": {"left": {"to": {"x": 1104.76, "y": 640}, "distance": 82.78772123946267, "limit": 152, "pathReachable": true}, "right": {"to": {"x": 1385.24, "y": 790.44}, "distance": 144.0851249642281, "limit": 152, "pathReachable": true}}},
    {"id": "hitbox-c3-read-receipt", "approaches": {"left": {"to": {"x": 1104.76, "y": 640}, "distance": 82.78772123946267, "limit": 152, "pathReachable": true}, "right": {"to": {"x": 1385.24, "y": 790.44}, "distance": 144.0851249642281, "limit": 152, "pathReachable": true}}},
    {"id": "hitbox-gramophone", "approaches": {"left": {"to": {"x": 1274.76, "y": 790.44}, "distance": 122.75468915039443, "limit": 128, "pathReachable": true}, "right": {"to": {"x": 1565.24, "y": 680}, "distance": 81.46275209047921, "limit": 128, "pathReachable": true}}},
    {"id": "hitbox-street-exit", "approaches": {"left": {"to": {"x": 676.76, "y": 865.72}, "distance": 107.38228389846958, "limit": 120, "pathReachable": true}, "right": {"to": {"x": 1077.24, "y": 865.72}, "distance": 104.78958726392715, "limit": 120, "pathReachable": true}}},
    {"id": "hitbox-incense-bowl", "approaches": {"left": {"to": {"x": 404.76, "y": 660}, "distance": 86.49874472050804, "limit": 128, "pathReachable": true}, "right": {"to": {"x": 735.24, "y": 660}, "distance": 77.25853135284783, "limit": 128, "pathReachable": true}}},
    {"id": "hitbox-bagua-mirror", "approaches": {"left": {"to": {"x": 824.76, "y": 781.0300000000001}, "distance": 132.89375153116274, "limit": 144, "pathReachable": true}, "right": {"to": {"x": 1155.24, "y": 781.0300000000001}, "distance": 132.89375153116274, "limit": 144, "pathReachable": true}}},
    {"id": "hitbox-bagua-chest", "approaches": {"left": {"to": {"x": 1004.76, "y": 781.0300000000001}, "distance": 138.80012378443618, "limit": 152, "pathReachable": true}, "right": {"to": {"x": 1375.24, "y": 650}, "distance": 96.11964253029903, "limit": 152, "pathReachable": true}}},
    {"id": "hitbox-salon-table", "approaches": {"left": {"to": {"x": 604.76, "y": 799.85}, "distance": 147.65149662029452, "limit": 152, "pathReachable": true}, "right": {"to": {"x": 1075.24, "y": 740}, "distance": 129.3608146332712, "limit": 152, "pathReachable": true}}},
    {"id": "hitbox-c3-read-revision", "approaches": {"left": {"to": {"x": 674.76, "y": 799.85}, "distance": 124.02887834678174, "limit": 152, "pathReachable": true}, "right": {"to": {"x": 1085.24, "y": 720}, "distance": 128.80967549131643, "limit": 152, "pathReachable": true}}},
    {"id": "hitbox-vinh-support", "approaches": {"left": {"to": {"x": 324.76, "y": 810}, "distance": 83.06971576135734, "limit": 128, "pathReachable": true}, "right": {"to": {"x": 635.24, "y": 810}, "distance": 83.06971576135734, "limit": 128, "pathReachable": true}}},
    {"id": "hitbox-styling-mai", "approaches": {"left": {"to": {"x": 624.76, "y": 810}, "distance": 83.06971576135734, "limit": 128, "pathReachable": true}, "right": {"to": {"x": 935.24, "y": 810}, "distance": 83.06971576135734, "limit": 128, "pathReachable": true}}}
  ]
} as const;
const content = loadContent();
const chapter = content.chapters.c3;
const { world, floor } = input;
const checkout = process.env.C3_MOVEMENT_CHECKOUT;
assert.ok(checkout,'C3 geometry requires C3_MOVEMENT_CHECKOUT pointing to reviewed FE source; refusing SKIP/fallback');
const sources = new Map<string,string>();
let movement: typeof import('../game/room-walker.ts');
{
  for (const [path, expected] of Object.entries(input.fingerprints)) {
    const bytes: Buffer = readFileSync(`${checkout}/${path}`);
    sources.set(path,bytes.toString('utf8'));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `FE input changed: ${path}; re-review snapshot before probing`);
  }
  // Omit only the rendering atlas import (Vite import.meta.glob is unavailable
  // in Node). Execute the actual targetFor/standClear/findPath/tick source.
  const source = sources.get('src/game/room-walker.ts')!
    .replace(/^import .* from '\.\/assets';\n/, '');
  const code = transformSync(source, {loader:'ts',format:'esm',target:'es2022'}).code;
  movement = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const D = ['d-c3-mua-chuoc','d-c3-street-exit','d-c3-bagua','d-c3-so-tu-vi','d-c3-thoa-thuan',
  'd-c3-ban-sua','d-c3-vinh-stand','d-c3-ong-le-defeat'];
const stages: Record<string,number> = {
  'hitbox-fabric-attic':0,'hitbox-c3-read-receipt':1,'hitbox-gramophone':0,'hitbox-street-exit':1,
  'hitbox-incense-bowl':2,'hitbox-bagua-mirror':2,'hitbox-bagua-chest':3,
  'hitbox-salon-table':6,'hitbox-c3-read-revision':5,'hitbox-vinh-support':6,'hitbox-styling-mai':8,
};
function ready(row: typeof input.proposed[number]) {
  const s = createInitialState(content), stage = stages[row.id];
  s.currentChapter = 'c3';
  Object.assign(s.journey.c3, {status:'in_progress',currentArea:row.area,
    unlockedAreaIds:chapter.areas.map(a=>a.id),completedDialogueIds:D.slice(0,stage)});
  if(stage>=1)s.inventory.itemIds.push('bien_nhan_tien_thay_boi');
  if(stage>=4){s.journey.c3.solvedPuzzleIds.push('p-c3-bagua-lock');
    s.inventory.itemIds.push('so_tu_vi_nguyen_ban_1962','thu_tay_thoa_thuan_boi_toan');}
  if(row.id==='hitbox-vinh-support'||stage>=7)s.journey.c3.solvedPuzzleIds.push('p-c3-present-evidence');
  return s;
}
function reject(s: ReturnType<typeof ready>, id: string, feet: {x:number;y:number}) {
  const before = structuredClone(s);
  const r = runCommand(s,{type:'interact',payload:{targetId:id,playerPos:feet}},content);
  assert.equal(r.ok,false, `${id} must reject`); assert.equal(r.state,s); assert.deepEqual(s,before);
}
for (const row of input.proposed) {
  const spot = chapter.areas.find(a=>a.id===row.area)!.interactables.find(i=>i.id===row.id)!;
  test(`numeric geometry: ${row.id}`,()=>{
    assert.deepEqual(spot.pos,{x:row.pos[0]/world.w,y:row.pos[1]/world.h});
    assert.deepEqual(spot.rect,{x:row.rect.x/world.w,y:row.rect.y/world.h,w:row.rect.w/world.w,h:row.rect.h/world.h});
    assert.equal(spot.radius,row.radius);
  });
  const target = spot.action.type==='puzzle' ? chapter.puzzles.find(p=>p.id===spot.action.targetId)
    : chapter.dialogues.find(d=>d.id===spot.action.targetId);
  const requirements = [...(spot.when?.all??[]),...(target?.when?.all??[])];
  for(const side of ['left','right'] as const) {
    const expected = input.computedArrivals.find(a=>a.id===row.id)!.approaches[side];
    const feet = {x:expected.to.x/world.w,y:expected.to.y/world.h};
    test(`actual Core guard, ${side}: ${row.id}`,()=>{
      const r = runCommand(ready(row),{type:'interact',payload:{targetId:row.id,playerPos:feet}},content);
      assert.ok(r.ok,!r.ok?r.reason:'');
      for(const missing of requirements){
        const s=ready(row),p=s.journey.c3;
        if(missing.kind==='dialogueCompleted')p.completedDialogueIds=p.completedDialogueIds.filter(id=>id!==missing.dialogueId);
        else if(missing.kind==='puzzleSolved')p.solvedPuzzleIds=p.solvedPuzzleIds.filter(id=>id!==missing.puzzleId);
        else s.inventory.itemIds=s.inventory.itemIds.filter(id=>id!==missing.itemId);
        reject(s,row.id,feet);
      }
      for(const area of chapter.areas.filter(a=>a.id!==row.area)){
        const s=ready(row);s.journey.c3.currentArea=area.id;reject(s,row.id,feet);
      }
      const wrongSide=ready(row);wrongSide.journey.c3.side='mat_trai';reject(wrongSide,row.id,feet);
      const locked=ready(row);locked.journey.c3.status='locked';reject(locked,row.id,feet);
      const wrongChapter=ready(row);wrongChapter.currentChapter='c2';reject(wrongChapter,row.id,feet);
      reject(ready(row),row.id,{x:0,y:0});
    });
    test(`real FE route and animated/reduced arrival, ${side}: ${row.id}`,()=>{
      const m=movement!, from={x:row[side][0],y:row[side][1]};
      const rect=spot.rect!;
      const aim=m.targetFor({x:rect.x*world.w,y:rect.y*world.h,w:rect.w*world.w,h:rect.h*world.h},from,floor,world.w,input.standGap*world.w,row.area);
      const to=m.standClear(row.area,aim.to,floor,world);
      assert.ok(Math.abs(to.x-expected.to.x)<1e-9 && Math.abs(to.y-expected.to.y)<1e-9);
      const route=m.findPath(row.area,from,to,floor,world);
      assert.notEqual(route,null,'approach route must be reachable');
      const distance=Math.hypot((to.x/world.w-spot.pos.x)*800,(to.y/world.h-spot.pos.y)*500);
      assert.ok(Math.abs(distance-expected.distance)<1e-9);
      assert.equal(spot.radius*800,expected.limit);
      assert.ok(distance<=expected.limit,'radius alone reaches actual feet; no rect fallback needed');
      for(const p of [...route!,to])assert.ok(p.y>=floor.top && p.y<=floor.bottom);
      let walker: import('../game/room-walker.ts').Walker={...m.newWalker(from),goal:{to,face:aim.face,waypoints:route!}};
      let arrived=false;
      for(let frame=0;frame<1000&&!arrived;frame++){
        const next=m.tick(walker,.05,m.WALK_SPEED*world.w);walker=next.walker;arrived=next.arrived;
      }
      assert.ok(arrived,'actual tick reaches endpoint');
      const reduced=m.arriveNow(m.newWalker(from),to,aim.face);
      for(const w of [walker,reduced]){
        assert.equal(w.x,to.x);assert.equal(w.y,to.y);
        const r=runCommand(ready(row),{type:'interact',payload:{targetId:row.id,playerPos:{x:w.x/world.w,y:w.y/world.h}}},content);
        assert.ok(r.ok,!r.ok?r.reason:'');
      }
    });
  }
}
test('geometry delta preserves every M1 semantic field and pending spawn/exit metadata',()=>{
  const old=JSON.parse(execFileSync('git',['show',`${input.baseline}:src/content/chapters/c3.json`],{encoding:'utf8'}));
  const now=JSON.parse(readFileSync(new URL('../content/chapters/c3.json',import.meta.url),'utf8'));
  const strip=(c:typeof old)=>{for(const a of c.areas)for(const h of a.interactables){delete h.pos;delete h.rect;delete h.radius;}return c;};
  assert.deepEqual(strip(now),strip(old));
});

// Execute the fingerprint-pinned FE adapter blocks, not a rewritten entry formula.
// DOM/React rendering is outside this pure integration probe and visual acceptance.
const roomSource=sources.get('src/game/RoomScene.tsx')!;
function slice(source: string, start: string, end: string) {
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,`FE source boundary changed: ${start}`);
  return source.slice(a,b);
}
async function sourceModule(source: string) {
  const code=transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const {HUMAN_HEIGHT}=await sourceModule(sources.get('src/game/character-scale.ts')!);
const {adapter,c3ExitArrows}=await sourceModule(`
  ${slice(sources.get('src/game/room-render.ts')!,'export function c3ExitArrows','/** Sprite sheets at An')}
  export function adapter(env) {
    const {HUMAN_HEIGHT,area,areaId,chapterId,effectiveExitArrows,prevArea,scene,world,
      walker,interact,pending,prefersReducedMotion,stop,paint,run,
      clampToFloor,newWalker,standClear,targetFor,arriveNow,findPath}=env;
    ${slice(roomSource,'const STAND_GAP =','// Every loaded view')}
    ${slice(roomSource,'  const go = (i: Interactable) => {','  const hover =')}
    return {initialize(){
      ${slice(roomSource,'    const entry = effectiveExitArrows.find','    const folder =')}
      return walker.current;
    },go};
  }
`) as {adapter:(env:Record<string,unknown>)=>{initialize():import('../game/room-walker.ts').Walker;go(i:Interactable):void};
  c3ExitArrows:(id:string)=>ExitArrow[]};

test('corrected FE handoff pins the same 11 IDs/actions/native rects/approaches/arrivals',()=>{
  const text=sources.get('src/game/C3-LAYOUT-HANDOFF.md')!;
  const lines=text.split('\n').filter(l=>/^\| \d+ \|/.test(l));
  assert.equal(lines.length,11);
  const numbers=(column:string)=>(column.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number);
  for(const row of input.proposed){
    const line=lines.find(l=>l.includes('`'+row.id+'`'));assert.ok(line);
    const cells=line.split('|').slice(1,-1).map(c=>c.trim());
    const spot=chapter.areas.find(a=>a.id===row.area)!.interactables.find(i=>i.id===row.id)!;
    assert.ok(cells[3].includes(spot.action.targetId));
    assert.deepEqual(numbers(cells[4]),[...row.pos]);
    assert.deepEqual(numbers(cells[6]),Object.values(row.rect));
    assert.equal(numbers(cells[8])[0],row.radius);
    assert.deepEqual(numbers(cells[9]),[...row.left]);assert.deepEqual(numbers(cells[10]),[...row.right]);
    const actual=numbers(cells[11]),expected=input.computedArrivals.find(a=>a.id===row.id)!.approaches;
    for(const [i,v] of [expected.left.to.x,expected.left.to.y,expected.right.to.x,expected.right.to.y].entries())
      assert.ok(Math.abs(actual[i]-v)<=.005,'Markdown display rounding must match computedArrivals');
  }
  assert.deepEqual({top:HUMAN_HEIGHT.c3.floorTop*world.h,bottom:HUMAN_HEIGHT.c3.floorBottom*world.h},floor);
});
const expectedInitial=[{x:250.8,y:790.44},{x:167.2,y:639.88},{x:167.2,y:639.88}];
const expectedTransitions:Record<string,{x:number;y:number}>={
  'c3-s1-tiem-may-da-kao':{x:1571.68,y:639.88},
  'c3-s2-phong-phong-thuy:back':{x:83.6,y:639.88},
  'c3-s2-phong-phong-thuy:mansion':{x:1588.4,y:639.88},
  'c3-s3-dinh-thu-doi-dau':{x:83.6,y:639.88},
};
// Proposal-only: these values are exactly FE's explicit numbers, not an approved
// content delta. Testing them does not change c3.json or claim painted-floor signoff.
const spawnProposals:Record<string,{x:number;y:number}>={
  'c3-s2-phong-phong-thuy':{x:.10,y:.845},
  'c3-s3-dinh-thu-doi-dau':{x:.10,y:.871},
};
function closePoint(actual:{x:number;y:number},expected:{x:number;y:number}) {
  assert.ok(Math.abs(actual.x-expected.x)<1e-9&&Math.abs(actual.y-expected.y)<1e-9,
    `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
for(const [n,area] of chapter.areas.entries()){
  const arrows=c3ExitArrows(area.id);
  const contexts:[string,string|null|undefined,{x:number;y:number},Area][]=[
    ['initial',undefined,expectedInitial[n],area],['resume',null,expectedInitial[n],area],
    ...arrows.map(a=>[`entry:${a.exit}`,area.exits[a.exit],
      expectedTransitions[area.id==='c3-s2-phong-phong-thuy'?`${area.id}:${a.exit}`:area.id],area] as [string,string,{x:number;y:number},Area]),
  ];
  const proposal=spawnProposals[area.id];
  if(proposal)contexts.push(['proposal initial',undefined,{x:167.2,y:n===1?795.145:819.611},{...area,spawn:proposal}],
    ['proposal resume',null,{x:167.2,y:n===1?795.145:819.611},{...area,spawn:proposal}]);
  for(const [label,previous,expected,probeArea] of contexts) {
    test(`real FE ${label} entry and all hotspot routes/guards: ${area.id}`,()=>{
      if(label.includes('resume')){
        const row=input.proposed.find(r=>r.area===area.id)!;
        const loaded=fromJSON(toJSON(createInitialTree(ready(row))),content);
        assert.ok(loaded.ok,!loaded.ok?loaded.reason:'');
        assert.equal(loaded.tree.nodes[loaded.tree.headId].snapshot.journey.c3.currentArea,area.id,
          'Core reload preserves room; FE remount has no prevArea and uses content fallback spawn');
      }
      for(const spot of area.interactables)for(const reduced of [false,true]){
        const walker:{current:import('../game/room-walker.ts').Walker|null}={current:null};
        const pending:{current:{id:string;fire():void}|null}={current:null};
        let count=0;
        const row=input.proposed.find(r=>r.id===spot.id)!;
        const instance=adapter({...movement,HUMAN_HEIGHT,area:probeArea,areaId:area.id,chapterId:'c3',
          effectiveExitArrows:arrows,prevArea:{current:previous},scene:'c3',world,walker,pending,
          prefersReducedMotion:()=>reduced,paint:()=>{},stop:()=>{pending.current=null;},
          interact:{current:(id:string,feet:{x:number;y:number})=>{
            assert.equal(id,spot.id);count++;
            closePoint(feet,{x:walker.current!.x/world.w,y:walker.current!.y/world.h});
            const r=runCommand(ready(row),{type:'interact',payload:{targetId:id,playerPos:feet}},content);
            assert.ok(r.ok,!r.ok?r.reason:'');
          }},
          run:()=>{
            let arrived=false;
            for(let frame=0;frame<1000&&!arrived;frame++){
              const next=movement.tick(walker.current!,.05,movement.WALK_SPEED*world.w);
              walker.current=next.walker;arrived=next.arrived;
            }
            assert.ok(arrived,'animated adapter route reaches endpoint');
            const fire=pending.current;pending.current=null;assert.ok(fire);fire.fire();
          },
        });
        closePoint(instance.initialize(),expected);
        const rect=spot.rect!;
        const aim=movement.targetFor({x:rect.x*world.w,y:rect.y*world.h,w:rect.w*world.w,h:rect.h*world.h},
          walker.current!,floor,world.w,input.standGap*world.w,area.id);
        const to=movement.standClear(area.id,aim.to,floor,world);
        assert.notEqual(movement.findPath(area.id,walker.current!,to,floor,world),null,
          'entry/proposal route must exist even when reduced motion jumps');
        instance.go(spot);assert.equal(count,1,'one arrived-feet interaction per click');
        closePoint(walker.current!,to);
      }
    });
  }
}
