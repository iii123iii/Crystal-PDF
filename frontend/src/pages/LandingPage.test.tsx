import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'

// Responsive landing page (issue #3): "make my landing page responsive for mobile".
// These tests render the real component and assert the responsive behaviour that
// fixes horizontal overflow and cramped layouts on small screens.

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage responsive layout (#3)', () => {
  it('renders the hero heading and primary calls to action', () => {
    renderLanding()
    expect(screen.getByText(/you'll ever/i)).toBeInTheDocument()
    expect(screen.getAllByText(/start for free/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/get started/i).length).toBeGreaterThan(0)
  })

  it('guards the page root against horizontal overflow', () => {
    const { container } = renderLanding()
    const root = container.firstElementChild as HTMLElement
    // overflow-x-hidden prevents the decorative glow / prism from causing
    // sideways scroll on narrow viewports.
    expect(root.className).toMatch(/overflow-x-hidden/)
  })

  it('uses a single-column tools grid on the smallest screens', () => {
    const { container } = renderLanding()
    // The tools grid is the one that expands to 4 columns on desktop.
    const grid = container.querySelector('.grid-cols-1')
    expect(grid).not.toBeNull()
    // Base (mobile-first) grid must be single column, then expand at breakpoints.
    expect(grid!.className).toMatch(/grid-cols-1/)
    expect(grid!.className).toMatch(/sm:grid-cols-4/)
  })

  it('renders all eight tool cards', () => {
    renderLanding()
    for (const name of ['Merge', 'Split', 'Compress', 'Protect', 'OCR', 'Convert', 'Annotate', 'Export']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('stacks hero action buttons vertically on mobile (flex-col sm:flex-row)', () => {
    const { container } = renderLanding()
    const stacked = container.querySelector('.flex-col.sm\\:flex-row')
    expect(stacked).not.toBeNull()
  })

  it('sizes the decorative prism with fluid clamp() so it never overflows', () => {
    const { container } = renderLanding()
    const style = container.querySelector('style')!.textContent!
    // The prism must use fluid clamp() sizing rather than a rigid 340px width.
    expect(style).toMatch(/\.prism\s*\{[^}]*width:\s*clamp\(/)
    expect(style).toMatch(/\.prism\s*\{[^}]*height:\s*clamp\(/)
    expect(style).not.toMatch(/\.prism\s*\{[^}]*width:\s*340px/)
  })

  it('respects prefers-reduced-motion for decorative animations', () => {
    const { container } = renderLanding()
    const style = container.querySelector('style')!.textContent!
    expect(style).toMatch(/prefers-reduced-motion/)
  })

  it('reduces horizontal padding on mobile via responsive sm: breakpoints', () => {
    const { container } = renderLanding()
    const html = container.innerHTML
    // Nav / section paddings should shrink on mobile and grow at sm:.
    expect(html).toMatch(/px-4 sm:px-6/)
  })
})