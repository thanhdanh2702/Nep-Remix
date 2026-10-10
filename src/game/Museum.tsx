import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Command, GameState } from '../core';
import { asset } from './assets';
import { Modal } from './Modal';
import { MuseumArt, MuseumRaster } from './MuseumArt';
import { MuseumReader } from './MuseumReader';
import { museumEntries, type MuseumTab } from './museum-gallery';
import { PixelIcon } from '../welcome/PixelIcon';
import './museum.css';

const tabs: { id: MuseumTab; label: string }[] = [{ id: 'culture', label: 'Tư liệu' }, { id: 'characters', label: 'Nhân vật' }, { id: 'items', label: 'Kỷ vật' }];
const perPage = 6;
function CollectionIcon({ tab }: { tab: MuseumTab }) {
  return tab === 'characters' ? <svg className="nep-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 2h6v3h2v5h-2v2H8v-2H6V5h2zM5 13h12v2h3v7H2v-7h3z" /></svg> : <PixelIcon kind={tab === 'culture' ? 'book' : 'chest'} />;
}
export function Museum({ state, send, onReadingChange }: { state: GameState; send: (command: Command) => GameState | null; onReadingChange: (reading: boolean) => void }) {
  const [tab, setTab] = useState<MuseumTab>('culture'), [selected, setSelected] = useState('ao-ngu-than-tay-chen');
  const [search, setSearch] = useState(''), [period, setPeriod] = useState('all'), [page, setPage] = useState(0);
  const [reading, setReading] = useState(false), [detailOpen, setDetailOpen] = useState(false);
  const tabRefs = useRef<Partial<Record<MuseumTab, HTMLButtonElement | null>>>({});
  const entries = useMemo(() => museumEntries(tab, state), [tab, state]);
  const filtered = entries.filter(e => (period === 'all' || e.subtitle.includes(period)) && `${e.title} ${e.description}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const pages = Math.max(1, Math.ceil(filtered.length / perPage)), currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * perPage, (currentPage + 1) * perPage);
  const active = filtered.find(e => e.id === selected) ?? visible[0];
  const completed = entries.filter(e => e.completed).length, progressLabel = tab === 'culture' ? 'tư liệu đã đọc' : tab === 'characters' ? 'nhân vật đã gặp' : 'kỷ vật đã tìm thấy';
  const chooseTab = (next: MuseumTab) => { setTab(next); setSearch(''); setPeriod('all'); setPage(0); setSelected(''); };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const at = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (at === null) return;
    event.preventDefault(); const next = tabs[(at + tabs.length) % tabs.length].id; chooseTab(next); tabRefs.current[next]?.focus();
  };
  const paginate = (next: number) => { setPage(next); setSelected(filtered[next * perPage]?.id ?? ''); };
  useEffect(() => { onReadingChange(reading || detailOpen); return () => onReadingChange(false); }, [reading, detailOpen, onReadingChange]);
  const style = { '--museum-frame': `url("${asset('assets/screens/museum/gallery-frame.png')}")`, '--museum-paper-frame': `url("${asset('assets/screens/museum/collection-paper-frame.png')}")`, '--museum-dock-art': `url("${asset('assets/screens/museum/collection-dock--panorama.png')}")` } as CSSProperties;
  return <div className="room museum-room" style={style}>
    <picture className="room-background museum-background"><img className="art-hires" src={asset('assets/screens/museum/gallery-room--panorama.png')} alt="Thư phòng gỗ Việt với kệ sách, gốm men lam và ánh nắng ấm" /></picture>
    <h2 className="museum-room-sign">❋ Bảo tàng nếp áo ❋</h2>
    <aside className="museum-progress museum-frame" aria-label="Tiến độ bộ sưu tập">
      <strong><PixelIcon kind="book" /> Bộ sưu tập</strong>
      <span className="museum-count" role="status">{completed}/{entries.length} {progressLabel}</span>
      <meter min={0} max={entries.length} value={completed} aria-label={progressLabel} />
    </aside>
    {active ? <>
      <figure className={`museum-exhibit ${active.garment ? 'has-garment' : ''}`} aria-label={`Hiện vật · ${active.title}`}>
        <img className="museum-stand art-hires" src={asset('assets/screens/museum/exhibit-stand.png')} alt="" />
        <MuseumArt entry={active} className="museum-main-art" />
        <figcaption title={active.title}>{active.label}</figcaption>
      </figure>
      <aside className="museum-info museum-frame" aria-label="Thông tin hiện vật">
        <h3><span aria-hidden="true">❋</span>{active.label}<span aria-hidden="true">❋</span></h3>
        <span className="museum-period">{active.subtitle}</span>
        <div className="museum-info-body">
          <div className="museum-mini-frame"><MuseumArt entry={active} /></div>
          <div className="museum-info-copy"><p>{active.description}</p>
            <span className={`museum-entry-status ${active.completed ? 'is-complete' : ''}`}><MuseumRaster path="assets/screens/museum/read-lotus.png" />{tab === 'culture' ? active.completed ? 'Đã đọc' : 'Chưa đọc' : active.unlocked ? tab === 'characters' ? 'Đã gặp' : 'Đã tìm thấy' : tab === 'characters' ? 'Chưa gặp' : 'Chưa tìm thấy'}</span>
            <button className="primary museum-open" disabled={!active.unlocked} onClick={() => active.card ? setReading(true) : setDetailOpen(true)}>{active.card ? 'Mở tư liệu' : 'Xem chi tiết'} <span aria-hidden="true">›</span></button>
          </div>
        </div>
      </aside>
    </> : <div className="museum-empty museum-frame"><h3>Chưa tìm thấy ký ức phù hợp</h3><p>Hãy thử từ khóa khác hoặc chọn tất cả thời kỳ.</p><button onClick={() => { setSearch(''); setPeriod('all'); setPage(0); }}>Xem toàn bộ bộ sưu tập</button></div>}
    <section className="museum-collection" aria-label="Khay bộ sưu tập">
      <div className="museum-collection-head">
        <div className="museum-tabs" role="tablist" aria-label="Bộ sưu tập bảo tàng">{tabs.map((t, i) => <button ref={el => { tabRefs.current[t.id] = el; }} key={t.id} id={`museum-tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls="museum-collection-panel" tabIndex={tab === t.id ? 0 : -1} onKeyDown={event => onTabKey(event, i)} onClick={() => chooseTab(t.id)}><CollectionIcon tab={t.id} />{t.label}</button>)}</div>
        <label className="museum-search"><span className="screen-reader-only">Tìm trong bộ sưu tập</span><input type="search" placeholder="Tìm trong bộ sưu tập…" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
        {tab === 'culture' && <label className="museum-filter">Thời kỳ<select aria-label="Thời kỳ" value={period} onChange={event => { setPeriod(event.target.value); setPage(0); }}><option value="all">Tất cả</option>{['Nguyễn', '1888', '1934', '1960', '1962', '1980', '1982', '2026'].map(p => <option key={p}>{p}</option>)}</select></label>}
      </div>
      <div className="museum-collection-content">
        <div className="museum-collection-scroll" tabIndex={0} aria-label="Cuộn ngang các thẻ bộ sưu tập">
          <div className="museum-cards" id="museum-collection-panel" role="tabpanel" aria-labelledby={`museum-tab-${tab}`}>
            {visible.map(entry => <button key={entry.id} data-entry={entry.id} className={`museum-collection-card ${entry.id === active?.id ? 'is-selected' : ''}`} aria-label={entry.title} aria-pressed={entry.id === active?.id} onClick={() => setSelected(entry.id)}>
              <MuseumArt entry={entry} /><span className="museum-card-label">{entry.label}</span>
              {entry.completed && <span className="museum-read-stamp" aria-label={tab === 'culture' ? 'Đã đọc' : 'Đã khám phá'}><MuseumRaster path="assets/screens/museum/read-lotus.png" /></span>}
            </button>)}
            {!visible.length && <p className="museum-no-results">Không có kết quả phù hợp.</p>}
          </div>
        </div>
        <nav className="museum-pagination" aria-label="Trang bộ sưu tập"><button aria-label="Trang bộ sưu tập trước" disabled={currentPage === 0} onClick={() => paginate(currentPage - 1)}>‹</button><span>{currentPage + 1}/{pages}</span><button aria-label="Trang bộ sưu tập tiếp" disabled={currentPage === pages - 1} onClick={() => paginate(currentPage + 1)}>›</button></nav>
      </div>
    </section>
    {reading && active?.card && <MuseumReader key={active.id} entry={active} state={state} send={send} onClose={() => setReading(false)} />}
    {detailOpen && active && <Modal title={active.title} className="museum-reader museum-detail" onClose={() => setDetailOpen(false)}><MuseumArt entry={active} /><p className="eyebrow">{active.subtitle}</p><p>{active.description}</p></Modal>}
  </div>;
}
