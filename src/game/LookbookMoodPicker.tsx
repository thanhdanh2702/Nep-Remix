import { useRef } from 'react';
import { loadLookbookStyle } from '../content/lookbook-style';
import type { LookbookInputs } from './use-lookbook-dialog';
import { COPY } from './lookbook-copy';

export function LookbookMoodPicker({ inputs, eventName }: { inputs: LookbookInputs; eventName: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { mood, background } = inputs;
  return <section className="lookbook-section" aria-labelledby="lookbook-mood-h">
    <h3 id="lookbook-mood-h">❀ Bối cảnh</h3>
    <div className="lookbook-mood-grid" role="group" aria-label={COPY.moodGroupLabel}>
      {[...loadLookbookStyle().moods].sort((a, b) => ['san-nha', 'pho-co', 'vuon-hoa', 'tuong-voi', 'custom'].indexOf(a.id) - ['san-nha', 'pho-co', 'vuon-hoa', 'tuong-voi', 'custom'].indexOf(b.id)).map(m =>
        <button key={m.id} type="button" className={'lookbook-mood-' + m.id} aria-pressed={mood === m.id} onClick={() => inputs.setMood(m.id)}>
          {m.id !== 'custom' && <span className="lookbook-mood-thumbnail" data-mood={m.id} aria-hidden="true" />}
          <span>{m.labelVi}</span>
        </button>)}
    </div>
    {mood === 'custom' && <div className="lookbook-bg-row">
      <div className="lookbook-thumb is-landscape">
        {background?.startsWith('data:image/') ? <img src={background} alt="Ảnh nền của bạn" /> : <span>{COPY.noPhoto}</span>}
      </div>
      <div className="lookbook-actions">
        <button type="button" onClick={() => fileRef.current?.click()}>{COPY.pickBackground}</button>
        {background && <button type="button" onClick={inputs.clearBackground}>{COPY.removeBackground}</button>}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
        onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (file) void inputs.pickBackground(file); }} />
      {inputs.backgroundError && <p className="lookbook-error" role="alert">{inputs.backgroundError}</p>}
    </div>}
    <p className="lookbook-note">{COPY.eventNote(eventName)}</p>
  </section>;
}
