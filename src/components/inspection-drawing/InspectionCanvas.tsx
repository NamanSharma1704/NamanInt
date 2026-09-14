import { useEffect, useRef, useState } from 'react';

import type { InspectionMarker } from '@/lib/inspection-drawing/solids';
import { hslToRgb, parseHslTriplet, type Hsl } from '@/lib/trade-network/model';
import { prefersReducedMotionNow, usePrefersReducedMotion } from '@/lib/use-reduced-motion';

import type { InspectionPalette, InspectionScene, InspectionSceneOptions, MarkerPosition, Rgb } from './scene';

const TOKEN_FALLBACKS: Record<'--foreground' | '--background' | '--accent-on-tint', Hsl> = {
  '--foreground': { h: 220, s: 0.45, l: 0.11 },
  '--background': { h: 0, s: 0, l: 1 },
  '--accent-on-tint': { h: 39, s: 0.72, l: 0.33 },
};

function token(style: CSSStyleDeclaration, name: keyof typeof TOKEN_FALLBACKS): Rgb {
  return hslToRgb(parseHslTriplet(style.getPropertyValue(name)) ?? TOKEN_FALLBACKS[name]);
}

/** The figure's own painted ground, so the solids hide lines against exactly what sits behind them. */
function groundColour(element: HTMLElement | null, fallback: Rgb): Rgb {
  if (!element) return fallback;
  const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(getComputedStyle(element).backgroundColor);
  if (!match || (match[4] !== undefined && Number(match[4]) === 0)) return fallback;
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
}

/** A drawing's scene factory, with its solids and effects already bound. */
export type SceneFactory = (options: Omit<InspectionSceneOptions, 'drawing' | 'effects'>) => InspectionScene;

export interface InspectionCanvasProps {
  readonly markers: readonly InspectionMarker[];
  /** The category's inspection protocols, in the order the markers are numbered. */
  readonly protocols: readonly string[];
  /** Protocol whose point and parts are emphasised, or null; the other points step back. */
  readonly highlight: number | null;
  /** Opening sentence of the text description, naming what is drawn. */
  readonly subject: string;
  /** Loads the drawing's Three.js module on demand and returns its scene factory. */
  readonly loadScene: () => Promise<SceneFactory>;
  readonly onReady: () => void;
  /** WebGL failed to load, start, or lost its context: the page should fall back. */
  readonly onFailed: () => void;
  /** Hands the running scene to the owner (for scroll progress), and null when it goes away. */
  readonly onScene?: (scene: InspectionScene | null) => void;
}

/**
 * The canvas and numbered markers of a Categories inspection drawing. It fills its positioned parent
 * and takes that parent's background as the drawing's ground. The WebGL module loads when this
 * mounts. The canvas and markers are decorative; the text description and the page's steps carry the
 * content.
 */
export default function InspectionCanvas({ markers, protocols, highlight, subject, loadScene, onReady, onFailed, onScene }: InspectionCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<Array<HTMLLIElement | null>>([]);
  const sceneRef = useRef<InspectionScene | null>(null);
  const highlightRef = useRef(highlight);
  const callbacks = useRef({ onReady, onFailed, loadScene, onScene });
  callbacks.current = { onReady, onFailed, loadScene, onScene };
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    highlightRef.current = highlight;
    sceneRef.current?.setHighlight(highlight);
  }, [highlight]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    let disposed = false;
    let teardown: (() => void) | null = null;

    // Marker positions change every frame while the drawing moves, so they are written straight to
    // the DOM rather than through React state.
    const placeMarkers = (positions: readonly MarkerPosition[]): void => {
      for (const { protocol, x, y } of positions) {
        const element = markerRefs.current[protocol];
        if (element) element.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    const fail = (message: string, error?: unknown): void => {
      if (import.meta.env.DEV) console.warn(`[inspection-drawing] ${message}`, error);
      if (!disposed) callbacks.current.onFailed();
    };

    void (async () => {
      let createScene: SceneFactory;
      try {
        createScene = await callbacks.current.loadScene();
      } catch (error) {
        fail('WebGL module failed to load', error);
        return;
      }
      if (disposed) return;

      const style = getComputedStyle(document.documentElement);
      const palette: InspectionPalette = {
        line: token(style, '--foreground'),
        // The gold ink (--accent-on-tint), not the bright gold fill: highlighted edges are thin lines on a light ground.
        accent: token(style, '--accent-on-tint'),
        ground: groundColour(frame.parentElement, token(style, '--background')),
      };

      let scene: InspectionScene;
      try {
        scene = createScene({
          canvas,
          palette,
          reducedMotion: reducedMotionRef.current || prefersReducedMotionNow(),
          maxPixelRatio: window.matchMedia?.('(pointer: coarse)').matches ? 1.5 : 2,
          onMarkers: placeMarkers,
          onContextLost: () => fail('WebGL context lost'),
        });
      } catch (error) {
        fail('WebGL scene failed to start', error);
        return;
      }

      sceneRef.current = scene;
      scene.setHighlight(highlightRef.current);
      scene.resize(frame.clientWidth, frame.clientHeight);

      let inView = true;
      const isActive = (): boolean => inView && document.visibilityState === 'visible';
      const observers: Array<{ disconnect(): void }> = [];
      if (typeof IntersectionObserver !== 'undefined') {
        const visibility = new IntersectionObserver((entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          scene.setActive(isActive());
        });
        visibility.observe(frame);
        observers.push(visibility);
      }
      if (typeof ResizeObserver !== 'undefined') {
        const sizes = new ResizeObserver(() => scene.resize(frame.clientWidth, frame.clientHeight));
        sizes.observe(frame);
        observers.push(sizes);
      }
      const onVisibility = (): void => scene.setActive(isActive());
      document.addEventListener('visibilitychange', onVisibility);
      scene.setActive(isActive());

      teardown = () => {
        for (const observer of observers) observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        callbacks.current.onScene?.(null);
        scene.dispose();
        sceneRef.current = null;
      };
      setReady(true);
      callbacks.current.onScene?.(scene);
      callbacks.current.onReady();
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  const fade = `transition-opacity duration-500 ease-out motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`;

  return (
    <div ref={frameRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${fade}`} />
      <ol aria-hidden="true" className={`pointer-events-none absolute inset-0 ${fade}`}>
        {markers.map((marker) => {
          const emphasised = highlight === marker.protocol;
          const receded = highlight !== null && !emphasised;
          return (
            <li
              key={marker.protocol}
              ref={(element) => {
                markerRefs.current[marker.protocol] = element;
              }}
              className={`absolute left-0 top-0 transition-opacity duration-300 motion-reduce:transition-none ${receded ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* A dot on the inspected feature and a leader out to the numbered balloon, so the
                  balloon never covers the feature it names. */}
              <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-accent-on-tint" />
              <span className="absolute left-0 top-0 h-px w-[26px] origin-left -rotate-45 bg-accent-on-tint" />
              <span
                data-balloon
                className={`absolute left-[18px] top-[-18px] -ml-3 -mt-3 grid h-6 w-6 place-items-center rounded-full border border-accent-on-tint font-mono text-[11px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
                  emphasised ? 'bg-accent text-accent-foreground' : 'bg-background text-gold'
                }`}
              >
                {marker.protocol + 1}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">
        {subject}{' '}
        {markers.map((marker) => `Point ${marker.protocol + 1}: ${protocols[marker.protocol] ?? ''}, applied to ${marker.place}.`).join(' ')}
      </p>
    </div>
  );
}
