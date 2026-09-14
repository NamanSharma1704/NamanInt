import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { useInspectionDrawingAvailable } from '@/lib/housing-inspection/capability';
import { settledProgress, stepForProgress } from '@/lib/inspection-drawing/solids';
import { usePrefersReducedMotion } from '@/lib/use-reduced-motion';

import type { InspectionScene } from './scene';

/** Height of the sticky site header (h-[72px]); the inspection view pins beneath it. */
export const HEADER_OFFSET = 72;
/** Scroll distance per step while inspecting, in viewport heights. */
export const STEP_VH = 60;
/** Space left beneath the header when the photograph view is scrolled back into place. */
const PHOTOGRAPH_GAP = 32;

export interface InspectionSequence {
  /** WebGL 2 runs well here and the drawing has not failed, so the Inspection process view can be offered. */
  readonly available: boolean;
  readonly inspecting: boolean;
  /** The drawing has drawn its first frame, so the photograph can fade out. */
  readonly ready: boolean;
  /** The step the scroll has reached. */
  readonly active: number;
  /** The element the view pins within; its height, less the pinned frame's, is how far the process scrolls. */
  readonly containerRef: RefObject<HTMLDivElement | null>;
  /** The pinned frame. */
  readonly pinnedRef: RefObject<HTMLDivElement | null>;
  /** A progress rail, scaled along its length as the process scrolls. */
  readonly railRef: RefObject<HTMLSpanElement | null>;
  /** Switches to the inspection process and scrolls it into place at its first step. */
  showInspection(): void;
  /** Switches back to the photograph, scrolling the panel back into view if the page had moved past it. */
  showPhotograph(): void;
  markReady(): void;
  /** Receives the running scene from the canvas, and null when it goes away. */
  handleScene(scene: InspectionScene | null): void;
  handleFailed(): void;
  /** Scrolls to the middle of a step's share of the process. */
  goTo(step: number): void;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * State for a category panel that switches from its photograph to an inspection process scrolled
 * through step by step.
 *
 * While inspecting, a passive scroll listener reads one rect per event: progress is how far the
 * container has scrolled beneath the header, over the distance the pinned frame can travel within it.
 * The scene and the progress rail are written directly; React state changes only when the step
 * changes. Under reduced motion each step settles on its middle frame. Leaving the category's tab
 * returns to the photograph, which also releases the drawing's WebGL context.
 */
export function useInspectionSequence(steps: number, selected: boolean): InspectionSequence {
  const capable = useInspectionDrawingAvailable();
  const [failed, setFailed] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<InspectionScene | null>(null);
  const progressRef = useRef(0);
  const inspectingRef = useRef(inspecting);
  inspectingRef.current = inspecting;
  /** Set by the visitor's own switch, so a view change they asked for scrolls into place and a tab change does not. */
  const alignRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);

  const sendProgress = useCallback((): void => {
    const progress = progressRef.current;
    sceneRef.current?.setProgress(reducedMotionRef.current ? settledProgress(progress, steps) : progress);
  }, [steps]);

  const measure = useCallback((): { scrolled: number; travel: number } | null => {
    const container = containerRef.current;
    const pinned = pinnedRef.current;
    if (!container || !pinned) return null;
    return { scrolled: HEADER_OFFSET - container.getBoundingClientRect().top, travel: container.offsetHeight - pinned.offsetHeight };
  }, []);

  const release = useCallback((): void => {
    setInspecting(false);
    setReady(false);
    setActive(0);
    progressRef.current = 0;
  }, []);
  const showPhotograph = useCallback((): void => {
    if (inspectingRef.current) alignRef.current = true;
    release();
  }, [release]);
  const showInspection = useCallback((): void => {
    if (!inspectingRef.current) alignRef.current = true;
    setInspecting(true);
  }, []);
  const markReady = useCallback((): void => setReady(true), []);
  const handleScene = useCallback(
    (scene: InspectionScene | null): void => {
      sceneRef.current = scene;
      if (scene) sendProgress();
    },
    [sendProgress],
  );
  const handleFailed = useCallback((): void => {
    setFailed(true);
    release();
  }, [release]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    sendProgress();
  }, [reducedMotion, sendProgress]);

  useEffect(() => {
    if (!selected) release();
  }, [selected, release]);

  // After the visitor switches views the panel changes height, so bring it into place: the process starts at its
  // first step, and the photograph comes back into view, clear of the header, if the page had scrolled past it.
  useEffect(() => {
    if (!alignRef.current) return;
    alignRef.current = false;
    const container = containerRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const offset = inspecting ? HEADER_OFFSET : HEADER_OFFSET + PHOTOGRAPH_GAP;
    if (!inspecting && top >= offset) return;
    window.scrollTo({ top: window.scrollY + top - offset, behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
  }, [inspecting]);

  useEffect(() => {
    if (!inspecting) return;
    const update = (): void => {
      const m = measure();
      if (!m) return;
      const progress = m.travel > 0 ? clamp01(m.scrolled / m.travel) : 0;
      progressRef.current = progress;
      if (railRef.current) railRef.current.style.transform = `scaleY(${progress})`;
      sendProgress();
      setActive(stepForProgress(progress, steps));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [inspecting, measure, sendProgress, steps]);

  const goTo = useCallback(
    (step: number): void => {
      const m = measure();
      if (!m || steps === 0) return;
      const target = ((step + 0.5) / steps) * m.travel;
      window.scrollTo({ top: window.scrollY + target - m.scrolled, behavior: reducedMotionRef.current ? 'auto' : 'smooth' });
    },
    [measure, steps],
  );

  return {
    available: capable && !failed,
    inspecting,
    ready,
    active,
    containerRef,
    pinnedRef,
    railRef,
    showInspection,
    showPhotograph,
    markReady,
    handleScene,
    handleFailed,
    goTo,
  };
}
