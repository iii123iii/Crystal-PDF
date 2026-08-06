import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from './LandingPage'

function renderLandingPage() {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage responsive layout', () => {
  it('uses compact mobile spacing in the navigation', () => {
    renderLandingPage()

    const navigationContent = screen.getByRole('navigation').firstElementChild
    const homeLink = screen.getByRole('link', { name: 'CrystalPDF home' })
    const signInLink = screen.getAllByRole('link', { name: /^Sign in$/ })[0]

    expect(navigationContent).toHaveClass('px-4', 'sm:px-6')
    expect(homeLink.querySelector('span')).toHaveClass('hidden', 'min-[360px]:inline')
    expect(signInLink).toHaveClass('min-h-11', 'px-2', 'sm:px-4')
  })

  it('stacks dense content and primary actions at phone widths', () => {
    renderLandingPage()

    expect(screen.getByRole('list', { name: 'PDF tools' })).toHaveClass(
      'grid-cols-1',
      'min-[480px]:grid-cols-2',
      'lg:grid-cols-4',
    )
    expect(screen.getByRole('link', { name: /start for free/i })).toHaveClass(
      'w-full',
      'sm:w-auto',
      'justify-center',
    )
    expect(screen.getByRole('contentinfo').firstElementChild).toHaveClass(
      'flex-col',
      'sm:flex-row',
      'text-center',
      'sm:text-left',
    )
  })
})
