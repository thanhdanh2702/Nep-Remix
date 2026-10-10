import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { StudioDraft } from '../core';
import type { LookbookAngleId } from '../server/ai/lookbook-contract.ts';
import { selectBusy, selectDoneCount, selectExhausted, type LookbookState } from './lookbook-state';
import { asset } from './assets';
import { useDialogFocus, type LookbookInputs, type PhotoGate } from './use-lookbook-dialog';
import { LookbookModelPicker } from './LookbookModelPicker';
import { LookbookMoodPicker } from './LookbookMoodPicker';
import { LookbookGarmentPicker, type LookbookGarmentOption } from './LookbookGarmentPicker';
import { LookbookSlotGrid } from './LookbookSlotGrid';
import { LookbookToolbar } from './LookbookToolbar';
import { COPY } from './lookbook-copy';

export interface LookbookDialogProps {
  state: LookbookState;
  inputs: LookbookInputs;
  gate: PhotoGate;
  gender: 'female' | 'male';
  eventName: string;
  playerName: string;
  garment: { id: string; name: string; story: string };
  colorPalette: StudioDraft['colorPalette'];
  garments: LookbookGarmentOption[];
  onGarment: (id: string) => void;
  disabledReason?: string;
  onCapture: () => void;
  onSave: () => void;
  onRetry: (id: LookbookAngleId) => void;
  onOpenSlot: (id: LookbookAngleId) => void;
  onCancel: () => void;
  onClose: () => void;
}

function statusLine(state: LookbookState, disabledReason: string | undefined): string {
  if (selectExhausted(state)) return COPY.exhausted;
  if (selectBusy(state)) return COPY.progress(selectDoneCount(state));
  return disabledReason ?? COPY.done(selectDoneCount(state));
}

/** Main Lookbook dialog: HTML panel (model + mood) beside the painted 1144x1375 frame. Portalled to body. */
export function LookbookDialog(p: LookbookDialogProps) {
  const ref = useDialogFocus(p.onClose);
  const [sample, setSample] = useState(false);
  const busy = selectBusy(p.state);
  const exhausted = selectExhausted(p.state);
  const done = selectDoneCount(p.state);
  const captureLabel = exhausted ? 'Hết lượt hôm nay' : busy ? COPY.progress(done) : COPY.capture;
  return createPortal(
    <div className="modal-backdrop lookbook-dialog lookbook-album-dialog" data-state="open">
      <div ref={ref} className="lookbook-shell" role="dialog" aria-modal="true" aria-label={COPY.title} tabIndex={-1}>
        <img className="lookbook-album-art art-hires" src={asset('assets/screens/studio/lookbook-album-shell.png')} alt="" />
        <h2 className="lookbook-album-title">Lookbook của {p.playerName}</h2>
        <button className="lookbook-album-close" type="button" aria-label={COPY.close} onClick={p.onClose}>×</button>
        <aside className="lookbook-panel">
          <header className="lookbook-panel-head">
            <h2>❀ Thiết lập ❀</h2>
          </header>
          <LookbookModelPicker inputs={p.inputs} gender={p.gender} gate={p.gate} />
          <LookbookGarmentPicker garments={p.garments} selectedId={p.garment.id} colorPalette={p.colorPalette} disabled={busy} onSelect={p.onGarment} />
          <LookbookMoodPicker inputs={p.inputs} eventName={p.eventName} />
        </aside>
        <div className="lookbook-frame">
          <LookbookSlotGrid state={p.state} garmentName={p.garment.name} sample={sample && !busy && done === 0} onOpen={p.onOpenSlot} onRetry={p.onRetry} />
        </div>
        <details className="lookbook-album-story">
          <summary>❀ Câu chuyện tà áo <span>+</span></summary>
          <div role="region" aria-label={COPY.storyHeading}><strong>{p.garment.name}</strong> · {p.garment.story}</div>
        </details>
        <footer className="lookbook-album-footer">
          <div className="lookbook-frame-progress" role="status" aria-live="polite">
            {busy && <span className="lookbook-frame-bar" style={{ width: `${(done / 4) * 100}%` }} aria-hidden="true" />}
            <span>{sample && !busy && !done ? 'Ảnh mẫu · Chưa có ảnh AI' : !busy && !done && p.state.phase === 'idle' ? 'Chưa có ảnh AI' : statusLine(p.state, p.disabledReason)}</span>
          </div>
          <div className="lookbook-album-buttons">
            {!busy && !done && <button type="button" className="lookbook-preview-toggle" aria-pressed={sample} onClick={() => setSample(v => !v)}>{sample ? 'Ẩn ảnh mẫu' : 'Xem ảnh mẫu'}</button>}
            <button type="button" className={done ? 'lookbook-capture' : 'lookbook-capture primary'}
              aria-label={captureLabel} disabled={busy || exhausted || p.disabledReason !== undefined}
              onClick={() => { setSample(false); p.onCapture(); }}>{done ? '↻ Chụp lại' : captureLabel}</button>
            <button type="button" className="lookbook-save-outfit" aria-label={COPY.save} onClick={p.onSave}>▤ {COPY.save}</button>
            <LookbookToolbar state={p.state} garmentId={p.garment.id} garmentName={p.garment.name} onCancel={p.onCancel} />
          </div>
        </footer>
        <p className="lookbook-album-disclosure">{sample && !busy && !done ? 'Ảnh mẫu minh họa bố cục, không phải kết quả bộ phối đang chọn.' : COPY.disclosure}</p>
      </div>
    </div>,
    document.body
  );
}
