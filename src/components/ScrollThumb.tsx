import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/** Gap between the thumb and the top and bottom of the window, in px. */
const INSET = 4;

/** Shortest the thumb gets on a very long page, so it stays easy to grab. */
const MIN_HEIGHT = 48;

/**
 * The page's scroll thumb on mouse and trackpad screens.
 *
 * globals.css hides the root scrollbar under `(pointer: fine)`, which removes both the track and the gutter Chrome
 * reserves for it. This draws the thumb back as a slim gold bar floating over the page, and keeps it draggable.
 * The page still scrolls by wheel, keyboard and touch without it, so it is hidden from assistive technology. Touch
 * screens keep their native overlay scrollbars and never render it, and neither does the server.
 */
export default function ScrollThumb() {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(pointer: fine)');
    const sync = (): void => setEnabled(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const thumb = thumbRef.current;
    if (!enabled || !thumb) return;
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const { scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 1) {
        thumb.style.opacity = '0';
        return;
      }
      const track = clientHeight - INSET * 2;
      const height = Math.max(MIN_HEIGHT, (clientHeight / scrollHeight) * track);
      const scrolled = Math.min(Math.max(window.scrollY, 0), scrollable);
      const top = INSET + (scrolled / scrollable) * (track - height);
      thumb.style.opacity = '';
      thumb.style.height = `${Math.round(height)}px`;
      thumb.style.transform = `translateY(${Math.round(top)}px)`;
    };
    const schedule = (): void => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Content that settles after load (images, the pinned sections, the WebGL figures) changes the page height
    // without firing a scroll or resize event.
    const growth = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    growth?.observe(document.body);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      growth?.disconnect();
    };
  }, [enabled]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    const thumb = event.currentTarget;
    const { scrollHeight, clientHeight } = document.documentElement;
    const travel = clientHeight - INSET * 2 - thumb.getBoundingClientRect().height;
    if (travel <= 0) return;
    event.preventDefault();

    // Page pixels per pixel of thumb movement.
    const ratio = (scrollHeight - clientHeight) / travel;
    const startY = event.clientY;
    const startScroll = window.scrollY;
    thumb.setPointerCapture?.(event.pointerId);
    setDragging(true);

    const move = (e: PointerEvent): void => {
      // Instant, not the smooth scroll <html> sets for anchor jumps, so the page tracks the pointer.
      window.scrollTo({ top: startScroll + (e.clientY - startY) * ratio, behavior: 'instant' });
    };
    const end = (): void => {
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', end);
      thumb.removeEventListener('pointercancel', end);
      setDragging(false);
    };
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', end);
    thumb.addEventListener('pointercancel', end);
  };

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 right-0 z-[60] w-3.5">
      <div
        ref={thumbRef}
        data-scroll-thumb=""
        onPointerDown={startDrag}
        className={`pointer-events-auto absolute right-[3px] top-0 touch-none select-none rounded-full transition-[width,background-color,opacity] duration-200 motion-reduce:transition-none ${
          dragging ? 'w-2 bg-accent' : 'w-1.5 bg-accent/70 hover:w-2 hover:bg-accent/90'
        }`}
      />
    </div>
  );
}
