import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './LandingPage'

afterEach(cleanup)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<h1>Registration destination</h1>} />
        <Route path="/login" element={<h1>Login destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage responsive-content contract', () => {
  it('retains the brand and both auth actions in named navigation', () => {
    renderPage()
    const nav = within(screen.getByRole('navigation', { name: 'Main navigation' }))
    expect(nav.getByRole('link', { name: /Crystal\s*PDF/ })).toHaveAttribute('href', '/')
    expect(nav.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(nav.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register')
    expect(nav.getAllByRole('link')).toHaveLength(3)
  })

  it('keeps every toolkit card rather than hiding content on small screens', () => {
    renderPage()
    for (const name of ['Merge', 'Split', 'Compress', 'Protect', 'OCR', 'Convert', 'Annotate', 'Export']) {
      expect(screen.getByText(name, { exact: true })).toBeInTheDocument()
    }
  })

  it('keeps all three workflow steps and the original-file explanation', () => {
    renderPage()
    for (const name of ['Upload', 'Process', 'Download']) {
      expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
    }
    expect(screen.getByText('Every operation creates a new file. Your originals are never modified.')).toBeInTheDocument()
  })

  it('takes the primary hero action to the registration route', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('link', { name: 'Start for free' }))
    expect(screen.getByRole('heading', { name: 'Registration destination' })).toBeInTheDocument()
  })

  it('takes the secondary hero action to the login route', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('link', { name: 'Sign in to workspace' }))
    expect(screen.getByRole('heading', { name: 'Login destination' })).toBeInTheDocument()
  })
})
