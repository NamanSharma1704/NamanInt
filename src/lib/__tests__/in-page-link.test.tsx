import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { followInPageLink } from '../in-page-link';

function Page() {
  return (
    <>
      <a href="#target" onClick={followInPageLink}>
        Go
      </a>
      <a href="#missing" onClick={followInPageLink}>
        Nowhere
      </a>
      <section id="target" tabIndex={-1}>
        Target
      </section>
    </>
  );
}

describe('followInPageLink', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    // jsdom does not implement scrolling.
    Element.prototype.scrollIntoView = scrollIntoView;
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    scrollIntoView.mockReset();
  });

  it('scrolls to the target, focuses it and records the hash', () => {
    const { getByText } = render(<Page />);
    const click = fireEvent.click(getByText('Go'));

    expect(click).toBe(false); // default prevented
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe(getByText('Target'));
    expect(window.location.hash).toBe('#target');
  });

  it('jumps without smooth scrolling under reduced motion', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const { getByText } = render(<Page />);
      fireEvent.click(getByText('Go'));
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it('leaves modified clicks to the browser', () => {
    const { getByText } = render(<Page />);
    const click = fireEvent.click(getByText('Go'), { ctrlKey: true });

    expect(click).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does nothing when the target does not exist', () => {
    const { getByText } = render(<Page />);
    const click = fireEvent.click(getByText('Nowhere'));

    expect(click).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
