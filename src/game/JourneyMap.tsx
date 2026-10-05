import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameState } from '../core';
import type { ChapterId } from '../content/schema';
import { AN, asset, assetRegistry, loadImage } from './assets';
import { content } from './store';
import './journey-map.css';

// Label rectangles measured against the supplied 1672 × 941 map. The plaque text is painted into the
// art, so labels stay on their plaque; `labelSide` pushes the portrait clear of it ('top' = plaque sits
// above the portrait, 'bottom' = below). Portraits are fixed px tall, so the clamp is done in CSS.
const LABEL_HEIGHT = 5.4;
type Stop = { id: ChapterId; place: string; character: string; sprite?: string; x: number; y: number; width: number; feetX: number; feetY: number; labelSide?: 'top' | 'bottom' };
const stops: Stop[] = [
  { id: 'prologue', place: 'Căn Gác Thu', character: 'An', x: 44.9, y: 90.2, width: 10.5, feetX: 49.6, feetY: 88.5, labelSide: 'bottom' },
  { id: 'c1', place: 'Làng lụa Vạn Phúc', character: 'Cụ Cầm', sprite: 'cu-cam', x: 19.8, y: 8.1, width: 12.3, feetX: 28, feetY: 27.5, labelSide: 'top' },
  { id: 'c2', place: 'Phố Cổ Hà Nội', character: 'Cụ Loan', sprite: 'cu-loan', x: 66, y: 17.5, width: 11.5, feetX: 75, feetY: 36, labelSide: 'top' },
  { id: 'c3', place: 'Sài Gòn · Đa Kao', character: 'Bà Mai', sprite: 'ba-mai', x: 53.6, y: 45, width: 10.5, feetX: 62, feetY: 60.5, labelSide: 'top' },
  { id: 'c4', place: 'Nam Định', character: 'Mẹ Phương', sprite: 'me-phuong', x: 13.9, y: 69.1, width: 7.9, feetX: 27.5, feetY: 78.5 },
  { id: 'c5', place: 'Nếp Áo Hồi Sinh', character: 'An', x: 83.6, y: 84.2, width: 8.6, feetX: 76, feetY: 89.5 },
];

function AnPose({ preset }: { preset: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const paths = AN.layers.map(layer => {
      const variant = preset.includes('bob') && layer.startsWith('hair_') ? `${layer}__bob`
        : layer.startsWith('outfit_') && (preset.includes('jade') || preset.includes('rose')) ? `${layer}__${preset.includes('jade') ? 'jade' : 'rose'}` : layer;
      return `assets/characters/an/${variant}.png`;
    });
    Promise.all(paths.map(loadImage)).then(images => {
      if (cancelled || !ref.current) return;
      const ctx = ref.current.getContext('2d')!;
      ctx.clearRect(0, 0, AN.cellWidth, AN.cellHeight);
      ctx.imageSmoothingEnabled = false;
      images.forEach(img => ctx.drawImage(img, 0, 0, AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight));
      ref.current.dataset.ready = 'true';
    }).catch(() => { if (!cancelled && ref.current) ref.current.dataset.ready = 'false'; });
    return () => { cancelled = true; };
  }, [preset]);
  return <canvas ref={ref} className="art-hires" width={AN.cellWidth} height={AN.cellHeight} aria-hidden="true" />;
}

export function JourneyLock() {
  return <svg className="journey-lock" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M4 8V4h2V2h4v2h2v4M3 8h10v8H3z" stroke="currentColor" strokeWidth="2" /><path d="M8 11v3" stroke="currentColor" strokeWidth="2" /></svg>;
}

function Clouds({ parting }: { parting: boolean }) {
  // Stepped silhouettes keep the transition in the game's pixel-art vocabulary.
  return <div className={`journey-clouds${parting ? ' is-parting' : ''}`} aria-hidden="true">{['left', 'right'].map(side => <svg key={side} className={`journey-cloud journey-cloud-${side}`} viewBox="0 0 600 800" preserveAspectRatio="none">
    <path fill="#e9b8c9" d="M0 0H530V70h35v75h-20v60h45v95h-35v60h45v85h-25v75h20v95h-50v70h20v65H0Z" />
    <path fill="#f4d4d5" d="M0 0H500v60h45v70h-25v65h40v95h-40v65h50v80h-40v80h25v85h-50v70h35v70H0Z" />
    <path fill="#fff1df" d="M0 0H475v45h35v60h-30v55h40v75h-35v65h35v70h-40v65h35v75h-40v65h20v65h-40v80h25v80H0Z" />
    <path fill="#f4d4d5" d="M65 130h110v25h45v50h-30v25H90v-20H60v-50h30v-15h85v25h-60v20h55v15h20v-35h-15v-20H65ZM120 465h120v25h35v60h-45v25H100v-25H75v-45h30v-20h95v25h-70v15h70v25h35v-45h-20v-15H120Z" />
  </svg>)}</div>;
}

