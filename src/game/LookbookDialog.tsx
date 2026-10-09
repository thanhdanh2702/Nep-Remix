import { createPortal } from 'react-dom';
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
  garment: { id: string; name: string; story: string };
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
  const busy = selectBusy(p.state);
  const exhausted = selectExhausted(p.state);
  const done = selectDoneCount(p.state);
  const captureLabel = exhausted ? 'Hết lượt hôm nay' : busy ? COPY.progress(done) : COPY.capture;
  return createPortal(
    <div className="modal-backdrop lookbook-dialog" data-state="open">
      <div ref={ref} className="lookbook-shell" role="dialog" aria-modal="true" aria-label={COPY.title} tabIndex={-1}>
        <aside className="lookbook-panel">
          <header className="lookbook-panel-head">
            <h2>{COPY.title}</h2>
            <button type="button" onClick={p.onClose}>{COPY.close}</button>
          </header>
          <LookbookModelPicker inputs={p.inputs} gender={p.gender} gate={p.gate} />
          <LookbookGarmentPicker garments={p.garments} selectedId={p.garment.id} disabled={busy} onSelect={p.onGarment} />
          <LookbookMoodPicker inputs={p.inputs} eventName={p.eventName} />
          <LookbookToolbar state={p.state} garmentId={p.garment.id} garmentName={p.garment.name} onCancel={p.onCancel} />
        </aside>
        <div className="lookbook-frame">
          <img className="lookbook-frame-art" src={asset('assets/screens/studio/lookbook-frame.png')} alt="" aria-hidden="true" />
          <LookbookSlotGrid state={p.state} garmentName={p.garment.name} onOpen={p.onOpenSlot} onRetry={p.onRetry} />
          <div className="lookbook-frame-progress" role="status" aria-live="polite">
            {busy && <span className="lookbook-frame-bar" style={{ width: `${(done / 4) * 100}%` }} aria-hidden="true" />}
            <span>{statusLine(p.state, p.disabledReason)}</span>
          </div>
          <button type="button" className="lookbook-frame-btn is-capture" aria-label={captureLabel}
            disabled={busy || exhausted || p.disabledReason !== undefined} onClick={p.onCapture} />
          <button type="button" className="lookbook-frame-btn is-save" aria-label={COPY.save} onClick={p.onSave} />
          <div className="lookbook-frame-story" tabIndex={0} role="region" aria-label={COPY.storyHeading}>
            <strong>{p.garment.name}</strong> · {p.garment.story}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
