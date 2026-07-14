import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import LandingPage from './LandingPage'

function renderLandingPage() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>,
  )
}

describe('LandingPage responsive layout', () => {
  it('keeps mobile-safe navigation and CTA sizing classes', () => {
    const { container } = renderLandingPage()

    const shell = container.firstElementChild
    expect(shell?.className).toContain('overflow-x-hidden')

    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('pt-[env(safe-area-inset-top)]')

    const navCta = screen.getByRole('link', { name: 'Get started' })
    expect(navCta.className).toContain('whitespace-nowrap')
    expect(navCta.className).toContain('min-h-11')
    expect(navCta.className).toContain('px-3')
    expect(navCta.className).toContain('sm:px-4')

    const navSignIn = screen.getAllByRole('link', { name: /sign in/i }).find((link) => link.textContent === 'Sign in')
    expect(navSignIn?.className).toContain('min-h-11')

    const heroCta = screen.getByRole('link', { name: /start for free/i })
    expect(heroCta.className).toContain('justify-center')
    expect(heroCta.className).toContain('w-full')
    expect(heroCta.className).toContain('sm:w-auto')

    const secondaryHeroCta = screen.getByRole('link', { name: /sign in to workspace/i })
    expect(secondaryHeroCta.className).toContain('w-full')
    expect(secondaryHeroCta.className).toContain('sm:w-auto')
  })

  it('keeps the tools grid single-column at narrow phone widths', () => {
    renderLandingPage()

    const firstToolCard = screen.getByText('Merge').closest('.tool-card')
    const toolsGrid = firstToolCard?.parentElement

    expect(toolsGrid?.className).toContain('grid-cols-1')
    expect(toolsGrid?.className).toContain('min-[420px]:grid-cols-2')
    expect(toolsGrid?.className).toContain('sm:grid-cols-4')
  })

  it('keeps the final CTA buttons stacked on mobile', () => {
    renderLandingPage()

    const finalCta = screen.getByRole('link', { name: /create free account/i })
    const finalCtaGroup = finalCta.parentElement

    expect(finalCta.className).toContain('w-full')
    expect(finalCta.className).toContain('sm:w-auto')
    expect(finalCtaGroup?.className).toContain('flex-col')
    expect(finalCtaGroup?.className).toContain('sm:flex-row')
  })

  it('keeps the mobile viewport metadata safe for notched devices', () => {
    const indexHtml = readFileSync('index.html', 'utf8')

    expect(indexHtml).toContain('viewport-fit=cover')
    expect(indexHtml).toContain('name="theme-color"')
  })
})
