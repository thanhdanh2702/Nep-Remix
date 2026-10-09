// Hooks for the Lookbook dialog. useDialogFocus mirrors Modal.tsx (Escape, Tab trap, initial focus) for the painted frame;
// useLookbookInputs keeps the person / background photos in memory only (never storage) and runs the photo check once per photo.
import { useCallback, useEffect, useRef, useState } from 'react';
import { validateImageFile, toDownscaledDataUrl } from '../ui/image-upload';
import type { LookbookCheckResult, LookbookMode, LookbookMoodId } from '../server/ai/lookbook-contract.ts';
import type { CheckPhotoResult } from './lookbook-session';
import { COPY } from './lookbook-copy';

const FOCUSABLE = 'button:not(:disabled),input:not(:disabled):not([hidden]),select,textarea,a[href],[tabindex="0"]';

/** Escape closes, Tab stays inside, first control gets focus. The caller returns focus to the opener on close. */
export function useDialogFocus(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    (items()[0] ?? root).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items(), first = list[0], last = list[list.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (!root.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; } // focus lost to body (disabled button)
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return ref;
}

export type PhotoGate =
  | { status: 'none' | 'checking' | 'unavailable' }
  | { status: 'ok' | 'warn' | 'block'; check: LookbookCheckResult };

async function readImage(file: File): Promise<{ dataUrl: string } | { error: string }> {
  const invalid = validateImageFile(file);
  if (invalid) return { error: invalid };
  try {
    return { dataUrl: (await toDownscaledDataUrl(file, 1024, 0.85)).dataUrl };
  } catch {
    return { error: COPY.openFailed };
  }
}

export function useLookbookInputs(checkPhoto: (image: string, signal?: AbortSignal) => Promise<CheckPhotoResult>, onChange: () => void) {
  const [mode, setModeState] = useState<LookbookMode>('fictional');
  const [mood, setMoodState] = useState<LookbookMoodId>('pho-co');
  const [person, setPerson] = useState<string>();
  const [background, setBackground] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [gate, setGate] = useState<PhotoGate>({ status: 'none' });
  const [tick, setTick] = useState(0);
  const [personError, setPersonError] = useState<string>();
  const [backgroundError, setBackgroundError] = useState<string>();
  const checkRef = useRef(checkPhoto);
  checkRef.current = checkPhoto;

  useEffect(() => {
    if (!person || !consent) { setGate({ status: 'none' }); return; }
    const ac = new AbortController();
    setGate({ status: 'checking' });
    void checkRef.current(person, ac.signal).then(result => {
      if (ac.signal.aborted) return;
      setGate(result.status === 'ok' ? { status: result.result.verdict, check: result.result } : { status: 'unavailable' });
    });
    return () => ac.abort();
  }, [person, consent, tick]);

  const dropPerson = useCallback(() => { setPerson(undefined); setConsent(false); setPersonError(undefined); }, []);
  const setMode = (next: LookbookMode) => {
    if (next === mode) return;
    if (next === 'fictional') dropPerson();
    setModeState(next);
    onChange();
  };
  const setMood = (next: LookbookMoodId) => {
    if (next === mood) return;
    setMoodState(next);
    onChange();
  };
  const pickPerson = async (file: File) => {
    const result = await readImage(file);
    if ('error' in result) { setPersonError(result.error); return; }
    setPersonError(undefined); setConsent(false); setPerson(result.dataUrl); onChange();
  };
  const pickBackground = async (file: File) => {
    const result = await readImage(file);
    if ('error' in result) { setBackgroundError(result.error); return; }
    setBackgroundError(undefined); setBackground(result.dataUrl); onChange();
  };
  return {
    mode, setMode, mood, setMood, person, background, consent, setConsent, gate, personError, backgroundError,
    pickPerson, pickBackground, recheck: () => setTick(t => t + 1),
    clearPerson: () => { dropPerson(); onChange(); },
    clearBackground: () => { setBackground(undefined); setBackgroundError(undefined); onChange(); }
  };
}
export type LookbookInputs = ReturnType<typeof useLookbookInputs>;
