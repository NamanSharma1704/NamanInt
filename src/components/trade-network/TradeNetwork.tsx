import { useEffect, useRef, useState } from 'react';

import {
  buildModel,
  hslToRgb,
  parseHslTriplet,
  svgDrawing,
  type Hsl,
  type Layout,
  type SvgDrawing,
} from '@/lib/trade-network/model';
import { prefersReducedMotionNow, usePrefersReducedMotion } from '@/lib/use-reduced-motion';

import type { ScenePalette, TradeNetworkScene } from './scene';

/** Tailwind's `sm` breakpoint — the same one that swaps the fallback drawings. */
const WIDE_QUERY = '(min-width: 640px)';

const DRAWINGS: Record<Layout, SvgDrawing> = {
  wide: svgDrawing(buildModel('wide')),
  compact: svgDrawing(buildModel('compact')),
};

/**
 * The wide drawing is letterboxed into a frame no taller than 1 : 2.8, so on
 * large screens the figure supports the section rather than filling a screen.
 * The SVG (preserveAspectRatio meet) and the WebGL camera both centre the
 * drawing inside that frame, so the two stay aligned when they swap.
 */
const WIDE_MIN_ASPECT = 2.8;

const FRAME_ASPECT: Record<Layout, number> = {
  wide: Math.max(WIDE_MIN_ASPECT, DRAWINGS.wide.width / DRAWINGS.wide.height),
  compact: DRAWINGS.compact.width / DRAWINGS.compact.height,
};

/**
 * Stroke and fill classes for the SVG drawing. The opacities mirror OPACITY in
 * the model (0.45 / 0.6 / 0.2 / 0.75 / 0.9), which the WebGL scene uses directly.
 */
const STROKE = {
  guide: 'stroke-muted-foreground/45',
  station: 'stroke-foreground/60',
  stationDim: 'stroke-foreground/20',
  highlight: 'stroke-accent',
  info: 'stroke-accent/75',
} as const;

/** Moving units are filled silhouettes, as they are in the WebGL scene. */
const FILL = {
  goods: 'fill-foreground/90',
  signals: 'fill-accent',
} as const;

const TOKEN_FALLBACKS: Record<'--foreground' | '--muted-foreground' | '--accent', Hsl> = {
  '--foreground': { h: 213, s: 0.3, l: 0.1 },
  '--muted-foreground': { h: 213, s: 0.12, l: 0.44 },
  '--accent': { h: 179, s: 0.8, l: 0.27 },
};

/** Colours come from the design tokens at runtime, not from copies in code. */
function readPalette(): ScenePalette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: keyof typeof TOKEN_FALLBACKS) =>
    hslToRgb(parseHslTriplet(style.getPropertyValue(name)) ?? TOKEN_FALLBACKS[name]);
  return { structure: token('--foreground'), guide: token('--muted-foreground'), accent: token('--accent') };
}

/**
 * Three.js r163+ requires WebGL 2. A context the browser flags as having a
 * major performance caveat (software rendering) is treated as absent.
 */
