import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './LandingPage'

const links = [
  ['Crystal PDF', '/'],
  ['Sign in', '/login'],
  ['Get started', '/register'],
  ['Start for free', '/register'],
  ['Sign in to workspace', '/login'],
  ['Create free account', '/register'],
  ['or sign in', '/login'],
] as const

function renderLanding() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<h1>Login destination</h1>} />
        <Route path="/register" element={<h1>Register destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('retains the toolkit and workflow inside a main landmark', () => {
    renderLanding()
    const main = within(screen.getByRole('main'))
    for (const name of ['Merge', 'Split', 'Compress', 'Protect', 'OCR', 'Convert', 'Annotate', 'Export']) {
      expect(main.getByText(name, { exact: true })).toBeInTheDocument()
    }
    for (const name of ['Upload', 'Process', 'Download']) {
      expect(main.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
    }
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('preserves every public link and destination', () => {
    renderLanding()
    expect(screen.getAllByRole('link')).toHaveLength(links.length)
    for (const [name, href] of links) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })

  it.each(links.slice(1))('navigates %s to %s', async (name, href) => {
    const user = userEvent.setup()
    renderLanding()
    await user.click(screen.getByRole('link', { name }))
    expect(screen.getByRole('heading', {
      name: href === '/login' ? 'Login destination' : 'Register destination',
    })).toBeInTheDocument()
  })

  it('keeps all links reachable in document order with the keyboard', async () => {
    const user = userEvent.setup()
    renderLanding()
    for (const [name] of links) {
      await user.tab()
      expect(screen.getByRole('link', { name })).toHaveFocus()
    }
  })
})
