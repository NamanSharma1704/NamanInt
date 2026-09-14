import { useEffect, useRef, useState } from 'react';

import {
  LOAD_SUMMARY,
  STEP_RANGES,
  fallbackDrawing,
  reducedMotionProgress,
  stepForProgress,
} from '@/lib/container-load/geometry';
import { hslToRgb, parseHslTriplet, type Hsl } from '@/lib/trade-network/model';
import { prefersReducedMotionNow, usePrefersReducedMotion } from '@/lib/use-reduced-motion';
import { hasCapableWebGL2 } from '@/lib/webgl2';

import type { ContainerLoadScene, LoadPalette, Rgb } from './scene';

export interface LoadStep {
  readonly title: string;
  readonly text: string;
}

interface ContainerLoadSequenceProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  /** One caption per timeline step, in STEP_RANGES order. */
  readonly steps: readonly LoadStep[];
}

/** Height of the sticky site header (h-[72px]); the sequence pins beneath it. */
const HEADER_OFFSET = 72;

/**
 * Scroll distance, in viewport heights, per step. The drawing moves continuously, so this is more room than the
 * homepage services crossfade needs.
 */
const STEP_VH = 70;

const DRAWING = fallbackDrawing();

const pad = (n: number): string => String(n).padStart(2, '0');
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const TOKEN_FALLBACKS: Record<'--foreground' | '--background' | '--gold-soft' | '--accent-on-tint', Hsl> = {
  '--foreground': { h: 220, s: 0.45, l: 0.11 },
  '--background': { h: 0, s: 0, l: 1 },
  '--gold-soft': { h: 40, s: 0.45, l: 0.76 },
  '--accent-on-tint': { h: 38, s: 0.68, l: 0.31 },
};

/** Colours come from the design tokens at runtime. The ground is the section's own painted background, so solids hide lines against exactly what sits behind them. */
function readPalette(section: HTMLElement | null): LoadPalette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: keyof typeof TOKEN_FALLBACKS): Rgb =>
    hslToRgb(parseHslTriplet(style.getPropertyValue(name)) ?? TOKEN_FALLBACKS[name]);
  let ground = token('--background');
  if (section) {
    const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(getComputedStyle(section).backgroundColor);
    if (match && !(match[4] !== undefined && Number(match[4]) === 0)) {
      ground = [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
    }
  }
  return { line: token('--foreground'), accent: token('--gold-soft'), accentLine: token('--accent-on-tint'), ground };
}

function prefersReducedData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

