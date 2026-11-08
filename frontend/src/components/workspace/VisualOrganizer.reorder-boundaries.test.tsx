import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { VisualOrganizer } from './VisualOrganizer'

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {} }))

const originalElementFromPoint = Object.getOwnPropertyDescriptor(document, 'elementFromPoint')

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,cGFnZQ==')
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalElementFromPoint) Object.defineProperty(document, 'elementFromPoint', originalElementFromPoint)
  else Reflect.deleteProperty(document, 'elementFromPoint')
})

async function openOrganizer(strict = false) {
  const pdfDoc = {
    numPages: 6,
    getPage: async () => ({
      getViewport: () => ({ width: 90, height: 120 }),
      render: () => ({ promise: Promise.resolve() }),
    }),
  } as unknown as PDFDocumentProxy
  const organizer = <VisualOrganizer pdfDoc={pdfDoc} documentId="synthetic" onClose={vi.fn()} onSaved={vi.fn()} />
  render(strict ? <StrictMode>{organizer}</StrictMode> : organizer)
  await screen.findByRole('img', { name: 'Page 6' })
}

function pageCard(originalPage: number) {
  return screen.getByRole('img', { name: `Page ${originalPage}` }).closest('[data-pos]') as HTMLElement
}

function selectPages(originalPages: number[]) {
  originalPages.forEach((page, index) => {
    fireEvent.click(within(pageCard(page)).getAllByRole('button')[0], { ctrlKey: index > 0 })
  })
}

function expectOrder(originalPages: number[]) {
  expect(screen.getAllByRole('img').map(image => image.getAttribute('alt')))
    .toEqual(originalPages.map(page => `Page ${page}`))
}

function expectRotations(selectedPages: number[], remainingPages = [1, 2, 3, 4, 5, 6]) {
  for (const page of remainingPages) {
    expect(screen.getByRole('img', { name: `Page ${page}` }))
      .toHaveStyle({ transform: `rotate(${selectedPages.includes(page) ? 90 : 0}deg)` })
  }
}

function mouseMove(fromPage: number, toPage: number) {
  const dataTransfer = { effectAllowed: 'none' }
  fireEvent.dragStart(pageCard(fromPage), { dataTransfer })
  fireEvent.dragOver(pageCard(toPage), { dataTransfer })
  fireEvent.drop(pageCard(toPage), { dataTransfer })
  fireEvent.dragEnd(pageCard(fromPage), { dataTransfer })
}

function touchMove(fromPage: number, toPage: number) {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => pageCard(toPage),
  })
  fireEvent.touchStart(pageCard(fromPage), { touches: [{ clientX: 10, clientY: 10 }] })
  fireEvent.touchMove(pageCard(fromPage), { touches: [{ clientX: 50, clientY: 50 }] })
  fireEvent.touchEnd(pageCard(fromPage), { touches: [] })
}

// Expected orders are literal examples, and selected identities are the pages
// clicked before moving. Neither oracle reimplements positional index remapping.
const cases = [
  { name: 'forward selected moved page', from: 2, to: 5, selected: [2], order: [1, 3, 4, 5, 2, 6] },
  { name: 'forward crossed pages including destination', from: 2, to: 5, selected: [3, 5], order: [1, 3, 4, 5, 2, 6] },
  { name: 'forward selections before and after interval', from: 2, to: 5, selected: [1, 6], order: [1, 3, 4, 5, 2, 6] },
  { name: 'forward mixed selection', from: 2, to: 5, selected: [1, 2, 4, 6], order: [1, 3, 4, 5, 2, 6] },
  { name: 'backward selected moved page', from: 5, to: 2, selected: [5], order: [1, 5, 2, 3, 4, 6] },
  { name: 'backward crossed pages including destination', from: 5, to: 2, selected: [2, 4], order: [1, 5, 2, 3, 4, 6] },
  { name: 'backward selections before and after interval', from: 5, to: 2, selected: [1, 6], order: [1, 5, 2, 3, 4, 6] },
  { name: 'backward mixed selection', from: 5, to: 2, selected: [1, 3, 5, 6], order: [1, 5, 2, 3, 4, 6] },
  { name: 'first page to last', from: 1, to: 6, selected: [1, 3, 6], order: [2, 3, 4, 5, 6, 1] },
  { name: 'last page to first', from: 6, to: 1, selected: [1, 3, 6], order: [6, 1, 2, 3, 4, 5] },
  { name: 'adjacent forward selected pages', from: 3, to: 4, selected: [3, 4], order: [1, 2, 4, 3, 5, 6] },
  { name: 'adjacent backward selected pages', from: 4, to: 3, selected: [3, 4], order: [1, 2, 4, 3, 5, 6] },
]

describe.each([
  { name: 'mouse', move: mouseMove },
  { name: 'touch', move: touchMove },
])('$name reorder selection boundaries', ({ move }) => {
  describe.each([false, true])('StrictMode %s', strict => {
    it.each(cases)('$name', async ({ from, to, selected, order }) => {
      await openOrganizer(strict)
      selectPages(selected)
      move(from, to)
      expectOrder(order)
      expect(screen.getByText(`${selected.length} selected`)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
      expectRotations(selected)
    })
  })

  it('retains all selected identities after selecting all and moving', async () => {
    await openOrganizer()
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    move(2, 5)
    expectOrder([1, 3, 4, 5, 2, 6])
    expect(screen.getByText('6 selected')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'r' })
    expectRotations([1, 2, 3, 4, 5, 6])
  })

  it('keeps multiple selected identities through repeated moves', async () => {
    await openOrganizer()
    selectPages([2, 5])
    move(2, 6)
    expectOrder([1, 3, 4, 5, 6, 2])
    move(5, 1)
    expectOrder([5, 1, 3, 4, 6, 2])
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expectOrder([1, 3, 4, 6])
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('preserves the original deletion contract after a reorder', async () => {
    await openOrganizer()
    selectPages([2, 5])
    move(2, 6)
    expectOrder([1, 3, 4, 5, 6, 2])
    fireEvent.click(within(pageCard(1)).getByTitle('Delete page'))
    expectOrder([3, 4, 5, 6, 2])
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectRotations([2, 5], [2, 3, 4, 5, 6])
  })

  it('keeps the surviving selected identity when a selected reordered page is deleted', async () => {
    await openOrganizer()
    selectPages([2, 5])
    move(2, 6)
    fireEvent.click(within(pageCard(2)).getByTitle('Delete page'))
    expectOrder([1, 3, 4, 5, 6])
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'r' })
    expectRotations([5], [1, 3, 4, 5, 6])
  })

  it('uses current positions when reordering after an individual deletion', async () => {
    await openOrganizer()
    selectPages([3, 6])
    fireEvent.click(within(pageCard(1)).getByTitle('Delete page'))
    move(3, 6)
    expectOrder([2, 4, 5, 6, 3])
    fireEvent.keyDown(window, { key: 'r' })
    expectRotations([3, 6], [2, 3, 4, 5, 6])
  })
})
