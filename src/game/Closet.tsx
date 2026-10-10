import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Command, GameState, SavedOutfit, StudioDraft } from '../core';
import { content } from './store';
import { isHistoricalGarment } from '../content/garment-catalog';
import { asset, accessoryAsset } from './assets';
import { StudioCharacter } from './StudioCharacter';
import { ClothingPreview } from './ClothingPreview';
import { makeDraft } from './Studio';
import { Workshop } from './Workshop';
import { Modal } from './Modal';
import { useClosetScene } from './closet-scene';
import './closet.css';

type Tab = 'garments' | 'saved' | 'accessories';
type Mode = Tab | 'shop';
type Entry = { kind: 'garment' | 'outfit' | 'accessory'; id: string; name: string; owned: boolean };
const tabs: { id: Tab; name: string }[] = [{ id: 'garments', name: 'Áo của bạn' }, { id: 'saved', name: 'Bộ đã lưu' }, { id: 'accessories', name: 'Phụ kiện' }];
const savedDraft = (outfit: SavedOutfit): StudioDraft => ({ ...makeDraft(content.garmentsById.get(outfit.garmentId)!), ...structuredClone(outfit), type: 'studio' });

export function Closet({ state, send, onStudio, onDialogChange }: { state: GameState; send: (cmd: Command) => GameState | null; onStudio: (draft: StudioDraft) => void; onDialogChange?: (open: boolean) => void }) {
  const initial = state.closet.unlockedGarmentIds.find(isHistoricalGarment) ?? content.garments[0].id;
  const [draft, setDraft] = useState(() => makeDraft(content.garmentsById.get(initial)!));
  const [tab, setTab] = useState<Tab>('garments');
  const [shop, setShop] = useState(false);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<Mode, string>>>({ garments: initial });
  const [dialog, setDialog] = useState<'details' | 'manage' | 'workshop' | 'model' | null>(null);
  const [rename, setRename] = useState('');
  const [deleted, setDeleted] = useState<SavedOutfit | null>(null);
  const room = useRef<HTMLDivElement>(null);
  const pageSize = useClosetScene(room);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const mode: Mode = shop ? 'shop' : tab;
  const preset = state.profile?.avatarPreset ?? 'an-default';
  const garments = [...content.garments].sort((a, b) => Number(state.closet.unlockedGarmentIds.includes(b.id)) - Number(state.closet.unlockedGarmentIds.includes(a.id)));
  const entries: Entry[] = mode === 'garments'
    ? garments.filter(g => !ownedOnly || state.closet.unlockedGarmentIds.includes(g.id)).map(g => ({ kind: 'garment', id: g.id, name: g.name, owned: state.closet.unlockedGarmentIds.includes(g.id) }))
    : mode === 'saved' ? state.closet.savedOutfits.filter(o => isHistoricalGarment(o.garmentId)).map(o => ({ kind: 'outfit', id: o.id, name: o.name, owned: true }))
    : content.accessories.filter(a => shop || state.closet.unlockedAccessoryIds.includes(a.id)).map(a => ({ kind: 'accessory', id: a.id, name: a.name, owned: state.closet.unlockedAccessoryIds.includes(a.id) }));
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const selected = entries.find(e => e.id === selections[mode]) ?? (mode === 'garments' ? entries.find(e => e.id === draft.garmentId) : undefined) ?? entries[0];
  const garment = selected?.kind === 'garment' ? content.garmentsById.get(selected.id) : undefined;
  const outfit = selected?.kind === 'outfit' ? state.closet.savedOutfits.find(o => o.id === selected.id) : undefined;
  const accessory = selected?.kind === 'accessory' ? content.accessoriesById.get(selected.id) : undefined;
  const chapter = garment && Object.values(content.chapters).find(c => c.chapter.reward.garmentIds?.includes(garment.id));
  const unlockHint = chapter ? `${chapter.chapter.title}${['c1', 'prologue'].includes(chapter.chapter.id) ? '' : ' · Chương chưa khả dụng'}` : 'Khám phá cốt truyện để mở áo';
  const borrowed = Object.values(draft.equippedAccessories).some(id => id && !state.closet.unlockedAccessoryIds.includes(id));
  const equipped = accessory && draft.equippedAccessories[accessory.category] === accessory.id;

  useEffect(() => { setPage(0); }, [pageSize]);
  useEffect(() => { onDialogChange?.(Boolean(dialog)); return () => onDialogChange?.(false); }, [Boolean(dialog), onDialogChange]);
  const chooseTab = (next: Tab) => {
    setShop(false); setTab(next); setPage(0); setDeleted(null);
    if (next === 'saved') {
      const saved = state.closet.savedOutfits.find(o => o.id === selections.saved && isHistoricalGarment(o.garmentId)) ?? state.closet.savedOutfits.find(o => isHistoricalGarment(o.garmentId));
      if (saved) setDraft(savedDraft(saved));
    }
    if (next === 'garments') {
      const id = selections.garments ?? initial;
      if (state.closet.unlockedGarmentIds.includes(id) && id !== draft.garmentId) setDraft(makeDraft(content.garmentsById.get(id)!));
    }
  };
  const onTabKey = (event: KeyboardEvent, index: number) => {
    const at = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (at === null) return;
    event.preventDefault(); const next = tabs[(at + tabs.length) % tabs.length].id; chooseTab(next); tabRefs.current[next]?.focus();
  };
  const select = (entry: Entry) => {
    setSelections(s => ({ ...s, [mode]: entry.id })); setDeleted(null);
    if (!entry.owned && entry.kind === 'garment') return;
    if (entry.kind === 'garment') setDraft(makeDraft(content.garmentsById.get(entry.id)!));
    if (entry.kind === 'outfit') setDraft(savedDraft(state.closet.savedOutfits.find(o => o.id === entry.id)!));
    if (entry.kind === 'accessory') {
      const a = content.accessoriesById.get(entry.id)!;
      setDraft(d => ({ ...d, equippedAccessories: { ...d.equippedAccessories, [a.category]: d.equippedAccessories[a.category] === a.id ? undefined : a.id } }));
    }
  };
  const continueStyling = () => onStudio({ ...structuredClone(draft), equippedAccessories: Object.fromEntries(Object.entries(draft.equippedAccessories).filter(([, id]) => id && state.closet.unlockedAccessoryIds.includes(id))) });
  const summary = mode === 'garments' ? `${state.closet.unlockedGarmentIds.filter(isHistoricalGarment).length} áo đã có` : mode === 'saved' ? `${entries.length} bộ đã lưu` : shop ? `${state.wallet.senNgoc} Sen Ngọc` : `${entries.length} món đã có`;
  const status = selected?.owned ? accessory && equipped ? 'Đang mặc thử · Đã sở hữu' : 'Đã sở hữu' : garment ? 'Chưa mở khóa' : accessory ? `${accessory.senNgocPrice} Sen Ngọc${equipped ? ' · Đang thử' : ''}` : '';
  const missing = accessory ? Math.max(0, accessory.senNgocPrice - state.wallet.senNgoc) : 0;

  return <div ref={room} className="room closet-room">
    <picture className="room-background"><img className="art-hires" src={asset('assets/screens/wardrobe/wardrobe-room--landscape.png')} alt="Phòng tủ gỗ đỏ trầm, rèm hồng sen và gốm men lam" /></picture>
    <div className="closet-layout" inert={dialog ? true : undefined}>
      <div className="closet-model">
        <button className="closet-model-preview" aria-label="Xem lớn bộ đang mặc thử" onClick={() => setDialog('model')}><StudioCharacter id="closet-doll" draft={draft} direction="down" preset={preset} /></button>
        <p className="closet-model-caption">{content.garmentsById.get(draft.garmentId)?.name}</p>
        <button className="primary closet-continue" onClick={continueStyling}>Phối tiếp</button>
        {borrowed && <small className="closet-borrowed">Món chưa mua sẽ được cất lại khi phối tiếp.</small>}
      </div>
      <section className="closet-cabinet" aria-label={shop ? 'Quầy phụ kiện' : 'Tủ đồ của bạn'} style={{ '--closet-frame': `url("${asset('assets/screens/museum/gallery-frame.png')}")`, '--closet-cabinet-art': `url("${asset('assets/screens/wardrobe/wardrobe-cabinet.png')}")` } as CSSProperties}>
        <img className="closet-cabinet-art art-hires" src={asset('assets/screens/wardrobe/wardrobe-cabinet.png')} alt="" />
        <h2 className="closet-cabinet-title">{shop ? 'Quầy phụ kiện' : `Tủ đồ của ${state.profile?.name ?? 'An'}`}</h2>
        <div className="closet-pagination" role="group" aria-label="Trang tủ đồ"><span>{summary}</span><button aria-label="Trang tủ đồ trước" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>‹</button><span className="closet-page-number">{currentPage + 1} / {pages}</span><button aria-label="Trang tủ đồ tiếp" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>›</button></div>
        <div className="closet-tabs" role="tablist" aria-label="Các ngăn tủ đồ">{tabs.map((t, index) => <button key={t.id} ref={el => { tabRefs.current[t.id] = el; }} id={`closet-tab-${t.id}`} role="tab" aria-selected={!shop && tab === t.id} aria-controls="closet-collection" tabIndex={tab === t.id ? 0 : -1} onKeyDown={e => onTabKey(e, index)} onClick={() => chooseTab(t.id)}>{t.name}</button>)}</div>
        <div id="closet-collection" className="closet-collection" role={shop ? 'region' : 'tabpanel'} aria-label={shop ? 'Phụ kiện trong cửa hàng' : undefined} aria-labelledby={shop ? undefined : `closet-tab-${tab}`} data-page-size={pageSize}>
          {entries.length ? entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(entry => {
            const g = entry.kind === 'garment' ? content.garmentsById.get(entry.id) : undefined;
            const o = entry.kind === 'outfit' ? state.closet.savedOutfits.find(o => o.id === entry.id) : undefined;
            const active = selected?.id === entry.id;
            return <button key={entry.id} className={`closet-card${active ? ' is-selected' : ''}${!entry.owned && entry.kind === 'garment' ? ' is-locked' : ''}`} aria-label={entry.owned || entry.kind === 'accessory' ? entry.name : `${entry.name} · Chưa mở khóa`} aria-pressed={active} onClick={() => select(entry)}>
              <div className="closet-card-art">{g ? <ClothingPreview garment={g} colors={g.defaultColorPalette} /> : o ? <StudioCharacter id={`closet-outfit-${o.id}`} draft={savedDraft(o)} direction="down" preset={preset} label={o.name} /> : <img src={asset(accessoryAsset(entry.id, true))} alt="" />}</div>
              {!entry.owned && entry.kind === 'garment' && <span className="closet-lock" aria-hidden="true"><svg viewBox="0 0 24 28"><path d="M6 11V7a6 6 0 0 1 12 0v4M3 11h18v15H3z" /><path d="M12 17v4" /></svg></span>}
              <span className="closet-card-name">{!entry.owned && entry.kind === 'garment' ? 'Chưa mở khóa' : entry.name}</span>
              {shop && <small className="closet-card-price">{entry.owned ? 'Đã sở hữu' : `${content.accessoriesById.get(entry.id)!.senNgocPrice} Sen Ngọc`}</small>}
            </button>;
          }) : <div className="closet-empty"><svg viewBox="0 0 100 72" aria-hidden="true"><path d="M45 17a7 7 0 1 1 9 7l-4 4v8L8 60h84L50 36" /></svg><p>{mode === 'saved' ? 'Chưa có bộ phối nào. Lưu nếp áo đầu tiên trong Phòng phối đồ nhé.' : 'Ngăn phụ kiện còn trống. Ghé quầy để tìm món bạn thích.'}</p><button onClick={mode === 'saved' ? continueStyling : () => { setShop(true); setPage(0); }}>{mode === 'saved' ? 'Sang Phòng phối đồ' : 'Ghé quầy phụ kiện'}</button></div>}
        </div>
        <div className="closet-selection" aria-live="polite">
          <div className="closet-selection-copy"><strong>{deleted ? 'Đã cất bộ phối khỏi tủ' : selected?.name ?? 'Những nếp áo của bạn'}</strong><span className={selected?.owned ? 'is-owned' : ''}>{deleted ? deleted.name : `${selected?.owned ? '✓ ' : ''}${status}`}</span></div>
          {deleted ? <button onClick={() => { if (send({ type: 'closet/restoreOutfit', payload: { outfit: deleted } })) setDeleted(null); }}>Hoàn tác xóa</button>
            : outfit ? <button onClick={() => { setRename(outfit.name); setDialog('manage'); }}>Quản lý bộ phối</button>
            : shop && accessory && !selected?.owned ? <button className="primary" disabled={missing > 0} onClick={() => send({ type: 'shop/buy', payload: { accessoryId: accessory.id } })}>{missing ? `Thiếu ${missing} Sen Ngọc` : `Mua · ${accessory.senNgocPrice} Sen Ngọc`}</button>
            : selected ? <button onClick={() => setDialog('details')}>Xem chi tiết</button> : null}
        </div>
        <div className="closet-shortcuts"><button onClick={() => { setShop(!shop); setPage(0); setDeleted(null); }}>{shop ? '‹ Về tủ đồ' : 'Ghé quầy phụ kiện'}</button><button aria-label="Xưởng may" onClick={() => setDialog('workshop')}>Mang ảnh đến xưởng</button></div>
      </section>
    </div>
    {dialog && <Modal title={dialog === 'workshop' ? 'Xưởng may' : dialog === 'manage' ? 'Quản lý bộ phối' : dialog === 'model' ? 'Bộ đang mặc thử' : selected?.name ?? 'Chi tiết'} className={`closet-dialog closet-dialog-${dialog}`} wide={dialog === 'workshop'} onClose={() => setDialog(null)}>
      {dialog === 'workshop' && <Workshop unlockedGarmentIds={state.closet.unlockedGarmentIds} onStudio={onStudio} />}
      {dialog === 'model' && <><StudioCharacter id="closet-large-model" draft={draft} direction="down" preset={preset} /><button className="primary" onClick={continueStyling}>Phối tiếp</button></>}
      {dialog === 'details' && <><p>{garment?.culturalSummary ?? accessory?.culturalNote}</p>{garment && !selected?.owned && <p className="closet-unlock-hint">{unlockHint}</p>}{garment && <button aria-pressed={ownedOnly} onClick={() => { setOwnedOnly(!ownedOnly); setPage(0); setDialog(null); }}>{ownedOnly ? 'Hiện toàn bộ áo' : 'Chỉ xem áo đã có'}</button>}{accessory && <p>{selected?.owned ? 'Món này đã có trong ngăn Phụ kiện.' : `Giá ${accessory.senNgocPrice} Sen Ngọc.${missing ? ` Bạn còn thiếu ${missing} Sen Ngọc; đọc tư liệu và khám phá câu chuyện để nhận thêm.` : ''}`}</p>}</>}
      {dialog === 'manage' && outfit && <><label>Tên bộ phối<input maxLength={36} value={rename} onChange={e => setRename(e.target.value)} /></label><div className="closet-manage-actions"><button className="primary" disabled={!rename.trim() || rename.trim() === outfit.name} onClick={() => { if (send({ type: 'closet/renameOutfit', payload: { outfitId: outfit.id, newName: rename.trim() } })) setDialog(null); }}>Lưu tên</button><button className="closet-delete" onClick={() => { const copy = structuredClone(outfit); if (send({ type: 'closet/deleteOutfit', payload: { outfitId: outfit.id } })) { setDeleted(copy); setDialog(null); } }}>Xóa bộ phối</button></div></>}
    </Modal>}
  </div>;
}
