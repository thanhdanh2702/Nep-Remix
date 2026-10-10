import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../core';
import type { ChapterId } from '../content/schema';
import { AN, areaAsset, asset, assetRegistry, loadImage } from './assets';
import { content } from './store';
import { isChapterPlayable } from './chapter-availability';
import './journey-map.css';

const stops: { id: ChapterId; place: string; character: string; sprite?: string }[] = [
  { id: 'prologue', place: 'Căn Gác Thu', character: 'An' },
  { id: 'c1', place: 'Làng lụa Vạn Phúc', character: 'Cụ Cầm', sprite: 'cu-cam' },
  { id: 'c2', place: 'Phố cổ Hà Nội', character: 'Cụ Loan', sprite: 'cu-loan' },
  { id: 'c3', place: 'Sài Gòn · Đa Kao', character: 'Bà Mai', sprite: 'ba-mai' },
  { id: 'c4', place: 'Nam Định', character: 'Mẹ Phương', sprite: 'me-phuong' },
  { id: 'c5', place: 'Nếp Áo Hồi Sinh', character: 'An' },
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
      images.forEach(img => ctx.drawImage(img, 0, 0));
      ref.current.dataset.ready = 'true';
    }).catch(() => { if (!cancelled && ref.current) ref.current.dataset.ready = 'false'; });
    return () => { cancelled = true; };
  }, [preset]);
  return <canvas ref={ref} className="art-hires" width={AN.cellWidth} height={AN.cellHeight} aria-hidden="true" />;
}

export function JourneyLock() {
  return <svg className="journey-lock" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M4 8V4h2V2h4v2h2v4M3 8h10v8H3z" stroke="currentColor" strokeWidth="2" /><path d="M8 11v3" stroke="currentColor" strokeWidth="2" /></svg>;
}

function postcard(id: ChapterId) {
  const firstArea = content.chapters[id].areas[0];
  const path = firstArea && areaAsset(id, firstArea.id);
  return path && assetRegistry[path] ? asset(path) : undefined;
}

function characterPortrait(sprite?: string) {
  if (!sprite) return undefined;
  return ['portrait-idle.png', 'portrait-tailor.png', 'view-front.png']
    .map(file => `assets/characters/${sprite}/${file}`).find(path => assetRegistry[path]);
}

export function JourneyMap({ state, paused, onSelect, onHome }: {
  state: GameState; paused: boolean; onSelect: (id: ChapterId) => void; onHome?: () => void;
}) {
  const [selected, setSelected] = useState<ChapterId>(state.currentChapter);
  const heading = useRef<HTMLHeadingElement>(null);
  const detail = useRef<HTMLElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const stop = stops.find(s => s.id === selected) ?? stops[0];
  const index = stops.indexOf(stop);
  const chapter = content.chapters[stop.id].chapter;
  const progress = state.journey[stop.id];
  const playable = isChapterPlayable(stop.id, state) && progress.status !== 'locked';
  const completed = progress.status === 'completed';
  const image = postcard(stop.id);
  const portrait = characterPortrait(stop.sprite);
  const choose = (id: ChapterId) => {
    setSelected(id);
    if (matchMedia('(max-width:700px)').matches) detail.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  return <section className="journey-map-screen journey-album-screen" aria-labelledby="journey-map-title">
    <header className="journey-map-heading">
      {onHome && <button disabled={paused} onClick={onHome}>‹ Về sân nhà</button>}
      <span className="eyebrow">MỘT TÀ ÁO. MUÔN CÂU CHUYỆN.</span>
      <h2 id="journey-map-title" ref={heading} tabIndex={-1}>Năm nếp áo · Năm thế hệ</h2>
      <p>Chọn một miền ký ức</p>
    </header>
    <div className="journey-album-scroll">
      <div className="journey-album" inert={paused}>
        <nav className="journey-album-index" aria-label="Các chương cốt truyện">
          <div className="journey-page-caption"><span>✦</span> Những miền ký ức <span>✦</span></div>
          <div className="journey-album-chapters">
            {stops.map((entry, i) => {
              const ready = isChapterPlayable(entry.id, state);
              const done = state.journey[entry.id].status === 'completed';
              const thumb = postcard(entry.id);
              const face = characterPortrait(entry.sprite);
              return <button type="button" key={entry.id} data-chapter={entry.id}
                className={`journey-map-stop journey-album-row ${ready ? done ? 'is-completed' : 'is-open' : 'is-locked'}${entry.id === selected ? ' is-selected' : ''}`}
                aria-pressed={entry.id === selected} onClick={() => choose(entry.id)}>
                <span className="journey-chapter-number">{String(i).padStart(2, '0')}</span>
                <span className="journey-chapter-thumbnail" aria-hidden="true">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <span>✦</span>}
                  {face && <img className="journey-row-portrait" src={asset(face)} alt="" loading="lazy" />}
                </span>
                <span className="journey-chapter-copy"><strong>{entry.place}</strong><span>{i === 0 ? 'Mở đầu · ' : ''}{content.chapters[entry.id].chapter.year}</span></span>
                <span className={`journey-chapter-status${ready ? ' is-ready' : ''}`} aria-label={ready ? done ? 'Đã hoàn thành' : 'Đã mở khóa' : 'Đang hoàn thiện'}>{ready ? done ? '✓' : '●' : 'Sắp ra mắt'}</span>
              </button>;
            })}
          </div>
          <p className="journey-index-note">Một sợi chỉ, nối những thế hệ.</p>
          <span className="journey-page-number" aria-hidden="true">01</span>
        </nav>
        <article ref={detail} className="journey-album-detail" aria-labelledby="journey-chapter-title">
          <figure className={`journey-postcard${image ? '' : ' is-unfinished'}`} key={stop.id}>
            {image ? <img src={image} alt={`Không gian ${stop.place}`} /> : <div className="journey-postcard-placeholder"><span>✦</span><strong>{stop.place}</strong><span>Miền ký ức đang được viết tiếp</span></div>}
            <figcaption>{stop.place} · {chapter.year}</figcaption>
          </figure>
          <div className="journey-chapter-detail">
            <div className="journey-album-portrait" aria-hidden="true">
              {!stop.sprite ? <AnPose preset={state.profile?.avatarPreset ?? 'an-default'} />
                : portrait ? <img src={asset(portrait)} alt="" /> : <span>✦</span>}
            </div>
            <div className="journey-chapter-story">
              <span className="journey-chapter-kicker">{index === 0 ? 'MỞ ĐẦU' : `CHƯƠNG ${String(index).padStart(2, '0')}`}</span>
              <h3 id="journey-chapter-title">{stop.place}</h3>
              <p className="journey-chapter-person">{chapter.year} · {stop.character}</p>
              <p className="journey-chapter-summary">{chapter.summary}</p>
            </div>
          </div>
          <button className="journey-enter-chapter" disabled={!playable || paused} onClick={() => onSelect(stop.id)}>
            <span aria-hidden="true">✦</span> {playable ? completed ? 'Vào lại chương' : 'Vào chương' : 'Sắp ra mắt'} <span aria-hidden="true">→</span>
          </button>
          <p className="journey-detail-note">{playable ? 'Mở đầu và Chương 1–3 đã mở. Bạn có thể khám phá tự do.' : 'Chương này đang hoàn thiện giao diện. Hẹn bạn ở miền ký ức tiếp theo.'}</p>
          <span className="journey-page-number" aria-hidden="true">{String(index + 2).padStart(2, '0')}</span>
        </article>
      </div>
    </div>
  </section>;
}
