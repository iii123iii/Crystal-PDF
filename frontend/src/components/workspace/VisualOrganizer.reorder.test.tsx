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

async function openOrganizer() {
  const pdfDoc = {
    numPages: 3,
    getPage: async () => ({
      getViewport: () => ({ width: 90, height: 120 }),
      render: () => ({ promise: Promise.resolve() }),
    }),
  } as unknown as PDFDocumentProxy
  render(<VisualOrganizer pdfDoc={pdfDoc} documentId="synthetic" onClose={vi.fn()} onSaved={vi.fn()} />)
  await screen.findByRole('img', { name: 'Page 3' })
}

function pageCard(originalPage: number) {
  return screen.getByRole('img', { name: `Page ${originalPage}` }).closest('[data-pos]') as HTMLElement
}

function selectPage(originalPage: number) {
  fireEvent.click(within(pageCard(originalPage)).getAllByRole('button')[0])
}

function expectOrder(originalPages: number[]) {
  expect(screen.getAllByRole('img').map(image => image.getAttribute('alt')))
    .toEqual(originalPages.map(page => `Page ${page}`))
}

function expectOnlyRotated(originalPage: number) {
  for (const page of [1, 2, 3]) {
    expect(screen.getByRole('img', { name: `Page ${page}` }))
      .toHaveStyle({ transform: `rotate(${page === originalPage ? 90 : 0}deg)` })
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
    value: vi.fn(() => pageCard(toPage)),
  })
  fireEvent.touchStart(pageCard(fromPage), { touches: [{ clientX: 10, clientY: 10 }] })
  fireEvent.touchMove(pageCard(fromPage), { touches: [{ clientX: 50, clientY: 50 }] })
  fireEvent.touchEnd(pageCard(fromPage), { touches: [] })
}

describe('Page Organizer keeps the selected page identity during reorder', () => {
  it('control: rotates the selected original page before any drag', async () => {
    await openOrganizer()
    selectPage(1)
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectOrder([1, 2, 3])
    expectOnlyRotated(1)
  })

  it('mouse: moves the selected first page to last without rotating its neighbor', async () => {
    await openOrganizer()
    selectPage(1)
    mouseMove(1, 3)
    expectOrder([2, 3, 1])
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectOnlyRotated(1)
  })

  it('mouse: keeps an unmoved selected page when another page crosses it backwards', async () => {
    await openOrganizer()
    selectPage(2)
    mouseMove(3, 1)
    expectOrder([3, 1, 2])
    fireEvent.keyDown(window, { key: 'r' })
    expectOnlyRotated(2)
  })

  it('mouse: deletes the selected moved page rather than the page now at its old position', async () => {
    await openOrganizer()
    selectPage(1)
    mouseMove(1, 3)
    expectOrder([2, 3, 1])
    fireEvent.keyDown(window, { key: 'd' })
    expectOrder([2, 3])
    expect(screen.queryByRole('img', { name: 'Page 1' })).not.toBeInTheDocument()
  })

  it('touch: moves the selected first page to last without rotating its neighbor', async () => {
    await openOrganizer()
    selectPage(1)
    touchMove(1, 3)
    expectOrder([2, 3, 1])
    fireEvent.keyDown(window, { key: 'r' })
    expectOnlyRotated(1)
  })

  it('touch: keeps an unmoved selected page when another page crosses it backwards', async () => {
    await openOrganizer()
    selectPage(2)
    touchMove(3, 1)
    expectOrder([3, 1, 2])
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectOnlyRotated(2)
  })

  it('control: same-position drop preserves order and selection', async () => {
    await openOrganizer()
    selectPage(2)
    mouseMove(2, 2)
    expectOrder([1, 2, 3])
    fireEvent.keyDown(window, { key: 'r' })
    expectOnlyRotated(2)
  })

  it('control: ending a mouse drag without dropping preserves selection', async () => {
    await openOrganizer()
    selectPage(2)
    fireEvent.dragStart(pageCard(2), { dataTransfer: { effectAllowed: 'none' } })
    fireEvent.dragOver(pageCard(3))
    fireEvent.dragEnd(pageCard(2))
    expectOrder([1, 2, 3])
    fireEvent.keyDown(window, { key: 'r' })
    expectOnlyRotated(2)
  })

  it('control: touch start and end without movement preserve selection', async () => {
    await openOrganizer()
    selectPage(2)
    fireEvent.touchStart(pageCard(2), { touches: [{ clientX: 10, clientY: 10 }] })
    fireEvent.touchEnd(pageCard(2), { touches: [] })
    expectOrder([1, 2, 3])
    fireEvent.keyDown(window, { key: 'r' })
    expectOnlyRotated(2)
  })

  it('control: reorder with no selected page does not create a selection', async () => {
    await openOrganizer()
    mouseMove(1, 3)
    expectOrder([2, 3, 1])
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument()
  })
})
