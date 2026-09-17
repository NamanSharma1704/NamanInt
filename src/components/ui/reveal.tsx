import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Server and hydration render; waiting below the viewport for its reveal; shown. */
type Phase = 'server' | 'waiting' | 'shown';

export interface RevealProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Seconds to wait once in view before rising in. */
  readonly delay?: number;
  /** How far it rises, in pixels. */
  readonly rise?: number;
  /** Share of the element that must be in view to start. */
  readonly amount?: number;
  readonly duration?: number;
}

/**
 * A scroll reveal that never hides what the server sent.
 *
 * The server and hydration render the content visible. Once the page is interactive, anything still below the
 * viewport is set out of sight (unseen, since it is off screen) and rises in as it scrolls into view; anything already
 * on screen stays as it is, and under reduced motion nothing moves at all. A slow or failed bundle therefore leaves the
 * page readable rather than blank, which a plain `initial={{ opacity: 0 }}` does not: motion writes that initial style
 * into the server HTML.
 */
export function Reveal({ children, className, delay = 0, rise = 28, amount = 0.15, duration = 0.6 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  const [phase, setPhase] = useState<Phase>('server');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    const onScreen = box.top < window.innerHeight && box.bottom > 0;
    // Decided once, on the first client render; a later preference change only ever reveals.
    setPhase((current) => (current !== 'server' ? (reducedMotion ? 'shown' : current) : reducedMotion || onScreen ? 'shown' : 'waiting'));
  }, [reducedMotion]);

  const hidden = phase === 'waiting' && !inView;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y: rise } : { opacity: 1, y: 0 }}
      transition={hidden ? { duration: 0 } : { duration, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
