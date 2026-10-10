import { useEffect, useRef, useState, type RefObject } from 'react';
import type { StudioDraft } from '../core';
import { LOOKBOOK_EVENT_IDS, type LookbookAngleId } from '../server/ai/lookbook-contract.ts';
import { content } from './store';
import { useLookbookSession, type LookbookCaptureInput } from './lookbook-session';
import { selectBusy } from './lookbook-state';
import { useLookbookInputs, type PhotoGate } from './use-lookbook-dialog';
import { LookbookDialog } from './LookbookDialog';
import { LookbookLightbox } from './LookbookLightbox';
import { angleLabel } from './LookbookSlotGrid';
import { COPY } from './lookbook-copy';
import './studio-ai.css';
import './lookbook.css';
import './lookbook-album.css';

export interface StudioLookbookAiProps {
  draft: StudioDraft;
  gender: 'female' | 'male';
  eventId: string;
  eventName: string;
  open: boolean;
  onClose: () => void;
  openerRef: RefObject<HTMLButtonElement | null>;
  onSave: () => void;
  /** Garments the player may wear now (unlocked or lent by a challenge), in wardrobe order. */
  garmentIds: string[];
  onGarment: (id: string) => void;
  playerName: string;
}

/** The LB1 album opens on demand; the same AI session still owns all four angles. */
export function StudioLookbookAi({ draft, gender, eventId, eventName, open, onClose, openerRef, onSave, garmentIds, onGarment, playerName }: StudioLookbookAiProps) {
  const { state, capture, retry, cancel, checkPhoto } = useLookbookSession();
  const inputs = useLookbookInputs(checkPhoto, cancel);
  const [enlarged, setEnlarged] = useState<LookbookAngleId | null>(null);
  const capturing = useRef(false); // double-click guard: one stream at a time
  useEffect(() => {
    if (!open) return;
    const header = document.querySelector<HTMLElement>('.nep-header');
    if (!header) return;
    const wasInert = header.inert;
    header.inert = true;
    return () => { header.inert = wasInert; };
  }, [open]);
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

  // A different outfit or event invalidates the old shots.
  const outfitKey = JSON.stringify([draft.garmentId, draft.colorPalette, accessoryIds, eventKey]);
  const lastOutfit = useRef(outfitKey);
  useEffect(() => {
    if (lastOutfit.current === outfitKey) return;
    lastOutfit.current = outfitKey;
    cancel();
  }, [outfitKey, cancel]);

  const gate: PhotoGate = inputs.mode === 'personal' && state.check?.verdict === 'block' ? { status: 'block', check: state.check } : inputs.gate;
  const personalReady = inputs.person !== undefined && inputs.consent && (gate.status === 'ok' || gate.status === 'warn');
  const disabledReason = inputs.mode === 'personal' && !personalReady ? COPY.needPhoto
    : inputs.mood === 'custom' && !inputs.background ? COPY.needBackground : undefined;

  const startCapture = async () => {
    if (capturing.current || disabledReason !== undefined) return;
    capturing.current = true;
    try { await capture(buildInput(state.phase === 'finished')); } finally { capturing.current = false; }
  };
  const retryAngle = (id: LookbookAngleId) => { void retry(id, buildInput(false)); };
  const close = () => {
    if (selectBusy(state)) cancel();
    setEnlarged(null);
    onClose();
    requestAnimationFrame(() => openerRef.current?.focus());
  };
  const save = () => { onSave(); setEnlarged(null); onClose(); requestAnimationFrame(() => openerRef.current?.focus()); };

  const enlargedImage = enlarged ? state.slots[enlarged].image : undefined;

  return <>
    {open && !(enlarged && enlargedImage) && <LookbookDialog
      state={state} inputs={inputs} gate={gate} gender={gender} eventName={eventName} playerName={playerName}
      colorPalette={draft.colorPalette} garment={{ id: draft.garmentId, name: garmentName, story: garment?.culturalSummary ?? '' }}
      garments={garmentIds.map(id => ({ id, name: content.garmentsById.get(id)?.name ?? id }))} onGarment={onGarment}
      disabledReason={disabledReason} onCapture={() => void startCapture()} onSave={save} onRetry={retryAngle}
      onOpenSlot={setEnlarged} onCancel={cancel} onClose={close} />}
    {open && enlarged && enlargedImage && <LookbookLightbox angle={enlarged} label={angleLabel(enlarged)} garmentId={draft.garmentId}
      garmentName={garmentName} image={enlargedImage} onBack={() => setEnlarged(null)} />}
  </>;
}
