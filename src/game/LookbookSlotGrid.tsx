import { LOOKBOOK_ANGLE_IDS, type LookbookAngleId } from '../server/ai/lookbook-contract.ts';
import { loadLookbookStyle } from '../content/lookbook-style';
import { selectExhausted, type LookbookSlot, type LookbookState } from './lookbook-state';
import { COPY, LOOKBOOK_REASON_TEXT } from './lookbook-copy';

const isDataImage = (src: string | undefined): src is string => typeof src === 'string' && src.startsWith('data:image/');

export function angleLabel(id: LookbookAngleId): string {
  return loadLookbookStyle().angles.find(a => a.id === id)?.labelVi ?? id;
}

function SlotBody({ slot, label, garmentName, retryDisabled, canRetry, onOpen, onRetry }: {
  slot: LookbookSlot; label: string; garmentName: string; retryDisabled: boolean; canRetry: boolean;
  onOpen: (id: LookbookAngleId) => void; onRetry: (id: LookbookAngleId) => void;
}) {
  if (slot.status === 'done' && isDataImage(slot.image)) {
    return <>
      <button type="button" className="lookbook-slot-open" aria-label={COPY.openAngle(label)} onClick={() => onOpen(slot.id)}>
        <img className="lookbook-slot-img" src={slot.image} alt={COPY.slotAlt(label, garmentName)} />
      </button>
      <span className="lookbook-chip is-ai">{COPY.aiLabel}</span>
      {canRetry && <button type="button" className="lookbook-slot-redo" aria-label={COPY.retryAngle(label)} disabled={retryDisabled} onClick={() => onRetry(slot.id)}>↻</button>}
    </>;
  }
  if (slot.status === 'error') {
    return <div className="lookbook-slot-fail">
      <p className="lookbook-slot-error">{LOOKBOOK_REASON_TEXT[slot.reason ?? 'ai_unavailable']}</p>
      {canRetry && <button type="button" aria-label={COPY.retryAngle(label)} disabled={retryDisabled} onClick={() => onRetry(slot.id)}>{COPY.retry}</button>}
    </div>;
  }
  const text = slot.status === 'generating' ? COPY.slotGenerating : slot.status === 'queued' ? COPY.slotQueued : COPY.slotIdle;
  return <p className="lookbook-slot-text">{text}</p>;
}

/** Four slots laid over the painted frame. Positions come from lookbook.css (.lookbook-frame-slot[data-angle]). */
export function LookbookSlotGrid({ state, garmentName, onOpen, onRetry }: {
  state: LookbookState; garmentName: string; onOpen: (id: LookbookAngleId) => void; onRetry: (id: LookbookAngleId) => void;
}) {
  const running = state.phase === 'running';
  const canRetry = !selectExhausted(state);
  return <div className="lookbook-frame-slots">
    {LOOKBOOK_ANGLE_IDS.map(id => {
      const slot = state.slots[id];
      const label = angleLabel(id);
      return <figure key={id} className="lookbook-slot lookbook-frame-slot" data-angle={id} data-status={slot.status}
        aria-busy={slot.status === 'generating' ? true : undefined}>
        <SlotBody slot={slot} label={label} garmentName={garmentName} canRetry={canRetry} retryDisabled={running}
          onOpen={onOpen} onRetry={onRetry} />
        <figcaption className="lookbook-chip is-label">{label}</figcaption>
      </figure>;
    })}
  </div>;
}
