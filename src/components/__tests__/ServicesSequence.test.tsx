/**
 * ServicesSequence: the scroll-to-step mapping, and the section in jsdom. jsdom
 * has no layout, so this covers structure and wiring; the pinning itself is
 * checked in a browser.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ServicesSequence, { stepForScroll } from '../ServicesSequence'

/** motion's whileInView needs an IntersectionObserver, which jsdom lacks. */
class InertIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const STEPS = [
  { title: 'Sourcing direction', text: 'Discovery.', image: { src: '/a.jpg', alt: 'A' } },
  { title: 'Supplier coordination', text: 'Communication.', image: { src: '/b.jpg', alt: 'B' } },
  { title: 'Quality assurance', text: 'Process.', image: { src: '/c.jpg', alt: 'C' } },
  { title: 'Shipping support', text: 'Handoffs.', image: { src: '/d.jpg', alt: 'D' } },
]

function renderSequence() {
  return render(
    <MemoryRouter>
      <ServicesSequence
        eyebrow="Trade services"
        title="A practical framework"
        intro="Intro."
        cta={{ href: '/trade-services', label: 'Explore trade services' }}
        steps={STEPS}
      />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', InertIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('stepForScroll', () => {
  it('shows the first step until the section pins', () => {
    expect(stepForScroll(-500, 1000, 4)).toBe(0)
    expect(stepForScroll(0, 1000, 4)).toBe(0)
  })

  it('gives every step an equal share of the travel', () => {
    expect(stepForScroll(249, 1000, 4)).toBe(0)
    expect(stepForScroll(250, 1000, 4)).toBe(1)
    expect(stepForScroll(500, 1000, 4)).toBe(2)
    expect(stepForScroll(750, 1000, 4)).toBe(3)
  })

  it('holds the last step at and past the end of the track', () => {
    expect(stepForScroll(1000, 1000, 4)).toBe(3)
    expect(stepForScroll(5000, 1000, 4)).toBe(3)
  })

  it('stays on the first step when there is nothing to travel', () => {
    expect(stepForScroll(300, 0, 4)).toBe(0)
    expect(stepForScroll(300, 1000, 1)).toBe(0)
  })
})

describe('ServicesSequence', () => {
  it('renders every service, so all four reach the server HTML', () => {
    renderSequence()
    for (const step of STEPS) {
      expect(screen.getByRole('heading', { level: 3, name: step.title })).toBeInTheDocument()
    }
  })

  it('marks only the first service current in both indexes', () => {
    renderSequence()
    const current = screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'step')
    expect(current).toHaveLength(2)
    expect(current[0]).toHaveTextContent('Sourcing direction')
    expect(current[1]).toHaveAccessibleName('Show Sourcing direction')
  })

  it('scrolls to a service when its index entry is pressed', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderSequence()

    fireEvent.click(screen.getAllByRole('button', { name: /Quality assurance/ })[0]!)

    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('sends the call to action through the router, not a new tab', () => {
    renderSequence()
    const link = screen.getByRole('link', { name: /Explore trade services/ })
    expect(link).toHaveAttribute('href', '/trade-services')
    expect(link).not.toHaveAttribute('target')
    // Only the caller's → arrow: the off-site ↗ is not added to internal links.
    expect(link.querySelectorAll('svg')).toHaveLength(1)
  })
})
