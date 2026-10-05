import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../core';
import { AN, brandingAssets, loadImage, type Direction } from './assets';
import { move, worlds, type Point } from './physics';
import { AreaSign } from './AreaSign';
import { characterScale } from './character-scale';
import { setupCanvas, setSmoothing } from '../ui/pixel-scale';
import { prefersReducedMotion } from '../ui/motion';
import { HUD_SELECTOR, computeCamera, measureInsets, signBox, type View } from './scene-view';

export type Destination = 'studio' | 'closet' | 'museum' | 'journey';
export const destinations: { id: Destination; label: string; x: number; y: number; signX: number; signY: number; signAngle: number }[] = [
  { id: 'studio', label: 'Phòng phối đồ', x: 280, y: 255, signX: 225, signY: 91, signAngle: -14 },
  { id: 'museum', label: 'Bảo tàng', x: 660, y: 360, signX: 823, signY: 296, signAngle: -18 },
  { id: 'journey', label: 'Cốt truyện', x: 438, y: 190, signX: 438, signY: 116, signAngle: 0 },
  { id: 'closet', label: 'Tủ đồ', x: 635, y: 296, signX: 622, signY: 149, signAngle: 24 },
];
// Physical key codes, so WASD stays under the same fingers on AZERTY and other layouts.
const dpad = [{ code: 'KeyW', key: 'w', label: 'Lên' }, { code: 'KeyA', key: 'a', label: 'Trái' }, { code: 'KeyS', key: 's', label: 'Xuống' }, { code: 'KeyD', key: 'd', label: 'Phải' }];
const keysToAxis = (keys: Set<string>): Point => {
  const any = (...codes: string[]) => Number(codes.some(code => keys.has(code)));
  return { x: any('KeyD', 'ArrowRight') - any('KeyA', 'ArrowLeft'), y: any('KeyS', 'ArrowDown') - any('KeyW', 'ArrowUp') };
};
const movementCodes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const coarseQuery = '(pointer:coarse)';
// Hub (courtyard) only: story rooms are point-and-click and render in RoomScene. `hub` and `onInteract`
// stay in the signature so Game.tsx is unchanged; the hub only navigates, so neither is read here.
export function Scene({ state, portrait, blocked, onNavigate }: {
  state: GameState; hub: boolean; portrait: boolean; blocked: boolean;
  onInteract: (id: string, pos: Point) => void; onNavigate: (id: Destination) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const signs = useRef<HTMLDivElement>(null);
  const held = useRef(new Set<string>());
  const position = useRef<Point>({ ...worlds.hub.spawn });
  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState('Đang mở cửa tiệm…');
  const [failure, setFailure] = useState('');
  const latest = useRef({ state, blocked, portrait, onNavigate });
  latest.current = { state, blocked, portrait, onNavigate };
  const targetRef = useRef<string | null>(null);
  // Canvas size, DPR and HUD insets live in a ref: resizing never restarts the game loop or drops held keys.
  const view = useRef<View>({ w: 800, h: 500, dpr: 1, insets: { top: 0, bottom: 0 } });
  const reducedMotion = useRef(prefersReducedMotion());
  const [coarse, setCoarse] = useState(() => matchMedia(coarseQuery).matches);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)'), pointer = matchMedia(coarseQuery);
    const sync = () => { reducedMotion.current = motion.matches; setCoarse(pointer.matches); };
    motion.addEventListener('change', sync); pointer.addEventListener('change', sync);
    return () => { motion.removeEventListener('change', sync); pointer.removeEventListener('change', sync); };
  }, []);

  useEffect(() => {
    const element = container.current!, surface = canvas.current!;
    const root = element.closest('.app-shell') ?? document.body;
    let hudBottom = -1;
    const update = () => {
      const w = element.clientWidth, h = element.clientHeight;
      if (!w || !h) return;
      const { dpr } = setupCanvas(surface, w, h);
      const insets = measureInsets(element);
      view.current = { w, h, dpr, insets };
      if (insets.bottom !== hudBottom) { hudBottom = insets.bottom; element.style.setProperty('--hud-bottom', `${hudBottom}px`); }
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    root.querySelectorAll(HUD_SELECTOR).forEach(hud => observer.observe(hud));
    window.addEventListener('resize', update); // zoom or a monitor swap changes DPR without a box change
    update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  const interact = () => {
    if (latest.current.blocked || !targetRef.current) return;
    held.current.clear();
    latest.current.onNavigate(targetRef.current as Destination);
  };
  const interactRef = useRef(interact);
  interactRef.current = interact;

  useEffect(() => {
    held.current.clear();
    if (blocked) { targetRef.current = null; setTarget(null); }
  }, [blocked]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (latest.current.blocked || element.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (movementCodes.has(event.code)) { event.preventDefault(); held.current.add(event.code); }
      if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); interactRef.current(); }
    };
    const up = (event: KeyboardEvent) => held.current.delete(event.code);
    const clear = () => held.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear);
    };
  }, []);

  useEffect(() => {
    let cancelled = false, raf = 0, onVisibility: (() => void) | undefined;
    const world = worlds.hub;
    held.current.clear(); targetRef.current = null; setTarget(null); setFailure(''); setStatus('Đang mở cửa tiệm…');
    if (canvas.current) canvas.current.dataset.ready = 'false';
    const sheetPaths = AN.layers.map(layer => `assets/characters/an/${layer}.png`);
    const paths = [...sheetPaths, brandingAssets.garden];
    const preset = latest.current.state.profile?.avatarPreset ?? 'an-default';
    const variants: Record<string, string> = {};
    if (preset.includes('bob')) { variants.hair_back = 'hair_back__bob'; variants.hair_front = 'hair_front__bob'; }
    if (preset.includes('jade') || preset.includes('rose')) {
      const color = preset.includes('jade') ? 'jade' : 'rose';
      variants.outfit_back = `outfit_back__${color}`; variants.outfit_main = `outfit_main__${color}`;
    }
    for (const value of Object.values(variants)) paths.push(`assets/characters/an/${value}.png`);
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled) return;
      if (images.slice(0, AN.layers.length).some(img => img.naturalWidth !== AN.columns * AN.cellWidth || img.naturalHeight !== AN.rows * AN.cellHeight)) throw new Error('Các lớp sprite An không cùng lưới 1408 × 4576.');
      const loaded = Object.fromEntries(paths.map((p,i) => [p,images[i]]));
      const surface = canvas.current, ctx = surface?.getContext('2d');
      if (!surface || !ctx) return;
      const signButtons = signs.current ? Array.from(signs.current.querySelectorAll<HTMLButtonElement>('button')) : [];
      const written = { position: '', frame: '', motion: '', target: '', camera: '', signs: '' };
      let previous = 0, elapsed = 0, idle = 0, direction: Direction = 'down';
      const anScale = characterScale('hub', world.bounds.h); // world px per art px: An is 15% of the 625 high hub
      setStatus('');
      surface.dataset.ready = 'true';
      function render(time: number) {
        if (cancelled) return;
        const dt = previous ? Math.min((time - previous) / 1000, .05) : 0;
        previous = time;
        const current = latest.current, v = view.current;
        const input = current.blocked || document.hidden || !document.hasFocus() ? { x: 0, y: 0 } : keysToAxis(held.current);
        const before = position.current;
        const after = move(before, input, dt, world);
        position.current = after;
        const walking = before.x !== after.x || before.y !== after.y;
        if (input.x) direction = input.x > 0 ? 'right' : 'left';
        else if (input.y) direction = input.y > 0 ? 'down' : 'up';
        elapsed = walking ? elapsed + dt : 0;
        idle = walking ? 0 : idle + dt;
        const step = walking ? AN.walk[Math.floor(elapsed * 9) % AN.walk.length]
          : AN.idle[reducedMotion.current ? 0 : Math.floor(idle * 4) % AN.idle.length];
        const index = AN.directions[direction] + step;
        const cam = computeCamera(true, current.portrait, v, after, AN.anchor.y * anScale + 4);
        const k = cam.scale * v.dpr;
        ctx!.setTransform(1,0,0,1,0,0);
        ctx!.clearRect(0,0,surface!.width,surface!.height);
        // Painted hi-res art is smoothed; the world is drawn in world units, camera snapped to whole device pixels.
        setSmoothing(ctx!, true);
        ctx!.setTransform(k,0,0,k,cam.x * v.dpr,cam.y * v.dpr);
        // The elevated hub has scenery beyond the walking area, allowing a wider camera.
        ctx!.drawImage(loaded[brandingAssets.garden],-100,-62.5,1000,625);
        // The supplied garden already includes Nếp, so only An is drawn on top, in device pixels.
        ctx!.setTransform(1,0,0,1,0,0);
        // An's 176×416 cells are painted art: smoothed, placed on a whole device pixel.
        setSmoothing(ctx!, true);
        const size = anScale * k;
        const dx = Math.round((cam.x + after.x * cam.scale) * v.dpr) - Math.round(AN.anchor.x * size);
        const dy = Math.round((cam.y + after.y * cam.scale) * v.dpr) - Math.round(AN.anchor.y * size);
        const dw = Math.round(AN.cellWidth * size), dh = Math.round(AN.cellHeight * size);
        // Seen from behind, the back hair must cover the bare head layer (same rule as the studio).
        const layers = direction === 'up'
          ? AN.layers.filter(layer => layer !== 'hair_back').flatMap(layer => layer === 'head' ? ['head', 'hair_back'] : [layer])
          : AN.layers;
        for (const layer of layers) {
          const path = `assets/characters/an/${variants[layer] ?? layer}.png`;
          ctx!.drawImage(loaded[path],index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,AN.cellWidth,AN.cellHeight,dx,dy,dw,dh);
        }
        const near = current.blocked ? null : destinations.find(d => Math.hypot(after.x-d.x,after.y-d.y) < 64)?.id ?? null;
        if (near !== targetRef.current) { targetRef.current = near; setTarget(near); }
        // Observable canvas state for QA (camera = scale,x,y in CSS px), written only when a value changes.
        const next = { position: `${after.x.toFixed(1)},${after.y.toFixed(1)}`, frame: String(index), motion: walking ? 'walk' : 'idle', target: near ?? '', camera: `${cam.scale.toFixed(4)},${cam.x},${cam.y}` };
        for (const key of ['position','frame','motion','target','camera'] as const) {
          if (written[key] !== next[key]) { written[key] = next[key]; surface!.dataset[key] = next[key]; }
        }
        const signature = `${cam.scale}|${cam.x}|${cam.y}|${v.w}|${v.h}|${v.insets.bottom}`;
        if (signButtons.length && signature !== written.signs) {
          written.signs = signature;
          signButtons.forEach((button,i) => {
            const box = signBox(destinations[i], cam, v);
            Object.assign(button.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`,
              fontSize: `${Math.max(12, Math.round(14 * cam.scale))}px`, visibility: 'visible' });
          });
        }
        raf = requestAnimationFrame(render);
      }
      onVisibility = () => {
        if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
        else if (!raf && !cancelled) { previous = 0; raf = requestAnimationFrame(render); }
      };
      document.addEventListener('visibilitychange', onVisibility);
      if (!document.hidden) raf = requestAnimationFrame(render);
    }).catch(error => { if (!cancelled) { setStatus(''); setFailure(error.message); } });
    return () => {
      cancelled = true; cancelAnimationFrame(raf); held.current.clear();
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state.profile?.avatarPreset]);

  const label = destinations.find(d => d.id === target)?.label;
  const holdKey = (code: string, down: boolean) => { if (down) held.current.add(code); else held.current.delete(code); };
  return <>
    <div ref={container} className="scene">
      <canvas ref={canvas} role="img" data-world-width="800" data-world-height="500" aria-label="Sân nhà Tiệm May Nếp. Dùng WASD hoặc phím mũi tên để di chuyển An." />
      <div ref={signs} className="scene-signs">{destinations.map(d => <AreaSign key={d.id} className={`sign sign-${d.id}`} angle={d.signAngle} highlighted={target === d.id} onClick={() => onNavigate(d.id)} disabled={blocked}>{d.label}</AreaSign>)}</div>
      {status && <div className="scene-status" role="status">{status}</div>}
      {failure && <div className="scene-status error" role="alert">{failure}</div>}
      {target && !blocked && <button className="interaction-prompt" onClick={interact}>{coarse ? <>Chạm để xem · {label}</> : <><kbd>E</kbd> · {label}</>}</button>}
    </div>
    <div className="touch-controls" aria-label="Điều khiển cảm ứng">
      <div className="dpad">{dpad.map(k => <button key={k.key} className={`touch-${k.key}`} disabled={blocked} onContextMenu={e => e.preventDefault()}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); holdKey(k.code, true); }} onPointerUp={() => holdKey(k.code, false)}
        onPointerCancel={() => holdKey(k.code, false)} onLostPointerCapture={() => holdKey(k.code, false)}>{k.label}</button>)}</div>
      <button className="touch-interact primary" disabled={blocked || !target} onClick={interact}>E · Tương tác</button>
    </div>
  </>;
}
