import { useRef } from 'react';
import type { LookbookInputs, PhotoGate } from './use-lookbook-dialog';
import { COPY, checkProblems } from './lookbook-copy';

const isDataImage = (src: string | undefined): src is string => typeof src === 'string' && src.startsWith('data:image/');

function GateStatus({ gate, inputs }: { gate: PhotoGate; inputs: LookbookInputs }) {
  if (gate.status === 'none') return null;
  const useShop = <button type="button" onClick={() => inputs.setMode('fictional')}>{COPY.useShop}</button>;
  return <div className={`lookbook-gate is-${gate.status}`} role="status">
    {gate.status === 'checking' && <p>{COPY.checking}</p>}
    {gate.status === 'ok' && <p>{COPY.checkOk}</p>}
    {gate.status === 'warn' && <p>{COPY.checkWarn}</p>}
    {gate.status === 'block' && <><ul>{checkProblems(gate.check).map(p => <li key={p}>{p}</li>)}</ul>{useShop}</>}
    {gate.status === 'unavailable' && <><p>{COPY.checkUnavailable}</p><button type="button" onClick={inputs.recheck}>{COPY.recheck}</button>{useShop}</>}
  </div>;
}

export function LookbookModelPicker({ inputs, gender, gate }: { inputs: LookbookInputs; gender: 'female' | 'male'; gate: PhotoGate }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { mode, person } = inputs;
  return <section className="lookbook-section" aria-labelledby="lookbook-model-h">
    <h3 id="lookbook-model-h">{COPY.modelHeading}</h3>
    <div className="lookbook-toggle-row" role="group" aria-label={COPY.modeGroupLabel}>
      <button type="button" aria-pressed={mode === 'fictional'} onClick={() => inputs.setMode('fictional')}>{COPY.modeShop}</button>
      <button type="button" aria-pressed={mode === 'personal'} onClick={() => inputs.setMode('personal')}>{COPY.modeMine}</button>
    </div>
    {mode === 'fictional'
      ? <p className="lookbook-note">{COPY.shopNote(gender)}</p>
      : <div className="lookbook-person">
        <div className="lookbook-thumb is-portrait">
          {isDataImage(person) ? <img src={person} alt="Ảnh của bạn" /> : <span>{COPY.noPhoto}</span>}
        </div>
        <div className="lookbook-person-side">
          <div className="lookbook-actions">
            <button type="button" onClick={() => fileRef.current?.click()}>{person ? COPY.pickOtherPhoto : COPY.pickPhoto}</button>
            {person && <button type="button" onClick={inputs.clearPerson}>{COPY.removePhoto}</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (file) void inputs.pickPerson(file); }} />
          <p className="lookbook-note is-small">{COPY.photoHint}</p>
          {inputs.personError && <p className="lookbook-error" role="alert">{inputs.personError}</p>}
        </div>
        {person && <label className="lookbook-consent">
          <input type="checkbox" checked={inputs.consent} onChange={e => inputs.setConsent(e.currentTarget.checked)} />
          <span>{COPY.consent}</span>
        </label>}
        <GateStatus gate={gate} inputs={inputs} />
      </div>}
  </section>;
}
