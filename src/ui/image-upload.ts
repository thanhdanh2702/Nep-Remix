// Shared image intake for AI uploads (selfie, Xưởng may): validate, then downscale on the
// device so the server only ever receives a small JPEG (also keeps base64 under the 6 MB body limit).
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES) {
    return 'Chọn ảnh JPG, PNG hoặc WEBP, dung lượng tối đa 5 MB nhé.';
  }
  return null;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Decode `file`, fit its longest side into `maxSide` px and re-encode as JPEG. Throws when the image cannot be decoded. */
export async function toDownscaledDataUrl(file: File, maxSide = 768, quality = 0.85): Promise<{ dataUrl: string; mimeType: 'image/jpeg' }> {
  const { source, width, height, release } = await decode(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), mimeType: 'image/jpeg' };
  } finally {
    release();
  }
}
