import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

import ResponsiveImage from '@/components/ResponsiveImage';
import { Reveal } from '@/components/ui/reveal';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';

export interface ServiceStep {
  readonly title: string;
  readonly text: string;
  readonly image: { readonly src: string; readonly alt: string };
}

interface ServicesSequenceProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly cta: { readonly href: string; readonly label: string };
  readonly steps: readonly ServiceStep[];
}

/** Height of the sticky site header (h-[72px]); the sequence pins beneath it. */
const HEADER_OFFSET = 72;

/**
 * Scroll distance, in viewport heights, spent on each step after the first. Kept short: four one-paragraph services
 * do not need two screens of scrolling to get through.
 */
const STEP_VH = 32;

/**
 * The step a scroll position shows. `scrolled` is how far the pinned frame has
 * travelled through its track and `travel` the track's total travel. Every
 * step gets an equal share of the travel, the first and last included.
 */
export function stepForScroll(scrolled: number, travel: number, count: number): number {
  if (count <= 1 || travel <= 0) return 0;
  const progress = Math.min(1, Math.max(0, scrolled / travel));
  return Math.min(count - 1, Math.floor(progress * count));
}

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * The trade services, one at a time. The section pins beneath the header and
 * scrolling advances through the services: the brief and a numbered index hold
 * still on the left while the stage on the right crossfades to the next
 * service. All four services stay in the DOM, so they are server-rendered and
 * read in order by screen readers; only the visual presentation is sequenced.
 */
export default function ServicesSequence({ eyebrow, title, intro, cta, steps }: ServicesSequenceProps) {
  const reducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  const measure = useCallback((): { scrolled: number; travel: number } | null => {
    const track = trackRef.current;
    const frame = frameRef.current;
    if (!track || !frame) return null;
    return {
      scrolled: HEADER_OFFSET - track.getBoundingClientRect().top,
      travel: track.offsetHeight - frame.offsetHeight,
    };
  }, []);

  // A plain passive scroll listener rather than a frame loop: one rect read per
  // event, a state update only when the step changes, and the progress rail
  // written straight to the DOM so it never re-renders the section.
  useEffect(() => {
    const update = (): void => {
      const m = measure();
      if (!m) return;
      const progress = m.travel > 0 ? Math.min(1, Math.max(0, m.scrolled / m.travel)) : 0;
      if (railRef.current) railRef.current.style.transform = `scaleY(${progress})`;
      setActive(stepForScroll(m.scrolled, m.travel, steps.length));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [measure, steps.length]);

  /** Scroll to the middle of a step's share of the track. */
  const goTo = (index: number): void => {
    const m = measure();
    if (!m) return;
    const target = ((index + 0.5) / steps.length) * m.travel;
    window.scrollTo({ top: window.scrollY + target - m.scrolled, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          {/* The brief scrolls normally on small screens and pins beside the
              stage on large ones, where it also carries the step index. */}
          <div className="pt-24 lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100svh-72px)] lg:flex-col lg:justify-center lg:self-start lg:pt-0">
            <Reveal>
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {eyebrow}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.025em] text-balance text-foreground">
                {title}
              </h2>
              <p className="mt-6 max-w-md text-base leading-[1.8] text-muted-foreground">{intro}</p>
            </Reveal>

            <ol aria-label="Jump to a service" className="relative mt-10 hidden lg:block">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-border" />
              <span
                ref={railRef}
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-accent-on-tint"
              />
              {steps.map((step, index) => {
                const isActive = index === active;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-current={isActive ? 'step' : undefined}
                      className={`flex w-full items-baseline gap-4 py-2.5 pl-6 text-left text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono text-xs font-normal tracking-[0.18em] text-gold">
                        {pad(index + 1)}
                      </span>
                      {step.title}
                    </button>
                  </li>
                );
              })}
            </ol>

            <Link001
              href={cta.href}
              className="mt-10 flex w-fit items-center gap-2 text-sm font-semibold text-accent-on-tint transition-colors hover:text-foreground"
            >
              <span>{cta.label}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link001>
          </div>

          <div className="mt-12 pb-24 lg:mt-0 lg:pb-0">
            {/* The track is the pinned frame plus a spacer; scrolling through
                the spacer is what advances the steps. */}
            <div ref={trackRef}>
              <div
                ref={frameRef}
                className="sticky top-[72px] flex flex-col justify-center py-8 lg:h-[calc(100svh-72px)] lg:py-0"
              >
                {/* Small screens: the brief has scrolled away, so the index
                    becomes a row of segments above the stage. */}
                <div className="mb-6 flex gap-2 lg:hidden">
                  {steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Show ${step.title}`}
                      aria-current={index === active ? 'step' : undefined}
                      className="flex h-8 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={`h-0.5 w-full transition-colors duration-300 motion-reduce:transition-none ${
                          index <= active ? 'bg-accent-on-tint' : 'bg-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Every service occupies the same grid cell, so the stage is
                    as tall as the longest one and nothing shifts between steps. */}
                <ol className="grid">
                  {steps.map((step, index) => {
                    const isActive = index === active;
                    return (
                      <li
                        key={step.title}
                        className={`col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                          isActive ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_32px_64px_-32px_hsl(220_45%_15%/0.35)] ring-1 ring-border/70">
                          <ResponsiveImage
                            src={step.image.src}
                            alt={step.image.alt}
                            sizes="(min-width: 1024px) 45vw, 100vw"
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-[min(34rem,calc(100svh-72px-16rem))]"
                          />
                        </div>
                        <div className="mt-7 grid gap-x-6 sm:grid-cols-[auto_1fr]">
                          <span className="font-mono text-xs tracking-[0.18em] text-gold sm:pt-2">
                            {pad(index + 1)} / {pad(steps.length)}
                          </span>
                          <div>
                            <h3 className="mt-3 font-heading text-2xl leading-[1.15] text-foreground sm:mt-0 sm:text-[1.75rem]">
                              {step.title}
                            </h3>
                            <p className="mt-3 max-w-lg text-base leading-[1.8] text-muted-foreground">{step.text}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div aria-hidden="true" style={{ height: `${(steps.length - 1) * STEP_VH}vh` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
