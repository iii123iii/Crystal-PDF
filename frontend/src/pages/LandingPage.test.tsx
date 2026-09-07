import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage – Responsive Layout & Content', () => {
  it('renders root container with overflow-x-hidden to prevent mobile viewport scroll leaks', () => {
    const { container } = renderLandingPage()
    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).toHaveClass('overflow-x-hidden')
    expect(rootDiv).toHaveClass('w-full')
  })

  it('renders responsive navigation with logo and action links', () => {
    renderLandingPage()
    expect(screen.getAllByText('Crystal').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('PDF').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
  })

  it('renders hero title, description, and primary CTA buttons', () => {
    renderLandingPage()
    const heroHeading = screen.getByRole('heading', { level: 1 })
    expect(heroHeading).toHaveTextContent(/Every/i)
    expect(heroHeading).toHaveTextContent(/PDF tool/i)
    expect(heroHeading).toHaveTextContent(/need\./i)
    expect(screen.getByRole('link', { name: /start for free/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in to workspace/i })).toBeInTheDocument()
  })

  it('renders all 8 tools in the responsive toolkit grid', () => {
    renderLandingPage()
    const expectedTools = [
      'Merge',
      'Split',
      'Compress',
      'Protect',
      'OCR',
      'Convert',
      'Annotate',
      'Export',
    ]
    for (const tool of expectedTools) {
      expect(screen.getByText(tool)).toBeInTheDocument()
    }
  })

  it('renders the 3 steps in How It Works section', () => {
    renderLandingPage()
    expect(screen.getByText("Three steps, that's it")).toBeInTheDocument()
    expect(screen.getByText('Step 01')).toBeInTheDocument()
    expect(screen.getByText('Step 02')).toBeInTheDocument()
    expect(screen.getByText('Step 03')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Process')).toBeInTheDocument()
    expect(screen.getByText('Download')).toBeInTheDocument()
  })

  it('renders the bottom CTA section and footer', () => {
    renderLandingPage()
    expect(screen.getByText(/start working with/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create free account/i })).toBeInTheDocument()
    expect(screen.getByText(/secure, server-side processing/i)).toBeInTheDocument()
  })
})
