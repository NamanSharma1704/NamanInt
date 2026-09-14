import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/** Gap between the thumb's travel and the top and bottom of the viewport, in px. */
const INSET = 6;

/** Shortest the thumb gets on a very long page, so it stays readable and easy to grab. */
const MIN_THUMB = 40;

/** How long the indicator stays after the last scroll, hover or drag before it starts to fade. */
export const HIDE_DELAY_MS = 850;

/**
 * The site's scroll indicator.
 *
 * Native scrollbars are hidden in globals.css, so this draws a slim gold thumb along the right edge of the viewport in
 * their place. Scrolling itself stays entirely native: the indicator only listens.
 *
 * - Every scroll event reveals it at once, in either direction, which covers the mouse wheel, trackpads, touch,
 *   keyboard and scripted scrolling alike. It fades out {@link HIDE_DELAY_MS} after the last one.
 * - The thumb's position is written once per animation frame as a transform, and the page height is measured only
 *   when the page or the window changes size, so scrolling never triggers layout work here.
 * - On mouse and trackpad screens, hovering the right edge also reveals it, shows a faint track, widens the thumb and
 *   lets it be dragged. On touch screens it is display only, so it never catches an edge swipe.
 * - It is decorative for assistive technology, renders nothing on the server, and hides when the page does not scroll.
 */
export default function ScrollIndicator() {
  const [mounted, setMounted] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const dragging = useRef(false);
  const hideTimer = useRef(0);
  const metrics = useRef({ scrollable: 0, track: 0, thumb: 0 });

  const setVisible = useCallback((visible: boolean): void => {
    if (railRef.current) railRef.current.dataset.visible = String(visible);
  }, []);

  const scheduleHide = useCallback((): void => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!hovering.current && !dragging.current) setVisible(false);
    }, HIDE_DELAY_MS);
  }, [setVisible]);

  useEffect(() => {
    setMounted(true);
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = (): void => setInteractive(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!mounted || !rail || !thumb) return;
    let frame = 0;

    const measure = (): void => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const track = window.innerHeight - INSET * 2;
      const size = scrollable > 1 ? Math.max(MIN_THUMB, Math.round((doc.clientHeight / doc.scrollHeight) * track)) : 0;
      metrics.current = { scrollable, track, thumb: size };
      rail.dataset.scrollable = String(scrollable > 1);
      thumb.style.height = `${size}px`;
    };

    const place = (): void => {
      const { scrollable, track, thumb: size } = metrics.current;
      if (scrollable <= 1) return;
      // Clamped, so an elastic overscroll never pushes the thumb past either end.
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      thumb.style.transform = `translate3d(0, ${(progress * (track - size)).toFixed(2)}px, 0)`;
    };

    const onScroll = (): void => {
      setVisible(true);
      scheduleHide();
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          place();
        });
      }
    };

    const onResize = (): void => {
      measure();
      place();
    };

    measure();
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Content that settles after load (images, pinned sections, the WebGL figures) changes the page height without a
    // resize event.
    const growth = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    growth?.observe(document.body);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.clearTimeout(hideTimer.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      growth?.disconnect();
    };
  }, [mounted, scheduleHide, setVisible]);

  const onPointerEnter = (): void => {
    hovering.current = true;
    window.clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const onPointerLeave = (): void => {
    hovering.current = false;
    scheduleHide();
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    const { scrollable, track, thumb: size } = metrics.current;
    const travel = track - size;
    if (scrollable <= 1 || travel <= 0) return;
    event.preventDefault();

    const handle = event.currentTarget;
    const ratio = scrollable / travel; // page pixels per pixel of thumb travel
    const startY = event.clientY;
    const startScroll = window.scrollY;
    handle.setPointerCapture?.(event.pointerId);
    dragging.current = true;
    railRef.current?.setAttribute('data-dragging', 'true');
    window.clearTimeout(hideTimer.current);
    setVisible(true);

    const move = (e: PointerEvent): void => {
      // Instant rather than the smooth scrolling <html> sets for anchor jumps, so the page tracks the pointer.
      window.scrollTo({ top: startScroll + (e.clientY - startY) * ratio, behavior: 'instant' });
    };
    const end = (): void => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      dragging.current = false;
      railRef.current?.removeAttribute('data-dragging');
      scheduleHide();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      data-scroll-indicator=""
      onPointerEnter={interactive ? onPointerEnter : undefined}
      onPointerLeave={interactive ? onPointerLeave : undefined}
      className={`group/indicator fixed inset-y-0 right-0 z-[60] w-3.5 print:hidden ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Rail: carries the reveal. Hidden, it sits 6px to the right at zero opacity; revealed, it slides in over 200ms
          and eases back out over 500ms, so leaving is always gentler than arriving. No slide under reduced motion. */}
      <div
        ref={railRef}
        data-visible="false"
        data-scrollable="true"
        className="group/rail absolute bottom-1.5 right-[3px] top-1.5 w-1.5 translate-x-1.5 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] data-[scrollable=false]:hidden data-[visible=true]:translate-x-0 data-[visible=true]:opacity-100 data-[visible=true]:duration-200 data-[visible=true]:ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-x-0"
      >
        {/* Faint track, only while the edge is hovered or the thumb is dragged. */}
        <div className="absolute inset-y-0 right-0 w-1.5 rounded-full bg-foreground/[0.06] opacity-0 transition-opacity duration-300 group-hover/indicator:opacity-100 group-data-[dragging=true]/rail:opacity-100" />
        {/* Thumb: the gold fill with a hairline of gold ink for an edge on white, ivory and photographs alike. */}
        <div
          ref={thumbRef}
          onPointerDown={interactive ? startDrag : undefined}
          className="absolute right-0 top-0 w-1 touch-none select-none rounded-full bg-accent shadow-[0_0_0_1px_hsl(var(--accent-on-tint)/0.4),0_1px_3px_hsl(220_45%_15%/0.18)] transition-[width,background-color] duration-200 ease-out will-change-transform group-hover/indicator:w-1.5 group-hover/indicator:bg-accent-hover group-data-[dragging=true]/rail:w-1.5 group-data-[dragging=true]/rail:bg-accent-hover motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}
