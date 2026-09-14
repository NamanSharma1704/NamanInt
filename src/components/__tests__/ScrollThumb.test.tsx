import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ScrollThumb from '../ScrollThumb';

function stubPointer(fine: boolean): void {
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
    matches: query === '(pointer: fine)' ? fine : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function stubPage(scrollHeight: number, clientHeight: number, scrollY: number): void {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document.documentElement, 'scrollHeight');
  Reflect.deleteProperty(document.documentElement, 'clientHeight');
  Reflect.deleteProperty(window, 'scrollY');
});

describe('ScrollThumb', () => {
  it('renders nothing on touch screens, which keep their native overlay scrollbars', () => {
    stubPointer(false);
    stubPage(4000, 1000, 0);
    const { container } = render(<ScrollThumb />);
    expect(container.firstChild).toBeNull();
  });

  it('sizes the thumb to the visible share of the page and places it by scroll position', () => {
    stubPointer(true);
    stubPage(4000, 1000, 1500);
    const { container } = render(<ScrollThumb />);
    const thumb = container.querySelector<HTMLElement>('[data-scroll-thumb]');
    expect(thumb).not.toBeNull();
    // Track 992px (4px inset each end); thumb is a quarter of it; halfway down the remaining 744px of travel.
    expect(thumb!.style.height).toBe('248px');
    expect(thumb!.style.transform).toBe('translateY(376px)');
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps a minimum height on very long pages', () => {
    stubPointer(true);
    stubPage(100000, 1000, 0);
    const { container } = render(<ScrollThumb />);
    expect(container.querySelector<HTMLElement>('[data-scroll-thumb]')!.style.height).toBe('48px');
  });

  it('hides the thumb when the page does not scroll', () => {
    stubPointer(true);
    stubPage(1000, 1000, 0);
    const { container } = render(<ScrollThumb />);
    expect(container.querySelector<HTMLElement>('[data-scroll-thumb]')!.style.opacity).toBe('0');
  });
});