function whenIdle(callback: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const handle = w.requestIdleCallback(callback, { timeout: 1200 });
    return () => w.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

/**
 * A 20ft container loaded to plan, driven by scrolling.
 *
 * Scrolling does this:
 *   - The section pins beneath the header.
 *   - Scrolling through it lowers the container onto its landing marks and releases the rig.
 *   - The doors open, cartons are stuffed front wall first until it is full, and the doors close on the load.
 *   - The brief, step index and load readout hold still beside the drawing, and each step's caption crossfades in.
 *
 * Rendering:
 *   - The server renders a line drawing of the landed container, so the page never shifts and search engines and
 *     screen readers get every caption.
 *   - The WebGL version replaces the drawing only near the viewport, on idle, and where WebGL 2 runs well.
 */
export default function ContainerLoadSequence({ eyebrow, title, intro, steps }: ContainerLoadSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<ContainerLoadScene | null>(null);
  const progressRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  if (import.meta.env.DEV && steps.length !== STEP_RANGES.length) {
    console.warn(`[container-load] ${steps.length} captions for ${STEP_RANGES.length} timeline steps`);
  }

  /** Under reduced motion each step settles on one frame; otherwise the drawing follows the scroll exactly. */
  const sendProgress = (): void => {
    const progress = progressRef.current;
    sceneRef.current?.setProgress(reducedMotionRef.current ? reducedMotionProgress(progress) : progress);
  };

  const measure = (): { scrolled: number; travel: number } | null => {
    const track = trackRef.current;
    const frame = frameRef.current;
    if (!track || !frame) return null;
    return { scrolled: HEADER_OFFSET - track.getBoundingClientRect().top, travel: track.offsetHeight - frame.offsetHeight };
  };

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    sendProgress();
  }, [reducedMotion]);

  // A passive scroll listener, one rect read per event. The rail and the drawing are written directly, and React state
  // changes only when the step changes.
  useEffect(() => {
    const update = (): void => {
      const m = measure();
      if (!m) return;
      const progress = m.travel > 0 ? clamp01(m.scrolled / m.travel) : 0;
      progressRef.current = progress;
      if (railRef.current) railRef.current.style.transform = `scaleY(${progress})`;
      sendProgress();
      setActive(stepForProgress(progress));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    if (typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined' || prefersReducedData()) return;

    let disposed = false;
    let cancelIdle: (() => void) | null = null;
    let teardown: (() => void) | null = null;

    async function mount(): Promise<void> {
      if (disposed || !stage || !canvas || !hasCapableWebGL2()) return;
      let sceneModule: typeof import('./scene');
      try {
        sceneModule = await import('./scene');
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[container-load] WebGL module failed to load', error);
        return;
      }
      if (disposed) return;

      let scene: ContainerLoadScene;
      try {
        scene = sceneModule.createContainerLoadScene({
          canvas,
          palette: readPalette(sectionRef.current),
          maxPixelRatio: window.matchMedia?.('(pointer: coarse)').matches ? 1.5 : 2,
          onContextLost: () => {
            if (!disposed) setReady(false);
          },
        });
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[container-load] WebGL scene failed to start', error);
        return;
      }
      sceneRef.current = scene;
      reducedMotionRef.current = reducedMotionRef.current || prefersReducedMotionNow();
      scene.resize(stage.clientWidth, stage.clientHeight);
      sendProgress();
      const sizes = new ResizeObserver(() => scene.resize(stage.clientWidth, stage.clientHeight));
      sizes.observe(stage);
      teardown = () => {
        sizes.disconnect();
        scene.dispose();
        sceneRef.current = null;
      };
      setReady(true);
    }

    // Load once the drawing is within 400px of the viewport, and only when the main thread is idle.
    const approach = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        approach.disconnect();
        cancelIdle = whenIdle(() => {
          void mount();
        });
      },
      { rootMargin: '400px 0px' },
    );
    approach.observe(stage);

    return () => {
      disposed = true;
      approach.disconnect();
      cancelIdle?.();
      teardown?.();
    };
  }, []);

  /** Scroll to the middle of a step's share of the track. */
  const goTo = (index: number): void => {
    const m = measure();
    const range = STEP_RANGES[index];
    if (!m || !range) return;
    const target = ((range[0] + range[1]) / 2) * m.travel;
    window.scrollTo({ top: window.scrollY + target - m.scrolled, behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
  };

  const fade = 'transition-opacity duration-700 ease-out motion-reduce:transition-none';

  return (
    <section ref={sectionRef} className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="pt-20 lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100svh-72px)] lg:flex-col lg:justify-center lg:self-start lg:pt-0">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px w-8 bg-gold" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</span>
            </div>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.025em] text-balance text-foreground">
              {title}
            </h2>
            <p className="mt-6 max-w-md text-base leading-[1.8] text-muted-foreground">{intro}</p>

            <ol aria-label="Jump to a loading stage" className="relative mt-10 hidden lg:block">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-border" />
              <span ref={railRef} aria-hidden="true" className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-accent-on-tint" />
              {steps.map((step, index) => (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={index === active ? 'step' : undefined}
                    className={`flex w-full items-baseline gap-4 py-2.5 pl-6 text-left text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                      index === active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="font-mono text-xs font-normal tracking-[0.18em] text-gold">{pad(index + 1)}</span>
                    {step.title}
                  </button>
                </li>
              ))}
            </ol>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cartons</dt>
                <dd className="mt-1 font-heading text-2xl text-foreground">{LOAD_SUMMARY.cartons}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cargo volume</dt>
                <dd className="mt-1 font-heading text-2xl text-foreground">
                  {LOAD_SUMMARY.cubicMetres}
                  <span className="ml-1 text-sm text-muted-foreground">CBM</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cube utilization</dt>
                <dd className="mt-1 font-heading text-2xl text-foreground">{LOAD_SUMMARY.cubeUsedPercent}%</dd>
              </div>
            </dl>
          </div>

          <div className="mt-12 pb-20 lg:mt-0 lg:pb-0">
            {/* The track is the pinned frame plus a spacer; scrolling through the spacer drives the sequence. */}
            <div ref={trackRef} data-sequence-track="">
              <div ref={frameRef} className="sticky top-[72px] flex flex-col justify-center py-6 lg:h-[calc(100svh-72px)] lg:py-0">
                <div className="mb-5 flex gap-2 lg:hidden">
                  {steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Show ${step.title}`}
                      aria-current={index === active ? 'step' : undefined}
                      className="flex h-8 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={`h-0.5 w-full transition-colors duration-300 motion-reduce:transition-none ${index <= active ? 'bg-accent-on-tint' : 'bg-border'}`} />
                    </button>
                  ))}
                </div>

                <figure>
                  <div ref={stageRef} className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-[min(36rem,calc(100svh-72px-12rem))]">
                    <svg
                      viewBox={DRAWING.viewBox}
                      preserveAspectRatio="xMidYMid meet"
                      aria-hidden="true"
                      focusable="false"
                      fill="none"
                      strokeWidth={1}
                      strokeLinecap="round"
                      className={`absolute inset-0 h-full w-full ${fade} ${ready ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <path d={DRAWING.marks} vectorEffect="non-scaling-stroke" className="stroke-accent-on-tint" />
                      <path d={DRAWING.detail} vectorEffect="non-scaling-stroke" className="stroke-foreground/35" />
                      <path d={DRAWING.structure} vectorEffect="non-scaling-stroke" className="stroke-foreground/80" />
                    </svg>
                    <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${fade} ${ready ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <figcaption className="sr-only">
                    Line drawing of a 20ft shipping container being loaded. A crane lowers it onto its landing marks and
                    the lifting rig is released. The doors then swing open and {LOAD_SUMMARY.cartons} cartons are stuffed
                    from the front wall toward the doors, filling about {LOAD_SUMMARY.cubeUsedPercent}% of the internal
                    cube. Finally the doors close on the full load, ready for the seal.
                  </figcaption>
                </figure>

                {/* Every caption shares one grid cell, so the stage keeps the height of the longest and nothing shifts. */}
                <ol className="mt-6 grid">
                  {steps.map((step, index) => {
                    const isActive = index === active;
                    return (
                      <li
                        key={step.title}
                        className={`col-start-1 row-start-1 grid gap-x-6 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:grid-cols-[auto_1fr] ${
                          isActive ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                        }`}
                      >
                        <span className="font-mono text-xs tracking-[0.18em] text-gold sm:pt-1.5">
                          {pad(index + 1)} / {pad(steps.length)}
                        </span>
                        <div>
                          <h3 className="mt-2 font-heading text-xl leading-[1.2] text-foreground sm:mt-0 sm:text-2xl">{step.title}</h3>
                          <p className="mt-2 max-w-xl text-sm leading-[1.8] text-muted-foreground sm:text-base">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div aria-hidden="true" style={{ height: `${steps.length * STEP_VH}vh` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
