import type { MouseEvent } from 'react';

/**
 * Click handler for in-page links (`href="#id"`).
 *
 * The browser's own jump does not stick on this site: in testing, clicking such a link updated the address but left the
 * page where it was, most likely because React Router treats the hash change as a navigation and its scroll
 * restoration puts the page back. So the scroll happens here instead. Modified clicks (new tab, new window) are left to
 * the browser, the target takes focus so keyboard users land where they were sent (give it `tabIndex={-1}` unless it
 * is focusable already), and the address still records the destination. Smooth scrolling is dropped under reduced
 * motion.
 */
export function followInPageLink(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  const { hash } = event.currentTarget;
  if (hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;

  event.preventDefault();
  const reducedMotion =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
  window.history.replaceState(window.history.state, '', hash);
}