function hasCapableWebGL2(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
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

interface FallbackDrawingProps {
  readonly drawing: SvgDrawing;
  /** Frame width divided by height. */
  readonly aspect: number;
  readonly highlightStep: number | null;
  readonly className: string;
  readonly faded: boolean;
}

function FallbackDrawing({ drawing, aspect, highlightStep, className, faded }: FallbackDrawingProps) {
  const stationStroke = (index: number): string =>
    highlightStep === null ? STROKE.station : highlightStep === index ? STROKE.highlight : STROKE.stationDim;
  return (
    <svg
      viewBox={drawing.viewBox}
      aria-hidden="true"
      focusable="false"
      fill="none"
      strokeWidth={1}
      strokeLinecap="round"
      style={{ aspectRatio: aspect }}
      className={`${className} pointer-events-none h-auto w-full transition-opacity duration-700 ease-out motion-reduce:transition-none ${
        faded ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <path d={drawing.floorGuides} vectorEffect="non-scaling-stroke" className={STROKE.guide} />
      {drawing.stations.map((d, index) => (
        <path key={index} d={d} vectorEffect="non-scaling-stroke" className={stationStroke(index)} />
      ))}
      <path d={drawing.infoGuides} vectorEffect="non-scaling-stroke" className={STROKE.info} />
      <path d={drawing.structureUnits} className={FILL.goods} />
      <path d={drawing.accentUnits} className={FILL.signals} />
    </svg>
  );
}

export interface TradeNetworkProps {
  /** Route step to emphasise: 0 origin, 1 consolidation, 2 destination. */
  readonly highlightStep: number | null;
  readonly origin: string;
  readonly destination: string;
  readonly className?: string;
}

/**
 * The route schematic. The server renders it as SVG at its final size, so the
 * page never shifts; the WebGL version loads only when the figure nears the
 * viewport, on idle, and only where WebGL 2 runs well. Anywhere it doesn't —
 * no WebGL, Save-Data, a lost context, a failed chunk — the SVG simply stays.
 */
export default function TradeNetwork({ highlightStep, origin, destination, className }: TradeNetworkProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<TradeNetworkScene | null>(null);
  const highlightRef = useRef(highlightStep);
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    highlightRef.current = highlightStep;
    sceneRef.current?.setHighlight(highlightStep);
  }, [highlightStep]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    if (
      typeof IntersectionObserver === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      prefersReducedData()
    ) {
      return;
    }

    let disposed = false;
    let inView = false;
    let cancelIdle: (() => void) | null = null;
    let teardown: (() => void) | null = null;
    const wideQuery = window.matchMedia(WIDE_QUERY);
    const isActive = (): boolean => inView && document.visibilityState === 'visible';

    async function mount(): Promise<void> {
      if (disposed || !frame || !canvas || !hasCapableWebGL2()) return;

      let sceneModule: typeof import('./scene');
      try {
        sceneModule = await import('./scene');
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[trade-network] WebGL module failed to load', error);
        return;
      }
      if (disposed) return;

      let scene: TradeNetworkScene;
      try {
        scene = sceneModule.createTradeNetworkScene({
          canvas,
          layout: wideQuery.matches ? 'wide' : 'compact',
          palette: readPalette(),
          reducedMotion: reducedMotionRef.current || prefersReducedMotionNow(),
          maxPixelRatio: window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2,
          onContextLost: () => {
            if (!disposed) setReady(false);
          },
        });
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[trade-network] WebGL scene failed to start', error);
        return;
      }

      sceneRef.current = scene;
      scene.setHighlight(highlightRef.current);
      scene.resize(frame.clientWidth, frame.clientHeight);

      const activity = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        scene.setActive(isActive());
      });
      activity.observe(frame);
      const onVisibility = (): void => scene.setActive(isActive());
      document.addEventListener('visibilitychange', onVisibility);
      const sizes = new ResizeObserver(() => scene.resize(frame.clientWidth, frame.clientHeight));
      sizes.observe(frame);
      const onLayout = (): void => scene.setLayout(wideQuery.matches ? 'wide' : 'compact');
      wideQuery.addEventListener('change', onLayout);

      teardown = () => {
        activity.disconnect();
        sizes.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        wideQuery.removeEventListener('change', onLayout);
        scene.dispose();
        sceneRef.current = null;
      };
      setReady(true);
    }

    // Start loading once the figure is within 400px of the viewport, and only
    // when the main thread is idle, so WebGL setup never competes with page load.
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
    approach.observe(frame);

    return () => {
      disposed = true;
      approach.disconnect();
      cancelIdle?.();
      teardown?.();
    };
  }, []);

  return (
    <figure className={className}>
      <div ref={frameRef} className="relative">
        <FallbackDrawing drawing={DRAWINGS.compact} aspect={FRAME_ASPECT.compact} highlightStep={highlightStep} className="block sm:hidden" faded={ready} />
        <FallbackDrawing drawing={DRAWINGS.wide} aspect={FRAME_ASPECT.wide} highlightStep={highlightStep} className="hidden sm:block" faded={ready} />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ease-out motion-reduce:transition-none ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <figcaption className="mt-5">
        <span className="sr-only">
          Diagram of the sourcing route. Goods leave factories in South and East China along three supplier lanes,
          pass a single inspection gate at the Hong Kong consolidation hub, and ship as consolidated freight to North
          America. Above the route, orders travel back toward the factories and inspection sign-offs rise from the
          gate.
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>{origin}</span>
          <span aria-hidden="true" className="hidden h-px flex-1 bg-border sm:block" />
          <span>{destination}</span>
        </span>
        <span aria-hidden="true" className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-3 bg-foreground/80" />
            Goods in transit
          </span>
          <span className="flex items-center gap-2">
            <span className="h-px w-4 bg-accent" />
            Orders and inspection sign-off
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
