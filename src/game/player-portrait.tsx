// The player's pixel portrait (drawn by Gemini from their own photo, with consent). Only this small
// pixelated PNG is kept on the device; the photo itself is never stored. Clearing it restores An.
import { useSyncExternalStore } from 'react';
import './player-portrait.css';

const STORAGE_KEY = 'tiem-may-nep-player-portrait';
const CHANGE_EVENT = 'tiem-may-nep-portrait-change';
/** Pixel grid of the stored portrait; drawn larger with `image-rendering: pixelated`. */
export const PORTRAIT_GRID = 96;
/** Colour steps per channel after downscaling: enough for skin tones, few enough to read as pixel art. */
const COLOR_STEPS = 10;

function read(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function notify() { window.dispatchEvent(new Event(CHANGE_EVENT)); }

export function savePlayerPortrait(dataUrl: string): boolean {
  try { localStorage.setItem(STORAGE_KEY, dataUrl); notify(); return true; } catch { return false; }
}

export function clearPlayerPortrait(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage blocked: nothing was kept */ }
  notify();
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener(CHANGE_EVENT, onChange); window.removeEventListener('storage', onChange); };
}

export function usePlayerPortrait(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Snaps Gemini's "pixel-art style" image onto a real pixel grid: smooth downscale, then fewer colour steps. */
export async function pixelatePortrait(source: string): Promise<string> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = PORTRAIT_GRID;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, PORTRAIT_GRID, PORTRAIT_GRID);
  const pixels = ctx.getImageData(0, 0, PORTRAIT_GRID, PORTRAIT_GRID);
  const step = 255 / (COLOR_STEPS - 1);
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.round(Math.round(pixels.data[i + c] / step) * step);
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Renders the saved portrait, or nothing when the player has not made one. */
export function PlayerPortrait({ className = '', label = 'Chân dung pixel của bạn' }: { className?: string; label?: string }) {
  const portrait = usePlayerPortrait();
  if (!portrait) return null;
  return <img className={`player-portrait ${className}`} src={portrait} alt={label} width={PORTRAIT_GRID} height={PORTRAIT_GRID} />;
}
