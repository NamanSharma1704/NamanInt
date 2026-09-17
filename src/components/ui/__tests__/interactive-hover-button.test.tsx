import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { InteractiveHoverButton, InteractiveHoverLink } from '../interactive-hover-button';

describe('InteractiveHoverLink', () => {
  it('is one link with no button inside, named once', () => {
    const { container } = render(
      <MemoryRouter>
        <InteractiveHoverLink to="/contact">Begin an inquiry</InteractiveHoverLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Begin an inquiry' });
    expect(link).toHaveAttribute('href', '/contact');
    expect(container.querySelector('button')).toBeNull();
    // The sliding copy of the label is for the eye only.
    expect(link.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('Begin an inquiry');
  });
});

describe('InteractiveHoverButton', () => {
  it('reads its label once', () => {
    render(<InteractiveHoverButton type="submit">Send inquiry</InteractiveHoverButton>);

    expect(screen.getByRole('button', { name: 'Send inquiry' })).toHaveAttribute('type', 'submit');
  });
});
