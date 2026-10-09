import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import { downloadBlob } from './lookbook-export';
import { COPY } from './lookbook-copy';
import type { LookbookAngleId } from '../server/ai/lookbook-contract.ts';

const EXT: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };

/** Enlarged AI photo. Replaces the dialog (one Modal at a time) and is portalled to body so the HUD never covers it. */
export function LookbookLightbox({ angle, label, garmentId, garmentName, image, onBack }: {
  angle: LookbookAngleId; label: string; garmentId: string; garmentName: string; image: string; onBack: () => void;
}) {
  const download = async () => {
    const mime = /^data:image\/(png|jpeg|webp);/.exec(image)?.[1] ?? 'png';
    downloadBlob(await (await fetch(image)).blob(), `lookbook-${garmentId}-${angle}.${EXT[mime]}`);
  };
  return createPortal(
    <Modal title={`${label} · ${garmentName}`} wide className="lookbook-lightbox" onClose={onBack}>
      <img className="lookbook-lightbox-img" src={image} alt={COPY.slotAlt(label, garmentName)} />
      <p className="lookbook-note">{COPY.aiGenerated}</p>
      <div className="lookbook-actions">
        <button type="button" onClick={() => void download()}>{COPY.download}</button>
        <button type="button" onClick={onBack}>{COPY.back}</button>
      </div>
    </Modal>,
    document.body
  );
}
