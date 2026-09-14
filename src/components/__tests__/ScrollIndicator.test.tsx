import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollIndicator, { HIDE_DELAY_MS } from '../ScrollIndicator';

function stubPage(scrollHeight: number, clientHeight: number, scrollY: number): void {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY });
}

const rail = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-visible]')!;
const thumb = (container: HTMLElement) => rail(container).lastElementChild as HTMLElement;
const scroll = () => act(() => void window.dispatchEvent(new Event('scroll')));

beforeEach(() => {
  // The shared setup mocks ResizeObserver with an arrow function, which `new` cannot construct.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const key of ['scrollHeight', 'clientHeight']) Reflect.deleteProperty(document.documentElement, key);
  for (const key of ['innerHeight', 'scrollY']) Reflect.deleteProperty(window, key);
});

describe('ScrollIndicator', () => {
  it('sizes the thumb to the visible share of the page and places it by scroll position', () => {
    stubPage(4000, 1000, 1500);
    const { container } = render(<ScrollIndicator />);
    // Track 988px (6px inset each end); thumb a quarter of it; halfway down the remaining 741px of travel.
    expect(thumb(container).style.height).toBe('247px');
    expect(thumb(container).style.transform).toBe('translate3d(0, 370.50px, 0)');
  });

  it('stays hidden until the page scrolls, then fades out after the idle delay', () => {
    vi.useFakeTimers();
    stubPage(4000, 1000, 0);
    const { container } = render(<ScrollIndicator />);
    expect(rail(container).dataset.visible).toBe('false');

    scroll();
    expect(rail(container).dataset.visible).toBe('true');

    act(() => void vi.advanceTimersByTime(HIDE_DELAY_MS - 50));
    expect(rail(container).dataset.visible).toBe('true');

    act(() => void vi.advanceTimersByTime(100));
    expect(rail(container).dataset.visible).toBe('false');
  });

  it('keeps the indicator up while scrolling continues', () => {
    vi.useFakeTimers();
    stubPage(4000, 1000, 0);
    const { container } = render(<ScrollIndicator />);
    for (let i = 0; i < 5; i++) {
      scroll();
      act(() => void vi.advanceTimersByTime(HIDE_DELAY_MS - 200));
    }
    expect(rail(container).dataset.visible).toBe('true');
  });

  it('reappears immediately when scrolling resumes, including upward', () => {
    vi.useFakeTimers();
    stubPage(4000, 1000, 2000);
    const { container } = render(<ScrollIndicator />);
    scroll();
    act(() => void vi.advanceTimersByTime(HIDE_DELAY_MS + 100));
    expect(rail(container).dataset.visible).toBe('false');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 });
    scroll();
    expect(rail(container).dataset.visible).toBe('true');
  });

  it('hides itself on a page that does not scroll', () => {
    stubPage(1000, 1000, 0);
    const { container } = render(<ScrollIndicator />);
    expect(rail(container).dataset.scrollable).toBe('false');
  });

  it('is hidden from assistive technology and does not take pointer input on touch screens', () => {
    stubPage(4000, 1000, 0);
    const { container } = render(<ScrollIndicator />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.className).toContain('pointer-events-none');
  });
});
