import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WatermarkOverlay from './WatermarkOverlay'

const defaults = {
  pageWidth: 595,
  pageHeight: 842,
  text: 'CONFIDENTIAL',
  fontSize: 48,
  opacity: 0.3,
  rotation: -45,
  position: 'center',
}

describe('WatermarkOverlay – rendering', () => {
  it('renders the watermark text', () => {
    render(<WatermarkOverlay {...defaults} />)
    expect(screen.getByText('CONFIDENTIAL')).toBeInTheDocument()
  })

  it('renders nothing for blank text', () => {
    const { container } = render(<WatermarkOverlay {...defaults} text="   " />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for empty string text', () => {
    const { container } = render(<WatermarkOverlay {...defaults} text="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders custom text', () => {
    render(<WatermarkOverlay {...defaults} text="DRAFT" />)
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })
})

describe('WatermarkOverlay – font size scaling', () => {
  it('scales font size relative to page width', () => {
    // At 595px wide, fontSize=48 should stay at 48px (scale factor = 1)
    render(<WatermarkOverlay {...defaults} fontSize={48} pageWidth={595} />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.fontSize).toBe('48px')
  })

  it('scales font size down for narrower pages', () => {
    // Half width → half font size
    render(<WatermarkOverlay {...defaults} fontSize={48} pageWidth={297.5} />)
    const el = screen.getByText('CONFIDENTIAL')
    // ~24px
    const size = parseFloat(el.style.fontSize)
    expect(size).toBeCloseTo(24, 0)
  })
})

describe('WatermarkOverlay – opacity', () => {
  it('applies the opacity style', () => {
    render(<WatermarkOverlay {...defaults} opacity={0.5} />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.opacity).toBe('0.5')
  })
})

describe('WatermarkOverlay – rotation', () => {
  it('negates the rotation angle in the CSS transform (center)', () => {
    render(<WatermarkOverlay {...defaults} rotation={-45} position="center" />)
    const el = screen.getByText('CONFIDENTIAL')
    // Rotation is negated: CSS should use +45deg
    expect(el.style.transform).toContain('rotate(45deg)')
  })

  it('negates the rotation angle for top-left', () => {
    render(<WatermarkOverlay {...defaults} rotation={30} position="top-left" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.transform).toContain('rotate(-30deg)')
  })

  it('applies zero rotation correctly', () => {
    render(<WatermarkOverlay {...defaults} rotation={0} position="center" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.transform).toContain('rotate(0deg)')
  })
})

describe('WatermarkOverlay – position styles', () => {
  it('positions top-left correctly', () => {
    render(<WatermarkOverlay {...defaults} position="top-left" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.left).toBeTruthy()
    expect(el.style.top).toBeTruthy()
  })

  it('positions top-right correctly', () => {
    render(<WatermarkOverlay {...defaults} position="top-right" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.right).toBeTruthy()
    expect(el.style.top).toBeTruthy()
  })

  it('positions bottom-left correctly', () => {
    render(<WatermarkOverlay {...defaults} position="bottom-left" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.left).toBeTruthy()
    expect(el.style.bottom).toBeTruthy()
  })

  it('positions bottom-right correctly', () => {
    render(<WatermarkOverlay {...defaults} position="bottom-right" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.right).toBeTruthy()
    expect(el.style.bottom).toBeTruthy()
  })

  it('positions center with translate', () => {
    render(<WatermarkOverlay {...defaults} position="center" />)
    const el = screen.getByText('CONFIDENTIAL')
    expect(el.style.left).toBe('50%')
    expect(el.style.top).toBe('50%')
    expect(el.style.transform).toContain('translate(-50%, -50%)')
  })
})

describe('WatermarkOverlay – container', () => {
  it('outer div matches the page dimensions', () => {
    const { container } = render(
      <WatermarkOverlay {...defaults} pageWidth={300} pageHeight={400} />,
    )
    const outer = container.firstChild as HTMLElement
    expect(outer.style.width).toBe('300px')
    expect(outer.style.height).toBe('400px')
  })
})
