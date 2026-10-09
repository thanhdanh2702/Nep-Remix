// Lookbook PNG export (1080x1350 poster of the 4 AI photos), download and Web Share. Browser-only.
export interface LookbookExportImage { label: string; src: string }
export interface LookbookExportInput { garmentId: string; garmentName: string; images: LookbookExportImage[] }

const W = 1080, H = 1350;
const INK = '#2b2035', PAPER = '#fff1df', MUTED = '#74506e';
const TILE_W = 414, TILE_H = 552, GAP = 16, X0 = 118, Y0 = 140;
// Concrete family names (CSS vars do not resolve inside canvas).
const FONT_TITLE = '64px "VT323"';
const BODY = '"Be Vietnam Pro"';

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

/** Shrinks `size` by 2px until the text fits `maxWidth` (never below `min`); still too wide -> cut with an ellipsis. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, min: number, maxWidth: number): string {
  let px = size;
  const font = () => `${weight} ${px}px ${BODY}`;
  ctx.font = font();
  while (ctx.measureText(text).width > maxWidth && px - 2 >= min) { px -= 2; ctx.font = font(); }
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export async function exportLookbookPng(input: LookbookExportInput): Promise<Blob> {
  await Promise.all([
    document.fonts.load(FONT_TITLE),
    document.fonts.load(`600 28px ${BODY}`),
    document.fonts.load(`600 18px ${BODY}`),
    document.fonts.load(`400 20px ${BODY}`)
  ]);
  const photos = await Promise.all(input.images.slice(0, 4).map(i => loadImage(i.src)));
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = FONT_TITLE;
  ctx.fillText('Lookbook · Tiệm May Nếp', W / 2, 92);

  photos.forEach((photo, index) => {
    const x = X0 + (index % 2) * (TILE_W + GAP), y = Y0 + Math.floor(index / 2) * (TILE_H + GAP);
    drawCover(ctx, photo, x, y, TILE_W, TILE_H);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const label = fitText(ctx, input.images[index].label, 600, 18, 14, 380);
    const chipW = ctx.measureText(label).width + 16, chipH = 34;
    ctx.fillStyle = INK; ctx.fillRect(x + 8, y + TILE_H - 8 - chipH, chipW, chipH);
    ctx.fillStyle = PAPER; ctx.fillText(label, x + 16, y + TILE_H - 8 - 10);
  });

  ctx.textAlign = 'center'; ctx.fillStyle = INK;
  ctx.fillText(fitText(ctx, input.garmentName, 600, 28, 18, 1000), W / 2, 1300);
  ctx.fillStyle = MUTED;
  ctx.fillText(fitText(ctx, 'Ảnh do AI tạo · Google Gemini · Tiệm May Nếp 2026', 400, 20, 18, 1000), W / 2, 1334);

  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

export const exportFileName = (garmentId: string): string => `lookbook-${garmentId}.png`;

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canShareFiles = (): boolean =>
  typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'lookbook.png', { type: 'image/png' })] });

export async function shareLookbook(blob: Blob, name: string): Promise<void> {
  const file = new File([blob], name, { type: 'image/png' });
  try {
    await navigator.share({ files: [file], title: 'Lookbook Tiệm May Nếp', text: 'Bộ ảnh áo dài của tôi ở Tiệm May Nếp (ảnh do AI tạo).' });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
  }
}
