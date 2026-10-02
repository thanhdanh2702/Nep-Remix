import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameState } from '../core';
import { nearestInteractable } from '../core';
import { AN, areaAsset, brandingAssets, loadImage, type Direction } from './assets';
import { content } from './store';
import { move, worlds, type Point } from './physics';
import { AreaSign } from './AreaSign';

export type Destination = 'studio' | 'closet' | 'museum' | 'journey';
export const destinations: { id: Destination; label: string; x: number; y: number; signX: number; signY: number; signAngle: number }[] = [
  { id: 'studio', label: 'Phòng phối đồ', x: 280, y: 255, signX: 225, signY: 91, signAngle: -14 },
  { id: 'museum', label: 'Bảo tàng', x: 660, y: 360, signX: 823, signY: 296, signAngle: -18 },
  { id: 'journey', label: 'Cốt truyện', x: 438, y: 190, signX: 438, signY: 116, signAngle: 0 },
  { id: 'closet', label: 'Tủ đồ', x: 635, y: 296, signX: 622, signY: 149, signAngle: 24 },
];
const keysToAxis = (keys: Set<string>): Point => ({
  x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
  y: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')),
});
const movementKeys = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
export function Scene({ state, hub, portrait, blocked, onInteract, onNavigate }: {
  state: GameState; hub: boolean; portrait: boolean; blocked: boolean;
  onInteract: (id: string, pos: Point) => void; onNavigate: (id: Destination) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const signs = useRef<HTMLDivElement>(null);
  const held = useRef(new Set<string>());
  const position = useRef<Point>({ x: 0, y: 0 });
  const positionedScene = useRef('');
  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState('Đang mở cửa tiệm…');
  const [failure, setFailure] = useState('');
  const latest = useRef({ state, blocked, onInteract, onNavigate });
  latest.current = { state, blocked, onInteract, onNavigate };
  const targetRef = useRef<string | null>(null);
  const areaId = state.journey[state.currentChapter].currentArea;
  const sceneId = hub ? 'hub' : areaId;
  const [viewport,setViewport] = useState({ width: 800, height: 500 });
  const { width, height } = viewport;
  useEffect(() => {
    const element = container.current!;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      const w = portrait ? 320 : 800;
      const h = Math.max(1, Math.round(w * rect.height / Math.max(1,rect.width)));
      setViewport(old => old.width===w && old.height===h ? old : { width:w, height:h });
    };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    return () => observer.disconnect();
  },[portrait]);
  const interact = () => {
    if (latest.current.blocked || !targetRef.current) return;
    held.current.clear();
    if (hub) latest.current.onNavigate(targetRef.current as Destination);
    else latest.current.onInteract(targetRef.current, { x: position.current.x / 800, y: position.current.y / 500 });
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
      const key = event.key.toLowerCase();
      if (movementKeys.includes(key)) { event.preventDefault(); held.current.add(key); }
      if (key === 'e' && !event.repeat) { event.preventDefault(); interactRef.current(); }
    };
    const up = (event: KeyboardEvent) => held.current.delete(event.key.toLowerCase());
    const clear = () => held.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear);
    };
  }, []);

  useEffect(() => {
    let cancelled = false, raf = 0;
    const world = worlds[sceneId];
    if (!world) { setFailure(`Chưa có nền và bản đồ va chạm cho ${sceneId}.`); return; }
    if(positionedScene.current!==sceneId){position.current={...world.spawn};positionedScene.current=sceneId;}
    held.current.clear(); targetRef.current = null; setTarget(null); setFailure(''); setStatus('Đang mở cửa tiệm…');
    const sheetPaths = AN.layers.map(layer => `assets/characters/an/${layer}.png`);
    const paths = [...sheetPaths, 'assets/characters/cat-nep/view-front.png'];
    if (hub) paths.push(brandingAssets.garden);
    else {
      paths.push(areaAsset(areaId));
      if (areaId.includes('s1-')) paths.push(areaAsset(areaId, 'ban-cat-sau-nhat-phan'), `assets/areas/prologue/${areaId}/vfx-c0-s1-bui-nang-chieu.png`);
      else paths.push(...['vai-phu-roi','tuong-go-mo-tay','ruong-mo-toang'].map(s => areaAsset(areaId, s)), `assets/areas/prologue/${areaId}/vfx-c0-s2-anh-sang-thuoc-go.png`);
    }
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
      const ctx = canvas.current?.getContext('2d');
      if (!ctx) return;
      let previous = 0, elapsed = 0, direction: Direction = 'down';
      setStatus('');
      function render(time: number) {
        if (cancelled) return;
        const dt = previous ? Math.min((time - previous) / 1000, .05) : 0;
        previous = time;
        const current = latest.current;
        const input = current.blocked || document.hidden || !document.hasFocus() ? { x: 0, y: 0 } : keysToAxis(held.current);
        const before = position.current;
        const after = move(before, input, dt, world);
        position.current = after;
        const walking = before.x !== after.x || before.y !== after.y;
        if (input.x) direction = input.x > 0 ? 'right' : 'left';
        else if (input.y) direction = input.y > 0 ? 'down' : 'up';
        elapsed = walking ? elapsed + dt : 0;
        const index = AN.directions[direction] + (walking ? AN.walk[Math.floor(elapsed * 9) % AN.walk.length] : 0);
        const progress = current.state.journey[current.state.currentChapter];
        ctx!.setTransform(1,0,0,1,0,0);
        ctx!.imageSmoothingEnabled = false;
        ctx!.clearRect(0,0,width,height);
        // The elevated hub has scenery beyond the walking area, allowing a wider camera.
        const scale = hub ? Math.max(width/1000,height/625) : Math.max(width/800,height/500);
        const cameraX = hub ? (!portrait ? (width-800*scale)/2
          : Math.min(100*scale,Math.max(width-900*scale,width/2-after.x*scale)))
          : Math.min(0,Math.max(width-800*scale,width/2-after.x*scale));
        const centeredY = (height-500*scale)/2;
        const cameraY = hub ? Math.min(62.5*scale,Math.max(height-562.5*scale,
          Math.min(Math.max(centeredY,104-after.y*scale),height-24-after.y*scale)))
          : Math.min(0,Math.max(height-500*scale,
            Math.min(Math.max(centeredY,104-after.y*scale),height-20-after.y*scale)));
        ctx!.setTransform(scale,0,0,scale,cameraX,cameraY);
        const bg = hub ? brandingAssets.garden : areaAsset(areaId);
        const background=loaded[bg];
        if (hub) ctx!.drawImage(background,-100,-62.5,1000,625);
        else {
          const bgScale=Math.max(800/background.naturalWidth,500/background.naturalHeight);
          const bgWidth=background.naturalWidth*bgScale,bgHeight=background.naturalHeight*bgScale;
          ctx!.drawImage(background,(800-bgWidth)/2,(500-bgHeight)/2,bgWidth,bgHeight);
        }
        if (!hub) {
          const overlays = areaId.includes('s1-')
            ? (current.state.inventory.itemIds.includes('phan_may_mau_xanh') ? ['ban-cat-sau-nhat-phan'] : [])
            : [...(progress.solvedPuzzleIds.includes('p-c0-cloth') ? ['vai-phu-roi'] : []), ...(progress.solvedPuzzleIds.includes('p-c0-mannequin-hand') ? ['tuong-go-mo-tay'] : []), ...(progress.solvedPuzzleIds.includes('p-c0-chest-unlock') ? ['ruong-mo-toang'] : [])];
          for (const suffix of overlays) ctx!.drawImage(loaded[areaAsset(areaId,suffix)],0,0,800,500);
        }
        // The supplied garden already includes Nếp; only the shop needs the standalone sprite.
        if (!hub && areaId.includes('s1-')) ctx!.drawImage(loaded['assets/characters/cat-nep/view-front.png'],616,426,32,32);
        for (const layer of AN.layers) {
          const path = `assets/characters/an/${variants[layer] ?? layer}.png`;
          const spriteScale=hub?.30:AN.scale;
          ctx!.drawImage(loaded[path],index % AN.columns * AN.cellWidth, Math.floor(index / AN.columns) * AN.cellHeight,
            AN.cellWidth,AN.cellHeight,after.x-AN.anchor.x*spriteScale,after.y-AN.anchor.y*spriteScale,
            AN.cellWidth*spriteScale,AN.cellHeight*spriteScale);
        }
        if (!hub) {
          const vfx = areaId.includes('s1-') ? `assets/areas/prologue/${areaId}/vfx-c0-s1-bui-nang-chieu.png` : `assets/areas/prologue/${areaId}/vfx-c0-s2-anh-sang-thuoc-go.png`;
          if (areaId.includes('s1-') || progress.solvedPuzzleIds.includes('p-c0-chest-unlock')) ctx!.drawImage(loaded[vfx],Math.floor(time / 180) % 4 * 64,0,64,96,hub ? 400 : 366,areaId.includes('s1-') ? 208 : 248,64,96);
        }
        const near = current.blocked ? null : hub
          ? destinations.find(d => Math.hypot(after.x-d.x,after.y-d.y) < 64)?.id ?? null
          : nearestInteractable(current.state,content,{x:after.x/800,y:after.y/500});
        if (near !== targetRef.current) { targetRef.current = near; setTarget(near); }
        // Observable canvas state for QA, with no game progress mutation per frame.
        if (canvas.current) {
          canvas.current.dataset.position = `${after.x.toFixed(1)},${after.y.toFixed(1)}`;
          canvas.current.dataset.frame = String(index); canvas.current.dataset.motion = walking ? 'walk' : 'idle';
          canvas.current.dataset.target = near ?? '';
        }
        if(signs.current){
          const sceneWidth=container.current!.clientWidth;
          signs.current.style.setProperty('--scene-scale',String(scale*sceneWidth/width));
        }
        signs.current?.querySelectorAll<HTMLButtonElement>('button').forEach((button,i) => {
          // Follow the world camera, keeping the full sign visible when wide screens crop the roofs.
          const x=destinations[i].signX*scale+cameraX;
          const angle=destinations[i].signAngle*Math.PI/180;
          // The rotated 132×44 frame needs extra clearance at the viewport edge.
          const signInset=(66*Math.abs(Math.sin(angle))+22*Math.abs(Math.cos(angle))+8)*scale;
          const y=Math.min(height-signInset,Math.max(signInset,destinations[i].signY*scale+cameraY));
          button.style.left = `${x/width*100}%`;
          button.style.top = `${y/height*100}%`;
        });
        raf = requestAnimationFrame(render);
      }
      raf = requestAnimationFrame(render);
    }).catch(error => { if (!cancelled) { setStatus(''); setFailure(error.message); } });
    return () => { cancelled = true; cancelAnimationFrame(raf); held.current.clear(); };
  }, [sceneId, width, height, state.profile?.avatarPreset]);

  const nearestLabel = hub ? destinations.find(d => d.id === target)?.label : content.chapters[state.currentChapter].areas.find(a => a.id === areaId)?.interactables.find(i => i.id === target)?.action;
  const label = typeof nearestLabel === 'string' ? nearestLabel : nearestLabel?.type === 'item' ? content.itemsById.get(nearestLabel.targetId)?.name : nearestLabel?.type === 'puzzle' ? content.chapters[state.currentChapter].puzzles.find(p => p.id === nearestLabel.targetId)?.title : nearestLabel ? content.chapters[state.currentChapter].dialogues.find(d => d.id === nearestLabel.targetId)?.speaker : '';
  return <>
    <div ref={container} className="scene">
      <canvas ref={canvas} width={width} height={height} data-world-width="800" data-world-height="500" aria-label={hub ? 'Sân nhà Tiệm May Nếp. Dùng WASD hoặc phím mũi tên để di chuyển An.' : 'Khám phá căn phòng cùng An. Dùng WASD và bấm E gần đồ vật.'} />
      {hub && <div ref={signs} className="scene-signs">{destinations.map(d => <AreaSign key={d.id} className={`sign sign-${d.id}`} style={{ '--sign-angle': `${d.signAngle}deg` } as CSSProperties} onClick={() => onNavigate(d.id)} disabled={blocked}>{d.label}</AreaSign>)}</div>}
      {status && <div className="scene-status" role="status">{status}</div>}
      {failure && <div className="scene-status error" role="alert">{failure}</div>}
      {target && !blocked && <button className="interaction-prompt" onClick={interact}><kbd>E</kbd> Bấm E · {label}</button>}
    </div>
    <div className="touch-controls" aria-label="Điều khiển cảm ứng">
      <div className="dpad">{[{key:'w',label:'Lên'},{key:'a',label:'Trái'},{key:'s',label:'Xuống'},{key:'d',label:'Phải'}].map(k => <button key={k.key} className={`touch-${k.key}`} disabled={blocked} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); held.current.add(k.key); }} onPointerUp={() => held.current.delete(k.key)} onPointerCancel={() => held.current.delete(k.key)} onLostPointerCapture={() => held.current.delete(k.key)}>{k.label}</button>)}</div>
      <button className="touch-interact primary" disabled={blocked || !target} onClick={interact}>E · Tương tác</button>
    </div>
  </>;
}
