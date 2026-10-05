import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import './standing-dialogue.css';
import { Modal } from './Modal';
import { AN, loadImage } from './assets';
import { typewriter } from '../ui/motion';
import { anLayerPath, standingSource } from './npc-portraits';

/** Sprite height the layout is tuned for (NPC sheets are 64×96). */
const REF_H = 96;
/** Standing art may use about this share of the stage height. */
const STAND_SHARE = 0.62;
const PHONE_QUERY = '(max-width: 640px)';

/** Whole-number scale so pixel art never blurs: ×3…×6, or ×3 on phones. */
const pixelScale = (availableH: number, spriteH: number, phone: boolean) =>
  phone ? 3 : Math.min(6, Math.max(3, Math.floor(availableH / spriteH)));

/** Stage height and phone flag of the element that fills the stage; re-measured on resize. */
function useStageMetrics(ref: RefObject<HTMLElement | null>) {
  const [metrics, setMetrics] = useState({ height: 0, phone: false });
  useEffect(() => {
    const el = ref.current!;
    const measure = () => {
      const next = { height: el.clientHeight, phone: matchMedia(PHONE_QUERY).matches };
      setMetrics(prev => (prev.height === next.height && prev.phone === next.phone ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return metrics;
}

/** NPC: true pixel art, drawn unsmoothed at a whole-number scale from the sprite's real height. */
function NpcCanvas({ path, availableH, phone }: { path: string; availableH: number; phone: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!availableH) return;
    let cancelled = false;
    loadImage(path).then(img => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const n = pixelScale(availableH, img.height, phone);
      canvas.width = img.width * n;
      canvas.height = img.height * n;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.dataset.scale = String(n);
      canvas.dataset.ready = 'true';
    }).catch(() => { if (!cancelled && ref.current) ref.current.dataset.ready = 'false'; });
    return () => { cancelled = true; };
  }, [path, availableH, phone]);
  return <canvas ref={ref} className="standing-npc pixel-native" />;
}

/** An: hi-res layered sheet, cell 0 (front idle), all layers + preset variants, drawn smoothed. */
function AnCanvas({ preset, height }: { preset: string; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const width = Math.round((AN.cellWidth * height) / AN.cellHeight);
  useEffect(() => {
    let cancelled = false;
    Promise.all(AN.layers.map(layer => loadImage(anLayerPath(layer, preset)))).then(layers => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      layers.forEach(img => ctx.drawImage(img, 0, 0, AN.cellWidth, AN.cellHeight, 0, 0, canvas.width, canvas.height));
      canvas.dataset.ready = 'true';
    }).catch(() => { if (!cancelled && ref.current) ref.current.dataset.ready = 'false'; });
    return () => { cancelled = true; };
  }, [preset, width, height]);
  return <canvas ref={ref} className="standing-an art-hires" style={{ width, height }} />;
}

/** Standing art behind the text box: An left (dim unless she speaks), speaking NPC right.
 *  Emblem speakers (narration, letters) have no NPC art, so only a dimmed An remains. */
function StandingArt({ speaker, preset }: { speaker: string; preset: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { height, phone } = useStageMetrics(ref);
  const source = standingSource(speaker);
  const npc = source?.kind === 'sprite' ? source : null;
  const availableH = height * STAND_SHARE;
  const anHeight = REF_H * pixelScale(availableH, REF_H, phone);
  return <div ref={ref} className="standing-art" aria-hidden="true">
    <div className={`standing-slot is-an${speaker === 'An' ? '' : ' is-dim'}`}>
      {availableH > 0 && <AnCanvas preset={preset} height={anHeight} />}
    </div>
    {npc && <div className={`standing-slot is-npc${npc.ghost ? ' is-ghost' : ''}`}>
      <NpcCanvas path={npc.path} availableH={availableH} phone={phone} />
    </div>}
  </div>;
}

/** NPC dialogue (Paper Bride layout): standing portraits behind a full-width box with a gold
 *  name tag and typed line. Clicking the text (or Space/Enter) reveals the whole line; the
 *  action buttons always act immediately so the flow never needs a double press. */
export function DialogueBox({ speaker, text, preset, children }: { speaker: string; text: string; preset: string; children: ReactNode }) {
  const [shown, setShown] = useState('');
  const skip = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    skip.current = controller;
    setShown('');
    void typewriter(text, setShown, { signal: controller.signal });
    return () => controller.abort();
  }, [text]);
  const done = shown.length >= text.length;
  const rest = done ? '' : text.slice(shown.length);
  useEffect(() => {
    if (done) return;
    // While the line is still typing, the first Space/Enter only finishes it.
    const reveal = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault(); event.stopPropagation(); skip.current?.abort();
    };
    window.addEventListener('keydown', reveal, true);
    return () => window.removeEventListener('keydown', reveal, true);
  }, [done]);
  const emblem = standingSource(speaker) === null;
  return <>
    <StandingArt speaker={speaker} preset={preset} />
    <Modal title={speaker} className={`dialogue-stage${emblem ? ' is-emblem' : ''}`}>
      <p className="dialogue-text" onClick={() => skip.current?.abort()}>
        {shown}<span className="dialogue-untyped">{rest}</span>
      </p>
      <div className="dialogue-actions">{children}</div>
    </Modal>
  </>;
}
