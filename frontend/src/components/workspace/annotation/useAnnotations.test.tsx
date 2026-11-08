import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnnotationCanvas from './AnnotationCanvas'
import { useAnnotations } from './useAnnotations'
import type { AnnotationTool, DrawStroke, TextAnnotation } from './useAnnotations'

function stroke(points: DrawStroke['points'], type: DrawStroke['type'] = 'pen'): DrawStroke {
  return { type, color: '#000000', width: type === 'pen' ? 4 : 22, opacity: 1, points }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('stroke eraser', () => {
  // Each cursor is on a visible segment, farther than the radius from its vertices.
  it.each<{
    name: string; points: DrawStroke['points']; cursor: [number, number]
  }>([
    { name: 'horizontal', points: [[0.1, 0.5], [0.9, 0.5]], cursor: [0.5, 0.5] },
    { name: 'vertical', points: [[0.5, 0.1], [0.5, 0.9]], cursor: [0.5, 0.5] },
    { name: 'diagonal', points: [[0.1, 0.1], [0.9, 0.9]], cursor: [0.5, 0.5] },
    { name: 'later segment', points: [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9]], cursor: [0.9, 0.5] },
    { name: 'reversed', points: [[0.9, 0.5], [0.1, 0.5]], cursor: [0.5, 0.5] },
  ])('erases the whole $name stroke between sampled points', ({ points, cursor }) => {
    const { result } = renderHook(useAnnotations, { wrapper: StrictMode })
    act(() => result.current.addStroke(1, stroke(points)))
    act(() => result.current.eraseAt(1, ...cursor, 0.035))
    expect(result.current.getPage(1).strokes).toEqual([])
  })

  it.each<{
    name: string; cursor: [number, number]; erased: boolean
  }>([
    { name: 'near the segment', cursor: [0.5, 0.51], erased: true },
    { name: 'outside the radius', cursor: [0.5, 0.55], erased: false },
    { name: 'at the first endpoint', cursor: [0.25, 0.5], erased: true },
    { name: 'at the last endpoint', cursor: [0.75, 0.5], erased: true },
    { name: 'before the segment', cursor: [0.1, 0.5], erased: false },
    { name: 'after the segment', cursor: [0.9, 0.5], erased: false },
  ])('handles a cursor $name', ({ cursor, erased }) => {
    const { result } = renderHook(useAnnotations)
    const original = stroke([[0.25, 0.5], [0.75, 0.5]])
    act(() => result.current.addStroke(1, original))
    act(() => result.current.eraseAt(1, ...cursor, 0.035))
    expect(result.current.getPage(1).strokes).toEqual(erased ? [] : [original])
  })

  it('preserves neighboring strokes, other pages, text and prior state', () => {
    const { result } = renderHook(useAnnotations, { wrapper: StrictMode })
    const target = stroke([[0.1, 0.5], [0.9, 0.5]])
    const neighbor = stroke([[0.1, 0.6], [0.9, 0.6]])
    const text: TextAnnotation = {
      id: 'note', x: 0.5, y: 0.5, width: 0.2, fontSize: 16, color: '#000000', text: 'Keep me',
    }
    act(() => {
      result.current.addStroke(1, target)
      result.current.addStroke(1, neighbor)
      result.current.addStroke(2, target)
      result.current.addText(1, text)
    })
    const before = result.current.pages
    act(() => result.current.eraseAt(1, 0.5, 0.5, 0.035))
    expect(result.current.getPage(1)).toEqual({ strokes: [neighbor], texts: [text] })
    expect(result.current.getPage(2)).toBe(before[2])
    expect(before[1].strokes).toEqual([target, neighbor])
  })

  it('does not erase across the unpainted diagonal of a bent stroke', () => {
    const { result } = renderHook(useAnnotations)
    const bent = stroke([[0.1, 0.1], [0.9, 0.1], [0.9, 0.9]])
    act(() => result.current.addStroke(1, bent))
    act(() => result.current.eraseAt(1, 0.5, 0.5, 0.035))
    expect(result.current.getPage(1).strokes).toEqual([bent])
  })

  it.each<{ points: DrawStroke['points'] }>([
    { points: [[0.5, 0.5]] },
    { points: [[0.5, 0.5], [0.5, 0.5]] },
  ])('keeps point-hit behavior for a degenerate stroke %#', ({ points }) => {
    const { result } = renderHook(useAnnotations)
    const original = stroke(points)
    act(() => result.current.addStroke(1, original))
    act(() => result.current.eraseAt(1, 0.8, 0.5, 0.035))
    expect(result.current.getPage(1).strokes).toEqual([original])
    act(() => result.current.eraseAt(1, 0.5, 0.5, 0.035))
    expect(result.current.getPage(1).strokes).toEqual([])
  })

  it('leaves empty pages and empty strokes unchanged', () => {
    const { result } = renderHook(useAnnotations)
    act(() => result.current.eraseAt(2, 0.5, 0.5, 0.035))
    expect(result.current.pages).toEqual({})
    const empty = stroke([])
    act(() => result.current.addStroke(1, empty))
    const before = result.current.pages
    act(() => result.current.eraseAt(1, 0.5, 0.5, 0.035))
    expect(result.current.pages).toBe(before)
  })
})

function DrawingPage({ tool }: { tool: AnnotationTool }) {
  const annotations = useAnnotations()
  return <>
    <AnnotationCanvas
      pageNum={1} canvasWidth={1000} canvasHeight={500} tool={tool}
      color="#000000" strokeWidth={tool === 'highlight' ? 22 : 4}
      annotations={annotations.getPage(1)}
      onStrokeComplete={s => annotations.addStroke(1, s)}
      onErase={(x, y, radius) => annotations.eraseAt(1, x, y, radius)}
      onTextAdd={t => annotations.addText(1, t)}
      onTextUpdate={(id, updates) => annotations.updateText(1, id, updates)}
      onTextDelete={id => annotations.deleteText(1, id)}
    />
    <output aria-label="Page strokes">{JSON.stringify(annotations.getPage(1).strokes)}</output>
  </>
}

describe('canvas drawing and erasing', () => {
  it.each(['pen', 'highlight'] as const)('erases the middle of a %s drawn with sparse mouse events', (tool) => {
    // jsdom does not rasterize canvas. Keep the actual event handling, normalized
    // coordinates, stroke storage and eraser callbacks; stub only drawing APIs.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 200, width: 1000, height: 500, right: 1100, bottom: 700,
      x: 100, y: 200, toJSON: () => ({}),
    })
    const { container, rerender } = render(<DrawingPage tool={tool} />)
    // The transparent event overlay immediately follows the drawing canvas.
    const overlay = container.querySelector('canvas')!.nextElementSibling!
    fireEvent.mouseDown(overlay, { clientX: 200, clientY: 450, button: 0 })
    fireEvent.mouseMove(overlay, { clientX: 1000, clientY: 450 })
    fireEvent.mouseUp(overlay)
    expect(JSON.parse(screen.getByLabelText('Page strokes').textContent!)).toEqual([{
      type: tool, color: '#000000', width: tool === 'pen' ? 4 : 22,
      opacity: tool === 'highlight' ? 0.38 : 1, points: [[0.1, 0.5], [0.9, 0.5]],
    }])
    rerender(<DrawingPage tool="eraser" />)
    fireEvent.mouseDown(overlay, { clientX: 600, clientY: 450, button: 0 })
    fireEvent.mouseUp(overlay)
    expect(JSON.parse(screen.getByLabelText('Page strokes').textContent!)).toEqual([])
  })
})
