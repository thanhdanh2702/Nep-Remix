// Small WAAPI helpers for UI "juice". Everything degrades to instant when the
// player asks the OS for reduced motion.
import { flushSync } from 'react-dom';

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Horizontal 200ms shake for a wrong answer (design-system §6.5). */
export function shake(el: Element | null) {
  if (!el || prefersReducedMotion()) return;
  el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' },
     { transform: 'translateX(-2px)' }, { transform: 'translateX(0)' }],
    { duration: 200, easing: 'steps(5, end)' },
  );
}

/** One-shot squash used for "it worked" feedback (equip, buy, collect). */
export function pop(el: Element | null) {
  if (!el || prefersReducedMotion()) return;
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(.98)' }, { transform: 'scale(1)' }],
    { duration: 240, easing: 'steps(4, end)' },
  );
}

/** Animate a number in a text node; whole numbers only so the pixel font never shows decimals. */
export function countUp(el: HTMLElement | null, from: number, to: number, ms = 480, format = (n: number) => String(n)) {
  if (!el) return () => {};
  if (prefersReducedMotion() || from === to) { el.textContent = format(to); return () => {}; }
  let frame = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    el.textContent = format(Math.round(from + (to - from) * t));
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** Reveal text character by character. Resolves when done or when `signal` aborts
 *  (the caller then shows the full line). */
export function typewriter(text: string, onUpdate: (shown: string) => void, { cps = 45, signal }: { cps?: number; signal?: AbortSignal } = {}) {
  return new Promise<void>(resolve => {
    if (prefersReducedMotion() || signal?.aborted) { onUpdate(text); resolve(); return; }
    const chars = Array.from(text);
    let shown = 0;
    const timer = setInterval(() => {
      shown = Math.min(chars.length, shown + 1);
      onUpdate(chars.slice(0, shown).join(''));
      if (shown >= chars.length) finish();
    }, 1000 / cps);
    const finish = () => { clearInterval(timer); onUpdate(text); resolve(); };
    signal?.addEventListener('abort', finish, { once: true });
  });
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/** Cross-fade between screens when the browser supports View Transitions. */
export function withViewTransition(update: () => void) {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) { update(); return; }
  doc.startViewTransition(() => flushSync(update));
}
