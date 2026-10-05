import { useEffect, useMemo, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import './room-scene.css';
import type { GameState } from '../core';
import type { ExitArrow, Interactable } from '../content/schema';
import { AN, areaAsset, areaFolder, assetInfo, assetRegistry, chapterFolder, loadImage } from './assets';
import { content } from './store';
import { setupCanvas } from '../ui/pixel-scale';
import { prefersReducedMotion } from '../ui/motion';
import { ARROW_UP, CURSOR_DEFAULT, CURSOR_EXIT, CURSOR_HAND, cursorCss, gridToDataUrl, palette, rotateGrid } from '../ui/pixel-art';
import { HUD_SELECTOR, measureInsets } from './scene-view';
import { anLayerPath } from './npc-portraits';
import { AN_FIGURE_H, characterScale, HUMAN_HEIGHT, type CharacterScene } from './character-scale';
import { anCell, drawRoom, ROOM_NPCS, type Box, type Highlight, type NpcViews, type RoomAssets } from './room-render';
import { arriveNow, cellFor, clampToFloor, newWalker, standClear, targetFor, tick, WALK_SPEED, type Walker } from './room-walker';

// Cutout bboxes written by scripts/build-hotspot-cutouts.py: id -> {x,y,w,h} in world px (the room background's pixels).
const cutoutBoxes = import.meta.glob<Record<string, Box>>('../../assets/areas/*/*/hotspots.json', { eager: true, import: 'default' });
const MIN_HIT = 44;
const SOI_MS = 1500;
const boxesFor = (chapterId: string, areaId: string) => cutoutBoxes[`../../assets/areas/${chapterFolder(chapterId)}/${areaId}/hotspots.json`] ?? {};
// The shop is the only room with extra art (the cat).
const SHOP_AREA = 'c0-s1-tiem-may-chieu';
const CAT_SPRITE = 'assets/characters/cat-nep/view-front.png';
// Chapter -> character-scale scene. Chapters without an entry draw no people and keep click-to-interact immediate.
const SCENE_OF: Record<string, CharacterScene | undefined> = { prologue: 'c0', c1: 'c1' };
const NPC_VIEWS = ['front', 'left', 'right', 'back'] as const;
const STAND_GAP = 0.045; // world widths of clear floor between An and the object she walks to
const floorOf = (scene: CharacterScene, h: number) => ({ top: HUMAN_HEIGHT[scene].floorTop * h, bottom: HUMAN_HEIGHT[scene].floorBottom * h });
// Under a floor arrow she stands just above it; a wall arrow (stairs) floats over the floor, so she stands beside
// it (left of it unless that runs off the room) and the arrow never covers her.
const entryPoint = (r: { x: number; y: number; w: number; h: number }, floor: { top: number }, world: { w: number; h: number }) =>
  (r.y + r.h) * world.h > floor.top ? { x: (r.x + r.w / 2) * world.w, y: r.y * world.h }
    : { x: r.x > 0.15 ? (r.x - 0.06) * world.w : (r.x + r.w + 0.06) * world.w, y: floor.top };
const rectOf = (i: Interactable, w: number, h: number): Box => { const r = i.rect ?? { x: i.pos.x - .03, y: i.pos.y - .03, w: .06, h: .06 }; return { x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h }; };
// Every loaded view of one NPC (front, left, right, back); a missing file just leaves that view out.
const loadViews = (id: string): Promise<NpcViews> => {
  const files = NPC_VIEWS.map(view => [view, ROOM_NPCS[id]!.path.replace('view-front', `view-${view}`)] as const).filter(([, path]) => assetRegistry[path]);
  return Promise.allSettled(files.map(([, path]) => loadImage(path)))
    .then(done => Object.fromEntries(files.flatMap(([view], i) => { const r = done[i]; return r.status === 'fulfilled' ? [[view, r.value]] : []; })));
};
const DIR_LABEL = { up: 'Đi lên', down: 'Đi xuống', left: 'Sang trái', right: 'Sang phải' };
type Chapter = (typeof content.chapters)[keyof typeof content.chapters];
type Spot = { i: Interactable; label: string; used: boolean; hit: Box; world: Box | undefined };

const labelFor = (i: Interactable, chapter: Chapter) => {
  const a = i.action;
  if (a.type === 'item') return content.itemsById.get(a.targetId)?.name ?? i.id;
  if (a.type === 'puzzle') return chapter.puzzles.find(p => p.id === a.targetId)?.title ?? i.id;
  return chapter.dialogues.find(d => d.id === a.targetId)?.speaker ?? i.id;
};
// Hit area: the rect, grown to at least 44x44 CSS px around its centre.
const hitOf = (r: Box, b: Box): Box => {
  const w = Math.max(MIN_HIT, r.w * b.w), h = Math.max(MIN_HIT, r.h * b.h);
  return { x: (r.x + r.w / 2) * b.w - w / 2, y: (r.y + r.h / 2) * b.h - h / 2, w, h };
};
// A small hotspot's grown hit box must not swallow the centre of a larger hotspot (the incense burner sat on the altar's centre
// on small screens): cut it back on whichever side keeps the most area. Where nothing conflicts it stays >= MIN_HIT.
const limitHit = (hit: Box, rect: Box, centres: { x: number; y: number }[]): Box => {
  let { x, y, w, h } = hit;
  for (const c of centres) {
    if (c.x <= x || c.x >= x + w || c.y <= y || c.y >= y + h || (c.x >= rect.x && c.x <= rect.x + rect.w && c.y >= rect.y && c.y <= rect.y + rect.h)) continue;
    const cuts: Box[] = [];
    if (c.x < rect.x) cuts.push({ x: Math.min(rect.x, c.x + 1), y, w: x + w - Math.min(rect.x, c.x + 1), h });
    if (c.x > rect.x + rect.w) cuts.push({ x, y, w: Math.max(rect.x + rect.w, c.x - 1) - x, h });
    if (c.y < rect.y) cuts.push({ x, y: Math.min(rect.y, c.y + 1), w, h: y + h - Math.min(rect.y, c.y + 1) });
    if (c.y > rect.y + rect.h) cuts.push({ x, y, w, h: Math.max(rect.y + rect.h, c.y - 1) - y });
    ({ x, y, w, h } = cuts.reduce((best, b) => b.w * b.h > best.w * best.h ? b : best));
  }
  return { x, y, w, h };
};
let cursors: Record<string, string> | undefined;
const arrows = new Map<string, string>();
const arrowUrl = (dir: ExitArrow['dir'], n: number) => {
  const key = `${dir}${n}`;
  if (!arrows.has(key)) arrows.set(key, gridToDataUrl(rotateGrid(ARROW_UP, dir), palette, n));
  return arrows.get(key)!;
};

export function RoomScene({ state, blocked, onInteract, onExit }: {
  state: GameState; blocked: boolean;
  onInteract: (id: string, pos: { x: number; y: number }) => void; onExit: (arrow: ExitArrow) => void;
}) {
  const container = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const chapterId = state.currentChapter, progress = state.journey[chapterId], areaId = progress.currentArea;
  const chapter = content.chapters[chapterId], area = chapter.areas.find(a => a.id === areaId)!;
  const s1 = areaId === SHOP_AREA;
  // Room world = its background image (registry knows the size before the image loads); logicalSize only backs a missing asset.
  const info = assetInfo[areaAsset(chapterId, areaId)], world = info ? { w: info.width, h: info.height } : area.logicalSize;
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0, dpr: 1 });
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null), [soi, setSoi] = useState(false);
  const assets = useRef<RoomAssets | null>(null), lastSig = useRef('');
  // An in the room: her position lives in a ref (the rAF loop moves her without re-rendering React).
  const scene = SCENE_OF[chapterId], preset = state.profile?.avatarPreset ?? 'an-default';
  const walker = useRef<Walker | null>(null), anSheet = useRef<HTMLImageElement[] | null>(null), prevArea = useRef<string | undefined>(undefined);
  const loop = useRef(0), pending = useRef<{ id: string; fire: () => void } | null>(null), interact = useRef(onInteract);
  interact.current = onInteract;

  const spots = useMemo<Spot[]>(() => {
    const boxes = boxesFor(chapterId, areaId);
    const stage = { x: 0, y: 0, w: box.w, h: box.h };
    return area.interactables
      // Same filter as matchesSide in core (src/core/commands/journey/interact-command.ts:18).
      .filter(i => i.side === 'ca_hai' || `mat_${i.side}` === progress.side)
      // Same skips as nearestInteractable: picked items, solved puzzles and puzzles still waiting on a prerequisite have no hotspot.
      .filter(i => {
        const act = i.action;
        if (act.type === 'item') return !state.inventory.itemIds.includes(act.targetId);
        if (act.type !== 'puzzle') return true;
        return !progress.solvedPuzzleIds.includes(act.targetId)
          && !chapter.puzzles.find(p => p.id === act.targetId)?.prerequisitePuzzleIds?.some(id => !progress.solvedPuzzleIds.includes(id));
      })
      .map(i => {
        const r = i.rect ?? { x: i.pos.x - .03, y: i.pos.y - .03, w: .06, h: .06 }, a = i.action;
        const used = a.type === 'item' ? state.inventory.itemIds.includes(a.targetId)
          : a.type === 'puzzle' ? progress.solvedPuzzleIds.includes(a.targetId) : progress.completedDialogueIds.includes(a.targetId);
        return { i, label: labelFor(i, chapter), used, hit: hitOf(r, stage), world: boxes[i.id], rect: r, area: r.w * r.h };
      })
      .sort((a, b) => b.area - a.area) // smaller rects later in the DOM, so they sit on top
      .map((s, _, all) => {
        const rect = { x: s.rect.x * stage.w, y: s.rect.y * stage.h, w: s.rect.w * stage.w, h: s.rect.h * stage.h };
        const centres = all.filter(o => o.area > s.area).map(o => ({ x: (o.rect.x + o.rect.w / 2) * stage.w, y: (o.rect.y + o.rect.h / 2) * stage.h }));
        return { i: s.i, label: s.label, used: s.used, world: s.world, hit: limitHit(s.hit, rect, centres) };
      });
  }, [area, chapterId, areaId, box.w, box.h, progress.side, progress.solvedPuzzleIds, progress.completedDialogueIds, state.inventory.itemIds, chapter]);
  const npcs = area.interactables // same side rule as the spots; solved puzzles keep their NPC standing
    .filter(i => ROOM_NPCS[i.id] && (i.side === 'ca_hai' || `mat_${i.side}` === progress.side))
    .map(i => ({ id: i.id, rect: rectOf(i, world.w, world.h) }));
  const via = new Set((area.exitArrows ?? []).map(a => a.via));
  const buttons = spots.filter(s => !via.has(s.i.id));
  const focusSpot = !blocked && hoverId ? spots.find(s => s.i.id === hoverId) : undefined;
  const live = useRef({ box, ready, blocked, hoverId, soi, s1, areaId, spots, focusSpot, via, npcs, scene });
  live.current = { box, ready, blocked, hoverId, soi, s1, areaId, spots, focusSpot, via, npcs, scene };

  useEffect(() => { // Pixel cursors are baked once and exposed as CSS custom properties.
    cursors ??= { '--cursor-default': cursorCss(CURSOR_DEFAULT, [0, 0]), '--cursor-hand': cursorCss(CURSOR_HAND, [6, 0]), '--cursor-exit': cursorCss(CURSOR_EXIT, [8, 8]) };
    Object.entries(cursors).forEach(([name, value]) => container.current!.style.setProperty(name, value));
  }, []);

  useEffect(() => { // Stage = box with the room's aspect, contained in the space above the bottom HUD; the rest is plum letterbox.
    const el = container.current!, root = el.closest('.app-shell') ?? document.body;
    const update = () => {
      const dpr = window.devicePixelRatio || 1, W = el.clientWidth, H = el.clientHeight - measureInsets(el).bottom;
      if (!W || H <= 0) return;
      const w = Math.floor(Math.min(W, H * world.w / world.h)), h = Math.round(w * world.h / world.w);
      const next = { x: Math.round((W - w) / 2), y: Math.max(0, Math.round((H - h) / 2)), w, h, dpr };
      setBox(prev => (Object.keys(next) as (keyof typeof next)[]).every(k => prev[k] === next[k]) ? prev : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    root.querySelectorAll(HUD_SELECTOR).forEach(hud => observer.observe(hud));
    window.addEventListener('resize', update);
    update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [world.w, world.h]);

  useEffect(() => { // Load the area art; the dark fade covers this gap.
    let cancelled = false;
    setReady(false); setFailure(''); setHoverId(null); assets.current = null; lastSig.current = '';
    // An enters just above the exit arrow that leads back to the room she came from (bottom centre on first entry), on clear floor.
    const entry = (area.exitArrows ?? []).find(x => area.exits[x.exit] === prevArea.current);
    prevArea.current = areaId;
    const floor = scene && floorOf(scene, world.h);
    walker.current = floor ? newWalker(standClear(areaId, clampToFloor(entry ? entryPoint(entry.rect, floor, world) : { x: world.w / 2, y: world.h }, floor, world.w), floor, world)) : null;
    const folder = areaFolder(chapterId, areaId);
    const ids = Object.keys(boxesFor(chapterId, areaId)).filter(id => assetRegistry[`${folder}/hotspot-${id}.png`]);
    const npcIds = area.interactables.map(i => i.id).filter(id => ROOM_NPCS[id]);
    Promise.all([
      Promise.all([loadImage(areaAsset(chapterId, areaId)), s1 && assetRegistry[CAT_SPRITE] ? loadImage(CAT_SPRITE) : undefined]),
      Promise.allSettled(ids.map(id => loadImage(`${folder}/hotspot-${id}.png`))),
      Promise.all(npcIds.map(loadViews)),
    ]).then(([[bg, cat], cuts, people]) => {
      if (cancelled) return;
      assets.current = { bg, cat, cutouts: Object.fromEntries(ids.flatMap((id, i) => cuts[i].status === 'fulfilled' ? [[id, cuts[i].value]] : [])),
        npcs: Object.fromEntries(npcIds.map((id, i) => [id, people[i]])) };
      setReady(true);
    }).catch(error => { if (!cancelled) setFailure(error.message); });
    return () => { cancelled = true; stop(); };
  }, [chapterId, areaId, s1]);

  useEffect(() => { // An's layers for the player's look, loaded outside the room fade; she appears once ready. A failure leaves the room playable without her.
    let cancelled = false;
    anSheet.current = null;
    Promise.all(AN.layers.map(layer => loadImage(anLayerPath(layer, preset)))).then(layers => {
      if (cancelled) return;
      anSheet.current = layers; lastSig.current = ''; paint();
    }).catch(() => { /* no An art: rooms still work */ });
    return () => { cancelled = true; };
  }, [preset]);

  useEffect(() => { // A hotspot that disappears (item picked, puzzle solved) takes its hover with it.
    if (hoverId && !spots.some(s => s.i.id === hoverId) && !(area.exitArrows ?? []).some(x => (x.via ?? `exit:${x.exit}`) === hoverId)) setHoverId(null);
  }, [spots, hoverId, area]);
  useEffect(() => { // Blocked (dialogue, puzzle, panel): no hover, no highlight.
    if (blocked) { setHoverId(null); setSoi(false); if (pending.current) stop(); } // something else took over: she stays put and nothing fires later
  }, [blocked]);
  useEffect(() => {
    if (!soi) return;
    const timer = setTimeout(() => setSoi(false), SOI_MS);
    return () => clearTimeout(timer);
  }, [soi]);
  useEffect(() => { // Hold Space (desktop) to reveal. On a focused button Space keeps its normal click meaning.
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code !== 'Space' || e.repeat || live.current.blocked || target.closest('button,input,textarea,select,[contenteditable="true"]')) return;
      e.preventDefault(); setSoi(true);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const paint = () => { // Redraws only when the signature changes: state, size, or an animation step.
    const L = live.current, surface = canvas.current, a = assets.current;
    if (!L.ready || !a || !surface || !L.box.w) return;
    const t = performance.now(), reduced = prefersReducedMotion(), pending = L.spots.filter(s => !s.used && !L.via.has(s.i.id));
    const lit = Boolean(L.focusSpot || L.soi);
    const within = t % 4000, sparkling = !reduced && !L.blocked && !lit && pending.length > 0 && within < 450;
    const target = sparkling ? pending[Math.floor(t / 4000) % pending.length] : undefined;
    const phase = [!lit || reduced ? 0 : `${Math.floor(t / 400) % 2}${Math.floor(t / 500) % 2}`, target ? Math.floor(within / 150) : -1].join();
    const wk = L.scene ? walker.current : null, cell = wk ? cellFor(wk, t, reduced) : -1;
    const sig = [L.box.w, L.box.h, L.box.dpr, L.focusSpot?.i.id, L.soi, L.areaId, L.npcs.map(n => n.id).join(), L.spots.map(s => s.used).join(), phase,
      wk && `${wk.x.toFixed(1)},${wk.y.toFixed(1)},${cell},${Boolean(anSheet.current)}`].join('|');
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    const { dpr } = setupCanvas(surface, L.box.w, L.box.h), px = (b: Box): Box => ({ x: b.x * dpr, y: b.y * dpr, w: b.w * dpr, h: b.h * dpr });
    const k = surface.width / a.bg.naturalWidth;
    if (wk && L.scene) { // QA hooks: her feet and figure height in world px
      surface.dataset.anX = wk.x.toFixed(1); surface.dataset.anY = wk.y.toFixed(1);
      surface.dataset.anH = (AN_FIGURE_H * characterScale(L.scene, a.bg.naturalHeight, wk.y)).toFixed(1);
    }
    const focus: Highlight | null = L.focusSpot ? { id: L.focusSpot.i.id, hit: px(L.focusSpot.hit), world: L.focusSpot.world ?? { x: 0, y: 0, w: 0, h: 0 }, useCutout: !L.focusSpot.used && Boolean(L.focusSpot.world) } : null;
    drawRoom(surface.getContext('2d')!, a, L.areaId, { w: surface.width, h: surface.height, k, t, reduced, s1: L.s1, focus,
      all: L.soi ? L.spots.filter(s => !L.via.has(s.i.id)).map(s => px(s.hit)) : [],
      npcs: L.npcs, scene: L.scene ?? null, an: wk ? { foot: wk, cell: anSheet.current ? anCell(anSheet.current, cell) : undefined } : null,
      sparkle: target ? { x: (target.hit.x + target.hit.w / 2) * dpr, y: (target.hit.y + target.hit.h * .35) * dpr, frame: Math.floor(within / 150) } : null });
  };
  useEffect(paint); // after every render (state changes)
  useEffect(() => { const timer = setInterval(paint, 100); return () => clearInterval(timer); }, []); // animation steps only

  const stop = () => { // drop any walk in progress and the interaction waiting on it
    cancelAnimationFrame(loop.current); loop.current = 0; pending.current = null;
    if (walker.current) walker.current = { ...walker.current, goal: null, moving: false };
  };
  const run = () => { // rAF loop, alive only while she walks: step, repaint, and fire the interaction on arrival
    if (loop.current) return;
    let last = performance.now();
    const frame = (now: number) => {
      const w = walker.current;
      if (!w?.goal) { loop.current = 0; return; }
      const { walker: next, arrived } = tick(w, Math.min(.05, (now - last) / 1000), WALK_SPEED * world.w);
      last = now; walker.current = next; paint();
      if (!arrived) { loop.current = requestAnimationFrame(frame); return; }
      loop.current = 0;
      const p = pending.current; pending.current = null; p?.fire();
    };
    loop.current = requestAnimationFrame(frame);
  };
  /** Hotspot click (or Enter on its button): An walks beside the object, faces it, then the interaction runs once. */
  const go = (i: Interactable) => {
    const w = walker.current, fire = () => interact.current(i.id, i.pos);
    if (!scene || !w) return fire();
    if (pending.current?.id === i.id) return; // already on her way there: never fire twice
    const floor = floorOf(scene, world.h), aim = targetFor(rectOf(i, world.w, world.h), w, floor, world.w, STAND_GAP * world.w);
    const to = standClear(areaId, aim.to, floor, world), face = aim.face;
    if (prefersReducedMotion()) { stop(); walker.current = arriveNow(w, to, face); paint(); return fire(); }
    pending.current = { id: i.id, fire };
    walker.current = { ...w, goal: { to, face } };
    run();
  };

  const hover = (id: string) => ({
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType !== 'touch' && !live.current.blocked) setHoverId(id); },
    onPointerLeave: () => setHoverId(null),
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(':focus-visible')) setHoverId(id); },
    onBlur: () => setHoverId(null),
  });
  const tip = hoverId && !blocked ? (() => {
    const spot = spots.find(s => s.i.id === hoverId), arrow = (area.exitArrows ?? []).find(a => a.via === hoverId || `exit:${a.exit}` === hoverId);
    const r = spot ? spot.hit : arrow ? hitOf(arrow.rect, box) : undefined;
    const text = spot && !arrow ? spot.label : arrow ? DIR_LABEL[arrow.dir] : ''; // arrow tooltip stays short; the aria-label carries the destination
    return r && text ? { text, left: Math.min(box.w - 60, Math.max(60, r.x + r.w / 2)), top: r.y < 36 ? r.y + r.h + 8 : r.y - 8, below: r.y < 36 } : null;
  })() : null;
  function exitLabel(arrow: ExitArrow) { return `${DIR_LABEL[arrow.dir]} · ${chapter.areas.find(a => a.id === area.exits[arrow.exit])?.title ?? ''}`; }
  const n = box.w >= 1000 ? 4 : 3;
  const pos = (b: Box) => ({ left: b.x, top: b.y, width: b.w, height: b.h });

  return <div ref={container} className="room-scene">
    <div className="room-stage" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
      <canvas ref={canvas} role="img" aria-label={`${area.title}. Bấm vào vật có viền sáng, hoặc dùng Tab rồi Enter.`} data-world-width={world.w} data-world-height={world.h}
        data-ready={ready} data-area={areaId} data-hover={focusSpot?.i.id ?? (blocked ? '' : hoverId ?? '')} />
      <div className="room-hotspots" role="group" aria-label="Vật trong phòng">
        {buttons.map(s => <button key={s.i.id} type="button" data-hotspot={s.i.id} data-used={s.used} aria-label={s.label} disabled={blocked}
          style={pos(s.hit)} onClick={() => go(s.i)} {...hover(s.i.id)} />)}
        {(area.exitArrows ?? []).map(arrow => <button key={arrow.exit} type="button" className={`room-exit dir-${arrow.dir}`} data-exit={arrow.exit} aria-label={exitLabel(arrow)} disabled={blocked}
          style={pos(hitOf(arrow.rect, box))} {...hover(arrow.via ?? `exit:${arrow.exit}`)}
          onClick={() => { const target = arrow.via && area.interactables.find(i => i.id === arrow.via); if (target) onInteract(target.id, target.pos); else onExit(arrow); }}>
          <img src={arrowUrl(arrow.dir, n)} alt="" draggable={false} />
        </button>)}
        {tip && <span className={`room-tip${tip.below ? ' below' : ''}`} style={{ left: tip.left, top: tip.top }} aria-hidden="true">{tip.text}</span>}
      </div>
    </div>
    <button type="button" className="room-soi hud-ic hud-ic-soi" aria-pressed={soi} disabled={blocked} onClick={() => setSoi(on => !on)}>Soi</button>
    <div className="room-fade" data-state={ready ? 'clear' : 'dark'} aria-hidden="true" />
    {!ready && !failure && <div className="room-status" role="status">Đang mở căn phòng…</div>}
    {failure && <div className="room-status error" role="alert">{failure}</div>}
  </div>;
}
