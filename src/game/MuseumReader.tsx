import { useEffect, useState } from 'react';
import type { Command, GameState } from '../core';
import { Modal } from './Modal';
import { MuseumArt } from './MuseumArt';
import { asset } from './assets';
import type { MuseumEntry } from './museum-gallery';
import { cultureSources, cultureSourcesCheckedOn } from '../content/culture-sources';

export function MuseumReader({ entry, state, send, onClose }: { entry: MuseumEntry; state: GameState; send: (command: Command) => GameState | null; onClose: () => void }) {
  const [page, setPage] = useState(0), [direction, setDirection] = useState('next');
  const card = entry.card!, read = state.museum.readCardIds.includes(card.id);
  const turn = (step: number) => { setDirection(step > 0 ? 'next' : 'previous'); setPage(p => Math.max(0, Math.min(3, p + step))); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault(); turn(event.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <Modal title={`Tư liệu · ${card.title}`} wide className="museum-reader" onClose={onClose}>
    <div className="museum-open-book">
      <div className="museum-frontispiece">
        <span className="eyebrow">TỦ SÁCH NẾP NHÀ</span><MuseumArt entry={entry} />
        <h3>{entry.label}</h3><p>{card.timePeriod}</p>
      </div>
      <section key={page} className={`museum-paper turn-${direction}`} aria-label={`Trang ${page + 1}`}>
        <div className="museum-page-content">
          {page === 0 ? <><span className="eyebrow">{card.contentType === 'fiction' ? 'CÂU CHUYỆN HƯ CẤU' : card.contentType === 'interpretation' ? 'DIỄN GIẢI CỦA TÁC PHẨM' : 'TƯ LIỆU TRANG PHỤC'}</span><h3>{card.title}</h3><p>{card.historicalFact}</p></>
            : page === 1 ? <><span className="eyebrow">NHỮNG TÊN GỌI QUA THỜI GIAN</span><h3>Tên gọi và ghi chép</h3><p><strong>Tên trong tư liệu</strong><br />{card.officialName ?? card.title}</p>{card.folkName && <p><strong>Tên thường gọi</strong><br />{card.folkName}</p>}{card.designNote && <p><strong>Trong Tiệm May Nếp</strong><br />{card.designNote}</p>}</>
              : page === 2 ? <><span className="eyebrow">GHI CHÉP CUỐI SỔ</span><h3>Nguồn tư liệu</h3><img className="museum-seal pixel-native" src={asset('assets/screens/museum/citation-seal.png')} alt="" /><p>{card.sourceNote}</p>{card.sourceIds.length > 0 && <><ul className="museum-sources">{card.sourceIds.map(id => { const source = cultureSources[id]; return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><span>{source.publisher}</span></li>; })}</ul><p className="fine-print">Đối chiếu ngày {cultureSourcesCheckedOn} · Liên kết mở ở thẻ mới.</p></>}</>
                : <><span className="eyebrow">KHÉP MỘT NẾP KÝ ỨC</span><h3>Bạn đã đến trang cuối</h3><p>Ghi nhớ câu chuyện vừa khám phá, rồi trở lại bộ sưu tập để mở một nếp ký ức khác.</p><button className="primary" disabled={read} onClick={() => send({ type: 'museum/readCard', payload: { cardId: card.id } })}>{read ? 'Đã đọc và nhận thưởng' : 'Đã hiểu · +15 Sen Ngọc'}</button></>}
        </div><span className="museum-folio">{String(page + 1).padStart(2, '0')}</span>
      </section>
    </div>
    <nav className="museum-page-controls" aria-label="Lật trang sách">
      <button disabled={page === 0} onClick={() => turn(-1)}>‹ Trang trước</button>
      <span role="status" aria-live="polite" aria-atomic="true">Trang {page + 1} / 4</span>
      <button disabled={page === 3} onClick={() => turn(1)}>Trang sau ›</button>
    </nav>
    <p className="museum-key-hint">Dùng phím ← → để lật trang · Esc để khép sách</p>
  </Modal>;
}
