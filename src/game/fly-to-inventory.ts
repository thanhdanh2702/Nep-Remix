import { prefersReducedMotion } from '../ui/motion';

/** Item icon hops from the picked hotspot to the inventory strip in 6 steps (~360ms).
 *  Purely decorative: silently does nothing without both anchors or under reduced motion. */
export function flyToInventory(src: string, hotspotId: string) {
  if (prefersReducedMotion()) return;
  const from = document.querySelector(`[data-hotspot="${hotspotId}"]`)?.getBoundingClientRect();
  const to = document.querySelector('.inventory-strip')?.getBoundingClientRect();
  if (!from || !to) return;
  const size = 48;
  const img = document.createElement('img');
  Object.assign(img.style, { position: 'fixed', zIndex: '60', left: '0', top: '0', width: `${size}px`, height: `${size}px`, imageRendering: 'pixelated', pointerEvents: 'none' });
  img.src = src; img.alt = ''; img.setAttribute('aria-hidden', 'true');
  document.body.appendChild(img);
  const at = (x: number, y: number) => `translate(${Math.round(x - size / 2)}px, ${Math.round(y - size / 2)}px)`;
  const animation = img.animate([{ transform: at(from.left + from.width / 2, from.top + from.height / 2) }, { transform: at(to.left + 32, to.top + to.height / 2) }],
    { duration: 360, easing: 'steps(6, end)', fill: 'forwards' });
  animation.onfinish = animation.oncancel = () => img.remove();
}