export function JourneyMap({ state, paused, onSelect, onHome }: {
  state: GameState; paused: boolean; onSelect: (id: ChapterId) => void; onHome: () => void;
}) {
  const [revealing, setRevealing] = useState(true);
  const [artworkReady, setArtworkReady] = useState(false);
  const [artworkFailed, setArtworkFailed] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (scroll.current) scroll.current.scrollLeft = (scroll.current.scrollWidth - scroll.current.clientWidth) / 2;
  }, []);
  useEffect(() => {
    if (!artworkReady && !artworkFailed) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A broken map must not leave the screen inert behind the clouds.
    const timer = setTimeout(() => setRevealing(false), reduced || artworkFailed ? 50 : 1800);
    return () => clearTimeout(timer);
  }, [artworkReady, artworkFailed]);
  return <section className="journey-map-screen" aria-labelledby="journey-map-title" data-revealing={revealing}>
    <header className="journey-map-heading">
      <button disabled={paused} onClick={onHome}>‹ Về sân nhà</button>
      <div><span className="eyebrow">MỘT TÀ ÁO. MUÔN CÂU CHUYỆN.</span><h2 id="journey-map-title" ref={heading} tabIndex={-1}>Năm nếp áo · Năm thế hệ</h2></div>
      <span className="journey-map-legend"><JourneyLock /> Hoàn thành từng chương để mở nếp áo tiếp theo</span>
    </header>
    {artworkFailed && <p className="journey-map-error" role="alert">Không tải được ảnh bản đồ. Bạn vẫn có thể chọn chương bên dưới.</p>}
    <div className="journey-map-scroll" ref={scroll} role="region" aria-label="Bản đồ các chương cốt truyện" tabIndex={0}>
      <div className="journey-map-art" inert={paused || revealing}>
        <img className="journey-map-background art-hires" src={asset('map.png')} onLoad={() => setArtworkReady(true)} onError={() => setArtworkFailed(true)} alt="Bản đồ hành trình từ làng lụa Vạn Phúc, phố cổ Hà Nội, Sài Gòn Đa Kao, Nam Định đến Tiệm May Nếp" draggable={false} />
        {stops.map((stop, index) => {
          const progress = state.journey[stop.id];
          const locked = progress.status === 'locked';
          const completed = progress.status === 'completed';
          const label = stop.id === 'prologue' ? 'Mở đầu' : `Chương ${index}`;
          const previous = content.chapters[stops[index - 1]?.id]?.chapter.title;
          const npcArt = stop.sprite && `assets/characters/${stop.sprite}/view-front.png`;
          return <div key={stop.id} className={`journey-map-stop ${locked ? 'is-locked' : completed ? 'is-completed' : 'is-open'}`} data-chapter={stop.id}>
            <button className="journey-map-label" style={{ left: `${stop.x}%`, top: `${stop.y + LABEL_HEIGHT / 2}%`, minWidth: `${stop.width}%` }} disabled={locked} onClick={() => onSelect(stop.id)} aria-label={`${label}: ${stop.place} · ${stop.character} · ${locked ? 'Chưa mở khóa' : completed ? 'Đã hoàn thành' : 'Đã mở khóa'}`} title={locked ? `Hoàn thành ${previous} để mở khóa` : content.chapters[stop.id].chapter.title}>
              <strong>{locked && <JourneyLock />}{stop.place}{completed && <span aria-hidden="true"> ✓</span>}</strong>
              <span>{label} · {content.chapters[stop.id].chapter.year}</span>
            </button>
            <button className="journey-map-character" data-label-side={stop.labelSide} style={{ left: `${stop.feetX}%`, '--feet-y': `${stop.feetY}%`, '--label-top': `${stop.y}%`, '--label-bottom': `${stop.y + LABEL_HEIGHT}%` } as CSSProperties} disabled={locked} onClick={() => onSelect(stop.id)} aria-label={`Gặp ${stop.character} · ${label}${locked ? ' · Chưa mở khóa' : ''}`}>
              {!npcArt ? <AnPose preset={state.profile?.avatarPreset ?? 'an-default'} />
                : assetRegistry[npcArt] && <img src={asset(npcArt)} alt="" draggable={false} />}
              <span>{stop.character}</span>
            </button>
          </div>;
        })}
      </div>
    </div>
    <p className="journey-map-help"><span className="journey-map-swipe">Vuốt ngang để xem bản đồ · </span>Chọn nhân vật hoặc tên chương để khám phá ký ức.</p>
    {revealing && <Clouds parting={artworkReady} />}
  </section>;
}
