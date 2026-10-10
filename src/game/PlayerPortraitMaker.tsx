import { useEffect, useRef, useState } from 'react';
import { callAi } from './ai-client';
import { toDownscaledDataUrl } from '../ui/image-upload';
import { PlayerPortrait, clearPlayerPortrait, pixelatePortrait, savePlayerPortrait, usePlayerPortrait, PORTRAIT_GRID } from './player-portrait';

type Status = 'idle' | 'drawing' | 'preview' | 'blocked' | 'failed';
type Fallback = { reason?: string; check?: { onePerson?: boolean; faceVisible?: boolean; looksAdult?: boolean } };

function blockedText(check: Fallback['check']): string {
  if (check?.onePerson === false) return 'Ảnh cần đúng một người, thấy rõ mặt.';
  if (check?.faceVisible === false) return 'Tiệm chưa thấy rõ khuôn mặt. Bạn thử ảnh chụp thẳng, đủ sáng nhé.';
  if (check?.looksAdult === false) return 'Tiệm chỉ vẽ chân dung từ ảnh người lớn.';
  return 'Tiệm chưa vẽ được từ ảnh này. Bạn thử một ảnh khác nhé.';
}

/** "Chân dung pixel" step of the welcome upload panel: female only for now (male art is not drawn yet). */
export function PlayerPortraitMaker({ file, consent }: { file: File | null; consent: boolean }) {
  const saved = usePlayerPortrait();
  const [status, setStatus] = useState<Status>('idle');
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  // A new photo makes any unsaved preview stale.
  useEffect(() => { request.current?.abort(); setDraft(null); setStatus('idle'); setMessage(''); }, [file]);

  async function draw() {
    if (!file || !consent || status === 'drawing') return;
    const controller = new AbortController(); request.current = controller;
    setStatus('drawing'); setMessage(''); setDraft(null);
    try {
      const { dataUrl } = await toDownscaledDataUrl(file, 1024, 0.85);
      const result = await callAi<{ image: string }, Fallback>('/api/ai/avatar-portrait', { personImage: dataUrl }, controller.signal);
      if (controller.signal.aborted) return;
      if (result.status === 'fallback') {
        const blocked = result.fallback?.reason === 'safety_blocked';
        setStatus(blocked ? 'blocked' : 'failed');
        setMessage(blocked ? blockedText(result.fallback?.check) : 'Gemini đang bận, bạn thử lại sau ít phút nhé.');
        return;
      }
      setDraft(await pixelatePortrait(result.data.image));
      setStatus('preview');
    } catch {
      if (controller.signal.aborted) return;
      setStatus('failed'); setMessage('Tiệm chưa vẽ được chân dung. Bạn thử lại nhé.');
    }
  }

  function keep() {
    if (draft && savePlayerPortrait(draft)) { setDraft(null); setStatus('idle'); setMessage('Đã lưu chân dung. Bạn sẽ thấy nó trên thanh trên cùng và khi An trò chuyện.'); }
    else setMessage('Trình duyệt đang chặn lưu trữ nên chưa lưu được chân dung.');
  }

  return <section className="portrait-maker" aria-labelledby="portrait-maker-h">
    <h3 id="portrait-maker-h">Chân dung pixel của bạn</h3>
    <div className="portrait-gender" role="group" aria-label="Giới tính nhân vật">
      <button type="button" aria-pressed="true">Nữ</button>
      <button type="button" disabled aria-pressed="false">Nam<small>Sắp có</small></button>
    </div>
    <p className="portrait-note">Gemini vẽ một chân dung pixel theo nét của bạn, cùng phong cách nhân vật trong tiệm. Nhân vật đi lại trong game vẫn là An.</p>
    <div className="portrait-actions">
      <button type="button" className="primary" onClick={() => void draw()} disabled={!file || !consent || status === 'drawing'}>
        {status === 'drawing' ? 'Gemini đang vẽ…' : draft ? 'Vẽ lại' : 'Vẽ chân dung pixel'}
      </button>
      {saved && !draft && <button type="button" onClick={clearPlayerPortrait}>Xoá chân dung đã lưu</button>}
    </div>
    {!consent && file && <p className="portrait-note">Tick đồng ý ở trên để Gemini xem ảnh của bạn.</p>}
    {draft && <div className="portrait-preview">
      <img className="player-portrait" src={draft} alt="Chân dung pixel vừa vẽ" width={PORTRAIT_GRID} height={PORTRAIT_GRID} />
      <div className="portrait-actions">
        <button type="button" className="primary" onClick={keep}>Dùng chân dung này</button>
        <button type="button" onClick={() => { setDraft(null); setStatus('idle'); }}>Bỏ</button>
      </div>
    </div>}
    {!draft && saved && <div className="portrait-preview"><PlayerPortrait /><p className="portrait-note">Chân dung đang dùng. Chỉ lưu trên thiết bị này; ảnh gốc không được lưu.</p></div>}
    {message && <p className={status === 'blocked' || status === 'failed' ? 'portrait-error' : 'portrait-note'} role="status">{message}</p>}
  </section>;
}
