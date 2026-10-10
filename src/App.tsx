import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Game from './game/Game';
import { Modal } from './game/Modal';
import { ErrorBoundary } from './game/ErrorBoundary';
import { restoreGame } from './game/store';
import { AiStatusBadge, type AiBadgeStatus } from './game/AiStatusBadge';
import { PlayerPortraitMaker } from './game/PlayerPortraitMaker';
import { callAi } from './game/ai-client';
import { presetFromSelfie } from './game/avatar-preset';
import { validateImageFile, toDownscaledDataUrl } from './ui/image-upload';
import type { SelfieResult } from './server/ai/analyze-selfie';
import { PixelIcon } from './welcome/PixelIcon';
import welcomeArt from '../assets/screens/welcome/welcome-courtyard.png';
import './welcome/welcome.css';

type Panel = 'about' | 'help' | 'upload' | null;
// Only the AI status and the hair length survive the request; the photo and its data URL never reach state.
type SelfieOutcome = { status: AiBadgeStatus; hairLength?: SelfieResult['hairLength'] };

export default function App() {
  const [entered, setEntered] = useState(false);
  const [hasSave, setHasSave] = useState(() => restoreGame().hasSave);
  const [panel, setPanel] = useState<Panel>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameBlocked, setGameBlocked] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selfie, setSelfie] = useState<SelfieOutcome | null>(null);
  const [applied, setApplied] = useState(false);
  const [pendingAvatarPreset, setPendingAvatarPreset] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  const photoFile = useRef<File | null>(null);
  const analysis = useRef<AbortController | null>(null);
  const entryButton = useRef<HTMLButtonElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);
  useEffect(() => {
    if (entered) hasPlayed.current = true;
    else if (hasPlayed.current) entryButton.current?.focus({ preventScroll: true });
  }, [entered]);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    // The open menu pauses the game, so every way out of it must close it: Esc, a tap
    // outside the header, or the layout switching back to the desktop header.
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setMenuOpen(false); };
    const compact = matchMedia('(max-width: 800px)');
    const resized = () => { if (!compact.matches) setMenuOpen(false); };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', outside);
    compact.addEventListener('change', resized);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', outside);
      compact.removeEventListener('change', resized);
    };
  }, [menuOpen]);

  function openPanel(next: Panel) { setMenuOpen(false); setPanel(next); }
  function startGame() { closePanel(); setMenuOpen(false); setEntered(true); }
  function returnToWelcome() {
    if (gameBlocked) return;
    setHasSave(restoreGame().hasSave); setEntered(false); setMenuOpen(false);
  }
  function resetSelfie() {
    analysis.current?.abort(); analysis.current = null;
    setConsent(false); setAnalyzing(false); setSelfie(null); setApplied(false);
  }
  function clearPhoto() {
    photoRequest.current++; photoFile.current = null;
    resetSelfie(); setPhoto(null); setPhotoError(''); setPhotoLoading(false);
  }
  function closePanel() { if (panel === 'upload') clearPhoto(); setPanel(null); }
  async function selectPhoto(file: File) {
    clearPhoto();
    const request = photoRequest.current;
    setPanel('upload');
    const invalid = validateImageFile(file);
    if (invalid) { setPhotoError(invalid); return; }
    setPhotoLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (request !== photoRequest.current) { URL.revokeObjectURL(url); return; }
      photoFile.current = file;
      setPhoto({ url, name: file.name });
    } catch {
      URL.revokeObjectURL(url);
      if (request === photoRequest.current) setPhotoError('Tiệm chưa mở được ảnh này. Bạn thử chọn một ảnh khác nhé.');
    } finally { if (request === photoRequest.current) setPhotoLoading(false); }
  }
  async function analyzeSelfie() {
    const file = photoFile.current;
    if (!file || !consent || analyzing) return;
    const controller = new AbortController(); analysis.current = controller;
    setAnalyzing(true); setSelfie(null); setApplied(false);
    let outcome: SelfieOutcome = { status: 'fallback' };
    try {
      const { dataUrl, mimeType } = await toDownscaledDataUrl(file);
      if (controller.signal.aborted) return;
      const result = await callAi<SelfieResult>('/api/ai/analyze-selfie', { imageBase64: dataUrl, mimeType }, controller.signal);
      if (controller.signal.aborted) return;
      if (result.status !== 'fallback') outcome = { status: result.status, hairLength: result.data.hairLength };
    } catch { if (controller.signal.aborted) return; }
    analysis.current = null; setAnalyzing(false); setSelfie(outcome);
  }
  function applySelfie() {
    if (!selfie?.hairLength) return;
    // The saved profile is the source of truth for the outfit variant to keep.
    const { tree } = restoreGame();
    const current = tree.nodes[tree.headId].snapshot.profile?.avatarPreset ?? 'an-default';
    setPendingAvatarPreset(presetFromSelfie(selfie.hairLength, current)); setApplied(true);
  }
  function photoChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
    if (file) void selectPhoto(file);
  }
  function upload() { openPanel('upload'); fileInput.current?.click(); }
  const title = panel === 'about' ? 'Chào bạn, tiệm là Nếp!' : panel === 'help' ? 'Ghé tiệm, chơi thế nào?' : panel === 'upload' ? 'Một phiên bản pixel của bạn' : '';

  return <div className={'nep-app ' + (entered ? 'is-playing' : 'is-welcome')}>
    <header ref={header} className="nep-header" inert={Boolean(panel)}>
      <button className="nep-wordmark" onClick={entered ? returnToWelcome : () => setMenuOpen(false)} disabled={entered && gameBlocked} aria-label={entered ? 'Tiệm May Nếp · Về màn chờ' : 'Tiệm May Nếp'}>
        <PixelIcon kind="lotus" /><span>TIỆM MAY NẾP</span>
      </button>
      <button className="nep-menu-toggle" disabled={entered && gameBlocked} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} aria-controls="nep-header-nav" onClick={() => setMenuOpen(!menuOpen)}><PixelIcon kind={menuOpen ? 'close' : 'menu'} /></button>
      <nav id="nep-header-nav" className={'nep-header-nav ' + (menuOpen ? 'is-open' : '')} aria-label="Thông tin về tiệm">
        {entered && <button onClick={returnToWelcome} disabled={gameBlocked} className="nep-return">‹ Màn chờ</button>}
        <button onClick={() => openPanel('about')} disabled={entered && gameBlocked}>Về Nếp</button>
        <button onClick={() => openPanel('help')} disabled={entered && gameBlocked}>Cách chơi</button>
      </nav>
    </header>

    {entered ? <div className="game-stage" inert={Boolean(panel)} aria-label="Khu chơi game">
      <ErrorBoundary onReset={returnToWelcome}>
        <Game embedded paused={Boolean(panel) || menuOpen} onBlockedChange={setGameBlocked} pendingAvatarPreset={pendingAvatarPreset} onAvatarApplied={() => setPendingAvatarPreset(null)} />
      </ErrorBoundary>
    </div> : <main className="nep-welcome" inert={Boolean(panel)}>
      <img className="nep-welcome-art art-hires" src={welcomeArt} alt="Hai nhân vật mặc áo dài trắng và hồng cùng mèo Nếp trong sân tiệm may Việt Nam lúc hoàng hôn" fetchPriority="high" />
      <section className="nep-introduction" aria-labelledby="welcome-title">
        <div className="nep-eyebrow"><span aria-hidden="true">✿</span><span>VIỆT PHỤC REMIX</span><span aria-hidden="true">✿</span></div>
        <h1 id="welcome-title">Áo dài Việt.<br /><span>Chất riêng bạn.</span></h1>
        <p className="nep-tagline">Một tà áo. Muôn câu chuyện.</p>
        <p className="nep-description">Phối áo dài, khám phá chuyện xưa<br />và viết tiếp câu chuyện của bạn.</p>
      </section>
      <div className="nep-entry-actions">
        <button ref={entryButton} className="nep-pixel-button nep-primary" onClick={startGame}><PixelIcon kind="play" /><span>{hasSave ? 'Tiếp tục chơi' : 'Vào game'}</span></button>
        <button className="nep-pixel-button nep-upload" onClick={upload}><PixelIcon kind="upload" /><span>Tải ảnh của bạn</span></button>
        <p className="nep-coming-soon">Tạo nhân vật từ ảnh · Gemini</p>
      </div>
      <p className="nep-scene-note">Bạn sẽ kể câu chuyện nào?</p>
    </main>}

    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={photoChanged} hidden aria-label="Chọn ảnh chân dung" />

    {panel && <div className="nep-dialog-layer"><Modal title={title} onClose={closePanel}>
      {panel === 'about' && <>
        <div className="nep-dialog-emblem"><PixelIcon kind="lotus" /></div>
        <p className="nep-dialog-lead">Một tà áo. Muôn câu chuyện.</p>
        <p>Nếp là một tiệm may nhỏ, nơi bạn có thể thử một bộ áo dài mang chất riêng, khám phá ký ức gia đình và gặp những câu chuyện văn hóa Việt Nam.</p>
        <p>Tiệm mong áo dài trở thành điều gần gũi để người trẻ tự do tìm hiểu, sáng tạo và viết tiếp câu chuyện của mình.</p>
      </>}
      {panel === 'help' && <>
        <p className="nep-dialog-lead">Cứ ghé tiệm, rồi chọn điều bạn muốn khám phá.</p>
        <div className="nep-help-grid"><div><strong>Ngoài sân</strong><p><kbd>W A S D</kbd> hoặc phím mũi tên để đi cùng An.<br /><kbd>E</kbd> để trò chuyện và tương tác khi đến gần.<br />Trên điện thoại: giữ các nút hướng, chạm <b>Tương tác</b> khi đứng gần.</p></div><div><strong>Trong phòng</strong><p>Bấm hoặc chạm vào vật có viền sáng để xem, nhặt hay trò chuyện. Khó thấy thì bấm <b>Soi</b> (hoặc <kbd>Space</kbd>) để vật hiện lên một lúc. Mở <b>Túi đồ</b> để ghép đồ và xem manh mối.</p></div></div>
        <p>Chọn biển <b>Phòng phối đồ</b> để thử bộ phối, nhờ <b>Gợi ý từ Gemini</b> hay chụp <b>Lookbook AI</b>; <b>Cốt truyện</b> để khám phá chiếc rương của bà; <b>Bảo tàng</b> để đọc những câu chuyện về nếp áo; <b>Tủ đồ</b> để xem trang phục, phụ kiện và may thêm ở <b>Xưởng may</b>.</p>
        <p className="nep-dialog-caption">Tiến trình được tự động lưu trên thiết bị bạn đang chơi.</p>
      </>}
      {panel === 'upload' && <>
        <p>Chọn một tấm ảnh của bạn để chuẩn bị cho nhân vật pixel mang nét riêng.</p>
        <div className={'nep-photo-drop ' + (photo ? 'has-photo' : '')} onDragOver={event => event.preventDefault()} onDrop={event => {event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void selectPhoto(file);}}>
          {photo ? <><img src={photo.url} alt="Ảnh bạn đã chọn" /><p className="nep-photo-name">{photo.name}</p></> : <><PixelIcon kind="upload" /><p>Chọn ảnh hoặc thả ảnh vào đây</p></>}
          <button onClick={() => fileInput.current?.click()} disabled={photoLoading}>{photo ? 'Chọn ảnh khác' : 'Chọn ảnh từ thiết bị'}</button>
          <small>JPG, PNG, WEBP · Tối đa 5 MB</small>
        </div>
        {photoLoading && <p role="status">Đang mở ảnh của bạn…</p>}
        {photoError && <p className="nep-photo-error" role="alert">{photoError}</p>}
        <p className="nep-upload-status" role="status"><b>{photo ? 'Đã chọn ảnh. ' : ''}Tạo nhân vật từ ảnh · Gemini</b><br />Bạn có thể vào chơi với nhân vật có sẵn trong tiệm.</p>
        {photo && <section className="nep-selfie" aria-label="Gợi ý diện mạo từ ảnh">
          <label className="nep-consent"><input type="checkbox" checked={consent} disabled={analyzing} onChange={event => setConsent(event.currentTarget.checked)} /><span>Đây là ảnh của chính tôi. Tôi đồng ý gửi ảnh này tới Google Gemini để gợi ý diện mạo và vẽ chân dung pixel. Ảnh không được lưu lại.</span></label>
          <button className="primary" onClick={() => void analyzeSelfie()} disabled={!consent || analyzing}>{analyzing ? 'Gemini đang xem ảnh…' : 'Phân tích bằng Gemini'}</button>
          {selfie && <div className="nep-selfie-result" role="status">
            <AiStatusBadge status={selfie.status} offlineText="chọn diện mạo trong Cài đặt" />
            {selfie.hairLength
              ? <><p>Nếp gợi ý: <b>{selfie.hairLength === 'ngan' ? 'tóc ngắn' : 'tóc dài'}</b></p>{applied ? <p>{entered ? 'Đã chọn diện mạo này.' : 'Đã chọn diện mạo này. Nhân vật sẽ đổi khi bạn vào game.'}</p> : <button onClick={applySelfie}>Dùng diện mạo này</button>}</>
              : <p>Bạn vẫn có thể chọn diện mạo trong Cài đặt.</p>}
          </div>}
          <PlayerPortraitMaker file={photoFile.current} consent={consent} />
        </section>}
        <p className="nep-dialog-caption">Ảnh chỉ được xem trước trên thiết bị của bạn, trừ khi bạn đồng ý và bấm Phân tích. Tiệm không lưu ảnh.</p>
      </>}
      <div className="nep-dialog-actions">{!entered && <button className="nep-pixel-button nep-primary" onClick={startGame}><PixelIcon kind="play" /><span>{hasSave ? 'Tiếp tục chơi' : 'Vào game'}</span></button>}{entered && <button onClick={closePanel}>Tiếp tục khám phá</button>}</div>
    </Modal></div>}
  </div>;
}
