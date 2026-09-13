import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the user's reduced-motion preference for components that animate
 * outside `motion/react`.
 *
 * `motion/react` ships `useReducedMotion`, but it only governs motion the
 * library itself drives. The anime.js counters and the trade-network scene run
 * their own timelines, so they need this hook to see the preference at all.
 *
 * Returns `false` during SSR and on the first client render, then corrects on
 * mount. Callers must therefore treat the value as "animate unless told
 * otherwise" and check it at the moment they would start a timeline, not only
 * at first paint.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    setPrefersReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}

/**
 * Synchronous read for imperative code that must decide before an effect has
 * run. Safe to call during SSR, where it reports `false`.
 */
export function prefersReducedMotionNow(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}
