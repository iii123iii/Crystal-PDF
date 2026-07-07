import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from './LandingPage'

function renderLandingPage() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>,
  )
}

describe('LandingPage', () => {
  it('renders the main calls to action and toolkit', () => {
    renderLandingPage()

    expect(screen.getByRole('heading', { name: /every pdf tool/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start for free/i })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /sign in to workspace/i })).toHaveAttribute('href', '/login')

    for (const tool of ['Merge', 'Split', 'Compress', 'Protect', 'OCR', 'Convert', 'Annotate', 'Export']) {
      expect(screen.getByText(tool)).toBeInTheDocument()
    }
  })
})
