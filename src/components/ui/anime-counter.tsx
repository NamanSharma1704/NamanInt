import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { prefersReducedMotionNow } from '@/lib/use-reduced-motion';

interface AnimeCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  ease?: string;
  className?: string;
  /**
   * Whether the figure counts up into view. Turn it off for a bound such as "<0.5%", where every figure on the way up
   * would claim better than the real one.
   */
  countUp?: boolean;
}

/**
 * A figure that counts up as it scrolls into view.
 *
 * The server renders the real figure, so crawlers, link previews, a slow or failed bundle and screen readers all get
 * the true number. After hydration a figure still below the viewport is reset to zero (unseen, since it is off screen)
 * and counts up when it arrives; one already on screen is left as it is. The digits are tabular, so the figure holds
 * its width while it counts, and assistive technology reads the final figure rather than the moving one.
 */
export function AnimeCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1800,
  ease = 'outExpo',
  className = '',
  countUp = true,
}: AnimeCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !countUp || prefersReducedMotionNow()) {
      setDisplayValue(value);
      return;
    }
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      setDisplayValue(value);
      return;
    }
    setDisplayValue(0);
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        const counter = { val: 0 };
        animate(counter, {
          val: value,
          duration,
          ease,
          onUpdate: () => setDisplayValue(counter.val),
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, ease, countUp]);

  const final = `${prefix}${value.toFixed(decimals)}${suffix}`;
  return (
    <span ref={elRef} className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {displayValue.toFixed(decimals)}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
