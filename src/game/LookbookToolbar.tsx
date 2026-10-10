import { useState } from 'react';
import { LOOKBOOK_ANGLE_IDS } from '../server/ai/lookbook-contract.ts';
import { selectAllDone, selectBadge, selectBusy, type LookbookState } from './lookbook-state';
import { AiStatusBadge } from './AiStatusBadge';
import { angleLabel } from './LookbookSlotGrid';
import { canShareFiles, downloadBlob, exportFileName, exportLookbookPng, shareLookbook } from './lookbook-export';
import { COPY } from './lookbook-copy';

/** Cancel while running; PNG export + share once all 4 AI photos exist. Status + disclosure always. */
export function LookbookToolbar({ state, garmentId, garmentName, onCancel }: {
  state: LookbookState; garmentId: string; garmentName: string; onCancel: () => void;
}) {
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = selectBusy(state);
  const allDone = selectAllDone(state);
  const finished = state.phase === 'finished';

  const build = async () => exportLookbookPng({
    garmentId, garmentName,
    images: LOOKBOOK_ANGLE_IDS.map(id => ({ label: angleLabel(id), src: state.slots[id].image ?? '' }))
  });
  const run = async (action: (blob: Blob, name: string) => void | Promise<void>) => {
    setWorking(true); setFailed(false);
    try { await action(await build(), exportFileName(garmentId)); } catch { setFailed(true); }
    setWorking(false);
  };

  return <div className="lookbook-toolbar">
    <div className="lookbook-actions">
      {busy && <button type="button" onClick={onCancel}>{COPY.cancel}</button>}
      {!busy && <button type="button" className={allDone ? 'primary' : ''} aria-label={COPY.exportPng} disabled={!allDone || working} onClick={() => void run(downloadBlob)}>⇩ {COPY.exportPng}</button>}
      {allDone && canShareFiles() && <button type="button" disabled={working} onClick={() => void run(shareLookbook)}>{COPY.share}</button>}
    </div>
    {failed && <p className="lookbook-error" role="alert">{COPY.exportFailed}</p>}
    {finished && <p className="lookbook-note">
      <AiStatusBadge status={selectBadge(state)} offlineText="ảnh pixel" />
      {state.firstImageMs !== undefined && <> {COPY.firstImage(state.firstImageMs)}</>}
    </p>}
    <p className="lookbook-note is-small">{COPY.disclosure}</p>
  </div>;
}
