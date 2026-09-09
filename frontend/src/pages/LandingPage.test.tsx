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
  it('prevents horizontal overflow at the page root', () => {
    const { container } = renderLandingPage()
    const rootDiv = container.firstChild as HTMLElement

    expect(rootDiv).toHaveClass('overflow-x-hidden')
    expect(rootDiv).toHaveClass('w-full')
  })

  it('uses responsive navigation padding and 44px minimum touch targets', () => {
    renderLandingPage()

    const navigation = screen.getByRole('navigation')
    const navigationContent = navigation.firstElementChild
    const signIn = screen.getByRole('link', { name: /^sign in$/i })
    const getStarted = screen.getByRole('link', { name: /get started/i })

    expect(navigationContent).toHaveClass('px-4', 'sm:px-6')
    expect(signIn).toHaveClass('min-h-11', 'inline-flex', 'items-center')
    expect(getStarted).toHaveClass('min-h-11', 'inline-flex', 'items-center')
  })

  it('stacks and centers the hero on mobile with fluid typography', () => {
    const { container } = renderLandingPage()
    const heroHeading = screen.getByRole('heading', { level: 1 })
    const heroSection = heroHeading.closest('section')
    const heroContent = heroHeading.parentElement
    const heroActions = screen.getByRole('link', { name: /start for free/i }).parentElement
    const prism = container.querySelector('.prism')
    const componentStyles = container.querySelector('style')?.textContent

    expect(heroHeading).toHaveClass('text-[clamp(2rem,6vw,4.8rem)]')
    expect(heroSection).toHaveClass('grid', 'md:grid-cols-[1fr,auto]', 'px-4', 'sm:px-6')
    expect(heroContent).toHaveClass('text-center', 'md:text-left')
    expect(heroActions).toHaveClass('flex-col', 'sm:flex-row', 'justify-center', 'md:justify-start')
    expect(prism?.parentElement).toHaveClass('flex', 'items-center', 'justify-center')
    expect(componentStyles).toContain('width: min(260px, 72vw)')
    expect(componentStyles).toContain('@media (min-width: 768px)')
  })

  it('renders all tools in a one, two, and four-column responsive grid', () => {
    const { container } = renderLandingPage()
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

    const toolkitGrid = container.querySelector('.tool-card')?.parentElement
    expect(toolkitGrid).toHaveClass('grid-cols-1', 'xs:grid-cols-2', 'lg:grid-cols-4')
    expect(container.querySelectorAll('.tool-card')).toHaveLength(8)
  })

  it('scales step icons and keeps connectors aligned with them', () => {
    const { container } = renderLandingPage()
    const stepLabel = screen.getByText('Step 01')
    const firstStepRow = stepLabel.parentElement?.parentElement
    const firstIcon = firstStepRow?.firstElementChild?.firstElementChild
    const connectorWrappers = Array.from(container.querySelectorAll('.w-px.h-8')).map(
      (connector) => connector.parentElement
    )

    expect(firstIcon).toHaveClass('w-11', 'h-11', 'sm:w-12', 'sm:h-12')
    expect(connectorWrappers).toHaveLength(2)
    for (const connectorWrapper of connectorWrappers) {
      expect(connectorWrapper).toHaveClass('w-11', 'sm:w-12', 'justify-center')
    }
  })

  it('stacks CTA actions and centers the footer on mobile', () => {
    const { container } = renderLandingPage()
    const createAccount = screen.getByRole('link', { name: /create free account/i })
    const ctaActions = createAccount.parentElement
    const footerContent = container.querySelector('footer')?.firstElementChild

    expect(ctaActions).toHaveClass('flex-col', 'sm:flex-row', 'max-w-xs', 'sm:max-w-none')
    expect(createAccount).toHaveClass('w-full', 'sm:w-auto')
    expect(screen.getByRole('link', { name: /or sign in/i })).toHaveClass(
      'w-full',
      'sm:w-auto'
    )
    expect(footerContent).toHaveClass(
      'flex-col',
      'sm:flex-row',
      'text-center',
      'sm:text-left'
    )
  })
})
