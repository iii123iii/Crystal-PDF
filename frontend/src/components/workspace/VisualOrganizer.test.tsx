import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { VisualOrganizer } from './VisualOrganizer'

// PDF rendering is external to the selection contract. Keep the real organizer,
// state updates and button/keyboard events; render three synthetic thumbnails.
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {} }))

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,cGFnZQ==')
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

function selectPage(originalPage: number, multi = false) {
  // The existing selection button has no accessible name; the other two card
  // buttons are the individually titled Rotate and Delete controls.
  fireEvent.click(within(pageCard(originalPage)).getAllByRole('button')[0], { ctrlKey: multi })
}

function deletePage(originalPage: number) {
  fireEvent.click(within(pageCard(originalPage)).getByTitle('Delete page'))
}

function expectRotation(originalPage: number, degrees: number) {
  expect(screen.getByRole('img', { name: `Page ${originalPage}` }))
    .toHaveStyle({ transform: `rotate(${degrees}deg)` })
}

describe('Page Organizer selection after deleting a single page', () => {
  it('rotates the selected page when no page has been deleted', async () => {
    await openOrganizer()
    selectPage(2)
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectRotation(1, 0)
    expectRotation(2, 90)
    expectRotation(3, 0)
  })

  it('keeps the middle page selected instead of rotating its neighbor after a preceding deletion', async () => {
    await openOrganizer()
    selectPage(2)
    deletePage(1)
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectRotation(3, 0)
    expectRotation(2, 90)
  })

  it('keeps the last page selected for keyboard rotation after a preceding deletion', async () => {
    await openOrganizer()
    selectPage(3)
    deletePage(1)
    fireEvent.keyDown(window, { key: 'r' })
    expectRotation(2, 0)
    expectRotation(3, 90)
  })

  it('deletes the selected last page after a preceding single-page deletion', async () => {
    await openOrganizer()
    selectPage(3)
    deletePage(1)
    fireEvent.keyDown(window, { key: 'd' })
    expect(screen.getByRole('img', { name: 'Page 2' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Page 3' })).not.toBeInTheDocument()
  })

  it('removes the deleted page from a multi-selection but keeps the remaining selected page', async () => {
    await openOrganizer()
    selectPage(1)
    selectPage(3, true)
    deletePage(1)
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectRotation(2, 0)
    expectRotation(3, 90)
  })

  it('does not shift selection when deleting a later page', async () => {
    await openOrganizer()
    selectPage(1)
    deletePage(3)
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    expectRotation(1, 90)
    expectRotation(2, 0)
  })

  it('clears selection when the only selected page is deleted', async () => {
    await openOrganizer()
    selectPage(2)
    deletePage(2)
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'r' })
    expectRotation(1, 0)
    expectRotation(3, 0)
  })
})
