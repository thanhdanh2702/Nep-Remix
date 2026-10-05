import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { StudioDraft } from '../core';
import type { Garment } from '../content/schema';
import type { GarmentAnalysisFallback, GarmentAnalysisSuccessResponse } from '../server/ai/analyze-garment';
import { validateImageFile, toDownscaledDataUrl } from '../ui/image-upload';
import { content } from './store';
import { callAi, type AiResult } from './ai-client';
import { AiStatusBadge } from './AiStatusBadge';
import { makeDraft } from './Studio';
import './studio-ai.css';
import './workshop.css';

type Analysis = AiResult<GarmentAnalysisSuccessResponse, GarmentAnalysisFallback>;

const COLLARS: Record<string, string> = { dung: 'Cổ đứng', tron: 'Cổ tròn', thuyen: 'Cổ thuyền', la_sen: 'Cổ lá sen' };
const PATTERNS: Record<string, string> = { tron: 'Vải trơn', hoa_tiet: 'Hoa lá', theu: 'Thêu tay' };
const FOREIGN: Record<string, string> = { qipao_cheongsam: 'sườn xám (qipao) Trung Quốc', hanbok: 'hanbok Hàn Quốc', khac: 'một trang phục khác' };
const isHex = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const darken = (hex: string) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.65).toString(16).padStart(2, '0')).join('');

/** Exact garment if unlocked, else an unlocked one with the same silhouette, else the first unlocked. */
function pickGarment(unlockedIds: string[], garmentId?: string, silhouette?: string) {
  const owned = unlockedIds.map(id => content.garmentsById.get(id)).filter((g): g is Garment => !!g);
  const exact = owned.find(g => g.id === garmentId);
  return { garment: exact ?? owned.find(g => g.silhouette === silhouette) ?? owned[0], inCloset: !!exact };
}

export function Workshop({ unlockedGarmentIds, onStudio }: { unlockedGarmentIds: string[]; onStudio: (draft: StudioDraft) => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seq = useRef(0);
  useEffect(() => () => abortRef.current?.abort(), []);

  const pick = async (file?: File) => {
    if (!file) return;
    abortRef.current?.abort();
    const mine = ++seq.current;
    setBusy(false); setResult(null); setImage(null); setError('');
    const problem = validateImageFile(file);
    if (problem) { setError(problem); return; }
    try {
      const { dataUrl } = await toDownscaledDataUrl(file);
      if (mine === seq.current) setImage(dataUrl);
    } catch { if (mine === seq.current) setError('Không đọc được ảnh này, bạn thử ảnh khác nhé.'); }
  };
  const onDrop = (event: DragEvent) => { event.preventDefault(); void pick(event.dataTransfer.files[0]); };

  const analyze = async () => {
    if (!image || busy) return;
    abortRef.current?.abort();
    const controller = abortRef.current = new AbortController();
    setBusy(true); setResult(null);
    const response = await callAi<GarmentAnalysisSuccessResponse, GarmentAnalysisFallback>('/api/ai/analyze-garment', { imageBase64: image.split(',')[1], mimeType: 'image/jpeg' }, controller.signal);
    if (controller.signal.aborted) return;
    setBusy(false); setResult(response);
  };

  const manual = () => onStudio(makeDraft(pickGarment(unlockedGarmentIds).garment));
  const data = result && result.status !== 'fallback' ? result.data : null;
  const fits = data?.isVietnameseAoDai ? pickGarment(unlockedGarmentIds, data.garmentId, data.identifiedSilhouette) : null;
  const tryOn = () => {
    if (!fits) return;
    const draft = makeDraft(fits.garment);
    if (isHex(data?.dominantColorHex) && isHex(data?.secondaryColorHex)) draft.colorPalette = [data.dominantColorHex, data.secondaryColorHex, darken(data.dominantColorHex), darken(data.secondaryColorHex)];
    onStudio(draft);
  };

  return <div className="workshop">
    <label className="workshop-drop" onDragOver={event => event.preventDefault()} onDrop={onDrop}>
      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh áo" onChange={event => { void pick(event.target.files?.[0]); event.target.value = ''; }} />
      <span>{image ? 'Chọn ảnh khác' : 'Chọn hoặc thả ảnh áo vào đây'}</span>
    </label>
    <p className="fine-print">Ảnh chỉ dùng để nhận diện, không được lưu.</p>
    {error && <p role="alert" className="workshop-error">{error}</p>}
    {image && <img className="workshop-preview" src={image} alt="Ảnh áo bạn đã chọn" />}
    {image && <button className="primary workshop-go" disabled={busy} aria-busy={busy} onClick={analyze}>Nhờ Gemini xem áo</button>}
    <div aria-live="polite" className="workshop-result">
      {busy && <p>Máy may đang soi từng đường chỉ…</p>}
      {result && <p><AiStatusBadge status={result.status} offlineText="chọn thủ công" /></p>}
      {result?.status === 'fallback' && <><p>{result.fallback?.message ?? 'Không phân tích được áo lúc này.'}</p><button onClick={manual}>Tự chọn trong Phòng phối đồ</button></>}
      {data && fits && <article className="workshop-card">
        <h3>{content.garmentsById.get(data.garmentId ?? '')?.name ?? 'Áo dài Việt'}</h3>
        <p>{[COLLARS[data.collarType ?? ''], PATTERNS[data.patternType ?? '']].filter(Boolean).join(' · ')}</p>
        <div className="studio-ai-swatches">{[data.dominantColorHex, data.secondaryColorHex].filter(isHex).map((hex, i) => <span key={i} style={{ background: hex }} title={hex} />)}</div>
        {!fits.inCloset && <p className="fine-print">Dáng này chưa có trong tủ. Tiệm dùng {fits.garment.name} để phối thử.</p>}
        <button className="primary" onClick={tryOn}>Phối thử trong Phòng phối đồ</button>
      </article>}
      {data && !fits && <article className="workshop-card">
        <h3>Đây là {FOREIGN[data.garmentCategory] ?? FOREIGN.khac}</h3>
        {data.differentiationTitle && <p><strong>{data.differentiationTitle}</strong></p>}
        <p>{data.differentiationExplanation}</p>
      </article>}
    </div>
  </div>;
}
