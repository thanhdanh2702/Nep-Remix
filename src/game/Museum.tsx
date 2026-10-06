import { useEffect, useState, type CSSProperties } from 'react';
import type { Command, GameState } from '../core';
import { content } from './store';
import { asset, garmentAsset } from './assets';
import { Modal } from './Modal';
import { MotifStrip } from './MotifStrip';
import { MuseumCodex, type CodexKind } from './MuseumCodex';
import './museum.css';

// Share the existing entries across the 12 physical notebooks.
const volumes = Array.from({ length: 12 }, (_, index) => ({
  number: index + 1,
  cards: content.cultureCards.slice(index * 2, index * 2 + 2),
  x: [151, 199, 247, 295][index % 4],
  y: [119, 209, 296][Math.floor(index / 4)],
}));

export function Museum({ state, send, onReadingChange }: {
  state: GameState;
  send: (command: Command) => GameState | null;
  onReadingChange: (reading: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState('next');
  const [codex, setCodex] = useState<CodexKind | null>(null);
  const volume = selected === null ? null : volumes[selected];
  const pageCount = (volume?.cards.length ?? 2) * 2 + 2;
  const card = volume?.cards[Math.min(Math.floor(page / 2), volume.cards.length - 1)];
  const garmentId = card?.id === 'ao-dai-tan-thoi-lemur' ? 'ao-dai-lemur' : card?.id === 'ao-dai-tay-raglan' ? 'ao-dai-raglan' : card?.id;
  const garment = garmentId ? content.garmentsById.get(garmentId) : undefined;
  const options = content.cultureCards.filter(c => (period === 'all' || c.timePeriod.includes(period)) && `${c.title} ${c.historicalFact}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));

  useEffect(() => {
    onReadingChange(selected !== null || codex !== null);
    return () => onReadingChange(false);
  }, [selected, codex, onReadingChange]);

  function turn(delta: number) {
    setDirection(delta > 0 ? 'next' : 'previous');
    setPage(current => Math.max(0, Math.min(pageCount - 1, current + delta)));
  }
  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        turn(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  function open(index: number, startPage = 0) {
    setPage(startPage);
    setDirection('next');
    setSelected(index);
  }

  return <div className="room museum-room">
    <div className="room-background museum-background" aria-hidden="true">
      <div className="museum-art"><img className="art-hires" src={asset('assets/screens/museum/bookshelf-pink--landscape.png')} alt="" /></div>
    </div>
    <div className="museum-art museum-book-targets" role="group" aria-label="Kệ 12 cuốn sách văn hóa">
      {volumes.map((book, index) => {
        const read = book.cards.every(c => state.museum.readCardIds.includes(c.id));
        return <button key={book.number} className="museum-book" aria-label={`Mở sách ${book.number}: ${book.cards.map(c => c.title).join(' · ')}${read ? ' · Đã đọc' : ''}`} title={book.cards.map(c => c.title).join(' · ')} style={{ left: `${book.x / 8}%`, top: `${book.y / 5}%`, width: '5%', height: '14.4%' } as CSSProperties} onClick={() => open(index)}>
        <span className="museum-book-number">{String(book.number).padStart(2, '0')}</span>
        <span className="museum-book-tooltip">{book.cards[0].title}</span>
        {read && <span className="museum-book-read" aria-hidden="true">✓</span>}
      </button>;
      })}
    </div>
    <aside className="room-panel museum-guide">
      <span className="eyebrow">THƯ PHÒNG · TIỆM MAY NẾP</span>
      <h2>Bảo tàng nếp áo</h2>
      <p className="museum-invitation">Một nếp nhà, bao câu chuyện.<br />Chọn một cuốn sách trên kệ để mở từng trang ký ức.</p>
      <div className="museum-guide-codex">
        <button type="button" aria-label="Mở sổ tay Nhân vật" onClick={() => setCodex('characters')}>Nhân vật</button>
        <button type="button" aria-label="Mở sổ tay Kỷ vật" onClick={() => setCodex('items')}>Kỷ vật</button>
      </div>
      <details className="museum-catalog">
        <summary>Tra cứu tư liệu <span>{state.museum.readCardIds.length}/{content.cultureCards.length} đã đọc</span></summary>
        <div className="museum-catalog-content">
          <label>Tìm tư liệu<input placeholder="Ngũ thân, Lemur, raglan…" value={search} onChange={e => setSearch(e.target.value)} /></label>
          <label>Thời kỳ<select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">Tất cả</option>{['Nguyễn', '1888', '1934', '1960', '1962', '1980', '1982', '2026'].map(p => <option key={p}>{p}</option>)}</select></label>
          <div className="museum-catalog-results">{options.map(c => {
            const index = content.cultureCards.indexOf(c);
            return <button key={c.id} onClick={() => open(Math.floor(index / 2), index % 2 * 2)}><strong>{c.title}</strong><small>{state.museum.readCardIds.includes(c.id) ? 'Đã đọc' : c.timePeriod}</small></button>;
          })}{!options.length && <p>Chưa tìm thấy tư liệu phù hợp. Hãy thử từ khóa khác.</p>}</div>
        </div>
      </details>
    </aside>
    {codex && <MuseumCodex kind={codex} state={state} onClose={() => setCodex(null)} />}
    {volume && card && <Modal title={`Sổ tay ${String(volume.number).padStart(2, '0')}`} wide className="museum-reader" onClose={() => setSelected(null)}>
      <MotifStrip />
      <div className="museum-open-book">
        <div className="museum-frontispiece" aria-hidden="true">
          <span className="eyebrow">TỦ SÁCH NẾP NHÀ</span><span className="museum-lotus">❋</span>
          <h3>{volume.cards[0].title}</h3><span className="museum-book-rule" /><p>{volume.cards[1]?.title ?? 'Những câu chuyện trong nếp áo'}</p>
          <small>Tiệm May Nếp · Sổ {String(volume.number).padStart(2, '0')}</small>
        </div>
        <section key={`${selected}-${page}`} className={`museum-paper turn-${direction}`} aria-label={`Trang ${page + 1}`}>
          <div className="museum-page-content">
            {page < volume.cards.length * 2 ? <><span className="eyebrow">{card.timePeriod}</span><h3>{card.title}</h3>
              {page % 2 === 0 ? <>{garment && <img className="museum-garment pixel-native" src={asset(garmentAsset(garment.id, true))} alt={garment.name} />}<p className="historical-fact">{card.historicalFact}</p></> : <><span className="museum-section-note">Những tên gọi qua thời gian</span>{card.officialName && <p><strong>Tên chính thức</strong><br />{card.officialName}</p>}{card.folkName && <p><strong>Tên thường gọi</strong><br />{card.folkName}</p>}</>}
            </> : page === pageCount - 2 ? <><span className="eyebrow">GHI CHÉP CUỐI SỔ</span><h3>Nguồn tư liệu</h3><img className="museum-seal pixel-native" src={asset('assets/screens/museum/citation-seal.png')} alt="" /><p>Tư liệu được cung cấp trong kho nội dung của tiệm.</p><p className="fine-print">Các trích dẫn thư mục chi tiết sẽ được bổ sung khi hoàn thiện nội dung.</p></> : <><span className="eyebrow">KHÉP MỘT NẾP KÝ ỨC</span><h3>Bạn đã đến trang cuối</h3><p>Ghi nhớ những nếp áo vừa khám phá, rồi chọn một cuốn sách khác trên kệ nhé.</p><div className="museum-reading-rewards">{volume.cards.map(c => <div key={c.id}><strong>{c.title}</strong><button className="primary" disabled={state.museum.readCardIds.includes(c.id)} onClick={() => send({ type: 'museum/readCard', payload: { cardId: c.id } })}>{state.museum.readCardIds.includes(c.id) ? 'Đã đọc' : 'Đã hiểu'}</button></div>)}</div></>}
          </div>
          <span className="museum-folio">{String(page + 1).padStart(2, '0')}</span>
        </section>
      </div>
      <nav className="museum-page-controls" aria-label="Lật trang sách">
        <button disabled={page === 0} onClick={() => turn(-1)}>‹ Trang trước</button>
        <span role="status" aria-live="polite" aria-atomic="true">Trang {page + 1} / {pageCount}</span>
        <button disabled={page === pageCount - 1} onClick={() => turn(1)}>Trang sau ›</button>
      </nav>
      <p className="museum-key-hint">Dùng phím ← → để lật trang · Esc để khép sách</p>
    </Modal>}
  </div>;
}
