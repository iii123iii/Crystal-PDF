import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageNumberOverlay from './PageNumberOverlay'

const defaults = {
  pageNum: 1,
  totalPages: 5,
  pageWidth: 595,
  pageHeight: 842,
  position: 'bottom-center',
  startNumber: 1,
  fontSize: 10,
  format: 'number',
}

describe('PageNumberOverlay – format rendering', () => {
  it('renders plain number format', () => {
    render(<PageNumberOverlay {...defaults} format="number" />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders page-number format', () => {
    render(<PageNumberOverlay {...defaults} format="page-number" />)
    expect(screen.getByText('Page 1')).toBeInTheDocument()
  })

  it('renders number-of-total format', () => {
    render(<PageNumberOverlay {...defaults} format="number-of-total" />)
    expect(screen.getByText('1 of 5')).toBeInTheDocument()
  })

  it('renders page-number-of-total format', () => {
    render(<PageNumberOverlay {...defaults} format="page-number-of-total" />)
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
  })
})

describe('PageNumberOverlay – startNumber offset', () => {
  it('offsets page number by startNumber', () => {
    render(<PageNumberOverlay {...defaults} pageNum={1} startNumber={5} format="number" />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('offsets on page 3 with startNumber=10', () => {
    render(<PageNumberOverlay {...defaults} pageNum={3} startNumber={10} format="number" />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders correct total for number-of-total with startNumber', () => {
    // total = startNumber + totalPages - 1 = 5 + 10 - 1 = 14
    render(
      <PageNumberOverlay
        {...defaults}
        pageNum={2}
        startNumber={5}
        totalPages={10}
        format="number-of-total"
      />,
    )
    expect(screen.getByText('6 of 14')).toBeInTheDocument()
  })
})

describe('PageNumberOverlay – page iteration', () => {
  it('renders correct number for each page', () => {
    for (let p = 1; p <= 3; p++) {
      const { unmount } = render(
        <PageNumberOverlay {...defaults} pageNum={p} format="number" />,
      )
      expect(screen.getByText(String(p))).toBeInTheDocument()
      unmount()
    }
  })
})

describe('PageNumberOverlay – font scaling', () => {
  it('scales font size relative to page width', () => {
    // At full width (595), scale = 1, so fontSize=10 → 10px
    render(<PageNumberOverlay {...defaults} fontSize={10} pageWidth={595} />)
    const el = screen.getByText('1')
    expect(el.style.fontSize).toBe('10px')
  })

  it('scales font size down for narrower pages', () => {
    render(<PageNumberOverlay {...defaults} fontSize={10} pageWidth={297.5} />)
    const el = screen.getByText('1')
    const size = parseFloat(el.style.fontSize)
    expect(size).toBeCloseTo(5, 0)
  })
})

describe('PageNumberOverlay – position styles', () => {
  it('bottom-center uses bottom + translateX', () => {
    render(<PageNumberOverlay {...defaults} position="bottom-center" />)
    const el = screen.getByText('1')
    expect(el.style.bottom).toBeTruthy()
    expect(el.style.transform).toContain('translateX(-50%)')
  })

  it('top-center uses top + translateX', () => {
    render(<PageNumberOverlay {...defaults} position="top-center" />)
    const el = screen.getByText('1')
    expect(el.style.top).toBeTruthy()
    expect(el.style.transform).toContain('translateX(-50%)')
  })

  it('bottom-left uses bottom + left', () => {
    render(<PageNumberOverlay {...defaults} position="bottom-left" />)
    const el = screen.getByText('1')
    expect(el.style.bottom).toBeTruthy()
    expect(el.style.left).toBeTruthy()
  })

  it('bottom-right uses bottom + right', () => {
    render(<PageNumberOverlay {...defaults} position="bottom-right" />)
    const el = screen.getByText('1')
    expect(el.style.bottom).toBeTruthy()
    expect(el.style.right).toBeTruthy()
  })

  it('top-left uses top + left', () => {
    render(<PageNumberOverlay {...defaults} position="top-left" />)
    const el = screen.getByText('1')
    expect(el.style.top).toBeTruthy()
    expect(el.style.left).toBeTruthy()
  })

  it('top-right uses top + right', () => {
    render(<PageNumberOverlay {...defaults} position="top-right" />)
    const el = screen.getByText('1')
    expect(el.style.top).toBeTruthy()
    expect(el.style.right).toBeTruthy()
  })

  it('defaults to bottom-center for unknown position', () => {
    render(<PageNumberOverlay {...defaults} position="unknown-position" />)
    const el = screen.getByText('1')
    expect(el.style.bottom).toBeTruthy()
    expect(el.style.transform).toContain('translateX(-50%)')
  })
})

describe('PageNumberOverlay – container', () => {
  it('outer div matches page dimensions', () => {
    const { container } = render(
      <PageNumberOverlay {...defaults} pageWidth={300} pageHeight={400} />,
    )
    const outer = container.firstChild as HTMLElement
    expect(outer.style.width).toBe('300px')
    expect(outer.style.height).toBe('400px')
  })
})
