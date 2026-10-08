import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { StudioDraft } from '../core';
import { LOOKBOOK_ANGLE_IDS, LOOKBOOK_EVENT_IDS, type LookbookAngleId } from '../server/ai/lookbook-contract.ts';
import { content } from './store';
import { asset } from './assets';
import { AiStatusBadge } from './AiStatusBadge';
import { useLookbookSession, type LookbookCaptureInput } from './lookbook-session';
import { selectBadge, selectBusy, selectDoneCount, selectExhausted } from './lookbook-state';
import { useLookbookInputs, type PhotoGate } from './use-lookbook-dialog';
import { LookbookDialog } from './LookbookDialog';
import { LookbookLightbox } from './LookbookLightbox';
import { angleLabel } from './LookbookSlotGrid';
import { COPY } from './lookbook-copy';
import './studio-ai.css';
import './lookbook.css';

export interface StudioLookbookAiProps {
  draft: StudioDraft;
  gender: 'female' | 'male';
  eventId: string;
  eventName: string;
  open: boolean;
  onClose: () => void;
  openerRef: RefObject<HTMLButtonElement | null>;
  onSave: () => void;
  children: ReactNode;
  actions: ReactNode;
}

/** Side panel (4 pixel portraits, or the AI photos once shot) + the Lookbook dialog/lightbox (portalled to body). */
export function StudioLookbookAi({ draft, gender, eventId, eventName, open, onClose, openerRef, onSave, children, actions }: StudioLookbookAiProps) {
  const { state, capture, retry, cancel, checkPhoto } = useLookbookSession();
  const inputs = useLookbookInputs(checkPhoto, () => { if (selectBusy(state) || state.check) cancel(); });
  const [enlarged, setEnlarged] = useState<LookbookAngleId | null>(null);
  const [showPixel, setShowPixel] = useState(false);
  const capturing = useRef(false); // double-click guard: one stream at a time
  const garment = content.garmentsById.get(draft.garmentId);
  const garmentName = garment?.name ?? 'Áo truyền thống';
  const eventKey = LOOKBOOK_EVENT_IDS.find(id => id === eventId) ?? 'dao_pho';
  const accessoryIds = [...new Set(Object.values(draft.equippedAccessories).filter((id): id is string => !!id))].slice(0, 4);

  const buildInput = (noCache: boolean): LookbookCaptureInput => ({
    mode: inputs.mode,
    modelGender: gender,
    ...(inputs.mode === 'personal' && inputs.person ? { personImage: inputs.person } : {}),
    ...(inputs.mood === 'custom' && inputs.background ? { backgroundImage: inputs.background } : {}),
    garmentId: draft.garmentId,
    colorPalette: draft.colorPalette.map(c => c.toLowerCase()) as LookbookCaptureInput['colorPalette'],
    accessoryIds,
    eventId: eventKey,
    moodId: inputs.mood,
    ...(noCache ? { noCache: true } : {})
  });

  // A different outfit or event makes the shots stale: cancel and show the live pixel panel again.
  const outfitKey = JSON.stringify([draft.garmentId, draft.colorPalette, accessoryIds, eventKey]);
  const lastOutfit = useRef(outfitKey);
  useEffect(() => {
    if (lastOutfit.current === outfitKey) return;
    lastOutfit.current = outfitKey;
    cancel();
    setShowPixel(false);
  }, [outfitKey, cancel]);

  const gate: PhotoGate = inputs.mode === 'personal' && state.check?.verdict === 'block' ? { status: 'block', check: state.check } : inputs.gate;
  const personalReady = inputs.person !== undefined && inputs.consent && (gate.status === 'ok' || gate.status === 'warn');
  const disabledReason = inputs.mode === 'personal' && !personalReady ? COPY.needPhoto
    : inputs.mood === 'custom' && !inputs.background ? COPY.needBackground : undefined;

  const startCapture = async () => {
    if (capturing.current || disabledReason !== undefined) return;
    capturing.current = true;
    setShowPixel(false);
    try { await capture(buildInput(state.phase === 'finished')); } finally { capturing.current = false; }
  };
  const retryAngle = (id: LookbookAngleId) => { setShowPixel(false); void retry(id, buildInput(false)); };
  const close = () => {
    if (selectBusy(state)) cancel();
    setEnlarged(null);
    onClose();
    openerRef.current?.focus();
  };
  const save = () => { onSave(); setEnlarged(null); onClose(); openerRef.current?.focus(); };

  const done = selectDoneCount(state);
  const showAi = done > 0 && !showPixel;
  const busy = selectBusy(state);
  const enlargedImage = enlarged ? state.slots[enlarged].image : undefined;

  return <>
    <div className="studio-lookbook-board">
      <div className="studio-lookbook-art" aria-hidden="true">
        <img className="art-hires" src={asset('assets/screens/studio/lookbook-frame.png')} alt="" />
      </div>
      <div className="studio-lookbook-grid">
        {showAi
          ? LOOKBOOK_ANGLE_IDS.filter(id => state.slots[id].status === 'done').map(id => <figure key={id} className="studio-lookbook-card">
            <div className="studio-lookbook-portrait">
              <img className="studio-ai-photo" src={state.slots[id].image} alt={COPY.slotAlt(angleLabel(id), garmentName)} loading="lazy" />
            </div>
            <figcaption>{angleLabel(id)}</figcaption>
          </figure>)
          : children}
      </div>
      <div className="studio-ai-lookbook-status" aria-live="polite">
        {busy && <span>{COPY.progress(done)}</span>}
        {!busy && selectExhausted(state) && <span>{COPY.exhausted}</span>}
        {!busy && !selectExhausted(state) && state.phase === 'finished' && <>
          <AiStatusBadge status={selectBadge(state)} offlineText="ảnh pixel" />
          {done > 0 && <span>{COPY.aiGenerated}</span>}
        </>}
      </div>
    </div>
    <div className="studio-actions" role="group" aria-label="Lưu và tùy chỉnh bộ phối">
      {actions}
      {showAi && <button className="studio-ai-capture" onClick={() => setShowPixel(true)}>{COPY.pixelAgain}</button>}
    </div>
    {open && !(enlarged && enlargedImage) && <LookbookDialog
      state={state} inputs={inputs} gate={gate} gender={gender} eventName={eventName}
      garment={{ id: draft.garmentId, name: garmentName, story: garment?.culturalSummary ?? '' }}
      disabledReason={disabledReason} onCapture={() => void startCapture()} onSave={save} onRetry={retryAngle}
      onOpenSlot={setEnlarged} onCancel={cancel} onClose={close} />}
    {open && enlarged && enlargedImage && <LookbookLightbox angle={enlarged} label={angleLabel(enlarged)} garmentId={draft.garmentId}
      garmentName={garmentName} image={enlargedImage} onBack={() => setEnlarged(null)} />}
  </>;
}
