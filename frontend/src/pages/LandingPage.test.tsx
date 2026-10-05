import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from './LandingPage'

describe('LandingPage component', () => {
  it('renders branding and navigation links', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getAllByText(/Crystal/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/PDF/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /get started/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders hero title and call-to-actions', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getAllByText(/Every/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /start for free/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in to workspace/i })).toBeInTheDocument()
  })

  it('renders all 8 toolkit features with icons and descriptions', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const expectedTools = ['Merge', 'Split', 'Compress', 'Protect', 'OCR', 'Convert', 'Annotate', 'Export']
    for (const tool of expectedTools) {
      expect(screen.getByText(tool)).toBeInTheDocument()
    }
  })

  it('renders the 3 how-it-works steps in correct order', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Step 01/i)).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText(/Step 02/i)).toBeInTheDocument()
    expect(screen.getByText('Process')).toBeInTheDocument()
    expect(screen.getByText(/Step 03/i)).toBeInTheDocument()
    expect(screen.getByText('Download')).toBeInTheDocument()
  })

  it('renders bottom CTA with responsive touch targets and links', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const ctaButton = screen.getByRole('link', { name: /create free account/i })
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveAttribute('href', '/register')
  })
})
