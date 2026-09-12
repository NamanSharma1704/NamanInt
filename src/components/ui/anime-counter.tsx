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
}

export function AnimeCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1800,
  ease = 'outExpo',
  className = '',
}: AnimeCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const elRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            // Reduced motion keeps the information (the final figure) and drops
            // only the count-up, which is decoration.
            if (prefersReducedMotionNow()) {
              setDisplayValue(value);
              return;
            }
            const targetObj = { val: 0 };
            animate(targetObj, {
              val: value,
              duration,
              ease,
              onUpdate: () => {
                setDisplayValue(targetObj.val);
              },
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, ease]);

  return (
    <span ref={elRef} className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
