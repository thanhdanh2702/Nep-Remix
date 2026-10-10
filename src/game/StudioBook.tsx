import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { Command, GameState, StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import { asset } from './assets';
import { content } from './store';
import { ClothingPreview } from './ClothingPreview';
import { StudioCharacter, studioViews } from './StudioCharacter';
import { StudioWardrobe, type StudioPalette, type WardrobeTab } from './StudioWardrobe';
import { StudioStylist } from './StudioStylist';
import { StudioActionIcon } from './StudioActionIcon';

interface Props {
  state: GameState; draft: StudioDraft; tab: WardrobeTab; onTab: (tab: WardrobeTab) => void;
  palettes: StudioPalette[]; onGarment: (g: Garment) => void; onColor: (p: StudioPalette) => void;
  onAccessory: (id: string) => void; onEvent: (id: string) => void;
  events: { id: string; name: string }[]; loanGarmentIds: string[]; loanAccessoryIds: string[];
  preset: string; viewIndex: number; onView: (index: number) => void; sparkle: number;
  score: number; undo: ReactNode; redo: ReactNode; onSave: () => void; onOptions: () => void;
  onLookbook: () => void; saveRef: RefObject<HTMLButtonElement | null>;
  lookbookRef: RefObject<HTMLButtonElement | null>; inert: boolean;
  update: (c: Command) => void; notify: (m: string) => void; challenge?: ReactNode;
}

/** Live controls on the two blank pages of the approved concept-C workbench. */
export function StudioBook(p: Props) {
  const garment = content.garmentsById.get(p.draft.garmentId)!;
  return <div className="studio-book-layout" inert={p.inert || undefined}>
    <div className="studio-fitting">
      <div className="studio-model">
        <StudioCharacter draft={p.draft} direction={studioViews[p.viewIndex].direction} preset={p.preset} />
        {p.sparkle > 0 && <span key={p.sparkle} className="studio-sparkle" aria-hidden="true" />}
      </div>
      <p className="doll-caption">{garment.name}</p>
      <div className="studio-view-tabs" role="group" aria-label="Xoay nhân vật">
        {[{ at: 0, label: 'Trước' }, { at: 1, label: 'Nghiêng' }, { at: 2, label: 'Sau' }].map(v =>
          <button key={v.at} aria-pressed={p.viewIndex === v.at || (v.at === 1 && p.viewIndex === 3)}
            onClick={() => p.onView(v.at === 1 && p.viewIndex === 1 ? 3 : v.at)}>{v.label}</button>)}
      </div>
    </div>
    <section className="studio-book" aria-label="Sổ phối của An">
      <img className="studio-book-art art-hires" src={asset('assets/screens/studio/studio-book-workbench.png')} alt="" />
      <button className="studio-book-title" aria-label="Tùy chỉnh bộ phối" onClick={p.onOptions}>Sổ phối của {p.state.profile?.name ?? 'An'}</button>
      <StudioWardrobe state={p.state} draft={p.draft} tab={p.tab} onTab={p.onTab} palettes={p.palettes}
        onGarment={p.onGarment} onColor={p.onColor} onAccessory={p.onAccessory} className="studio-book-catalog"
        loanGarmentIds={p.loanGarmentIds} loanAccessoryIds={p.loanAccessoryIds} />
      <div className="studio-book-detail">
        <h2>{garment.name}</h2>
        <div className="studio-selected-garment"><ClothingPreview garment={garment} colors={p.draft.colorPalette} showHanger={false} /></div>
        <div className="studio-fabric">
          <strong>Màu vải</strong>
          <div>{p.palettes.map(palette => <button key={palette.name} title={palette.name} aria-label={palette.name}
            aria-pressed={palette.colors.every((c, i) => c === p.draft.colorPalette[i])}
            style={{ '--swatch': palette.colors[1] } as CSSProperties} onClick={() => p.onColor(palette)} />)}</div>
        </div>
        <label className="studio-book-event"><span>Dịp sử dụng</span>
          <select value={p.draft.eventContextId} onChange={e => p.onEvent(e.target.value)}>
            {p.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
        <div className="studio-book-score" role="meter" aria-label="Độ hài hòa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.score}>
          <span>Hài hòa</span><span className="studio-score-bar" style={{ '--score': p.score + '%' } as CSSProperties} /><span>{p.score}/100</span>
        </div>
      </div>
      <div className="studio-book-actions" aria-label="Thao tác phối đồ">
        <div className="studio-history">{p.undo}{p.redo}</div>
        <StudioStylist state={p.state} draft={p.draft} update={p.update} notify={p.notify} />
        <button ref={p.lookbookRef} aria-label="Chụp Lookbook AI" onClick={p.onLookbook}><StudioActionIcon kind="book" /><span>Lookbook</span></button>
        <button ref={p.saveRef} className="primary" aria-label="Lưu bộ phối" onClick={p.onSave}><StudioActionIcon kind="save" /><span>Lưu bộ phối</span></button>
      </div>
      {p.challenge && <div className="studio-book-challenge">{p.challenge}</div>}
    </section>
  </div>;
}
