import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { usePrefersReducedMotion } from '@/lib/use-reduced-motion';

interface AnimeCorridorProps {
  origin: string;
  destination: string;
}

export function AnimeCorridor({ origin, destination }: AnimeCorridorProps) {
  const beaconRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!beaconRef.current || !pulseRef.current) return;
    // The corridor is a decorative loop with no state to convey. Under reduced
    // motion the beacon stays parked at the origin end of the track.
    if (prefersReducedMotion) return;

    // Expanding pulse ripple
    const pulseAnim = animate(pulseRef.current, {
      scale: [1, 2.2],
      opacity: [0.8, 0],
      ease: 'outQuad',
      duration: 1200,
      loop: true,
    });

    // Beacon travel animation across the track
    const beaconAnim = animate(beaconRef.current, {
      left: ['0%', '100%'],
      ease: 'inOutSine',
      duration: 3200,
      alternate: true,
      loop: true,
    });

    return () => {
      pulseAnim.pause();
      beaconAnim.pause();
    };
  }, [prefersReducedMotion]);

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-bold tracking-[0.1em] text-muted-foreground">
      <span className="shrink-0">{origin}</span>

      <div className="relative mx-4 flex flex-1 items-center max-w-[200px] sm:max-w-[280px]">
        {/* Static Background Track */}
        <div className="relative h-[2px] w-full rounded-full bg-border">
          {/* Active Accent Gradient Line */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 via-accent to-accent/20" />

          {/* Traveling Anime.js Beacon */}
          <div
            ref={beaconRef}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: '0%' }}
          >
            <div className="relative flex items-center justify-center">
              {/* Expanding pulse ripple */}
              <div
                ref={pulseRef}
                className="absolute h-3.5 w-3.5 rounded-full bg-accent/60"
              />
              {/* Solid center dot */}
              <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(14,123,122,0.7)]" />
            </div>
          </div>
        </div>
      </div>

      <span className="shrink-0">{destination}</span>
    </div>
  );
}
