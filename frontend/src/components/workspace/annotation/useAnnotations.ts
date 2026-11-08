import { useCallback, useState } from 'react'

export type AnnotationTool = 'pen' | 'highlight' | 'text' | 'eraser'

export interface DrawStroke {
  type: 'pen' | 'highlight'
  color: string
  width: number        // CSS pixels (absolute, not normalized)
  opacity: number
  points: Array<[number, number]>  // normalized [0,1] relative to page dims
}

export interface TextAnnotation {
  id: string
  x: number     // normalized [0,1]
  y: number
  width: number // normalized [0,1]
  fontSize: number
  color: string
  text: string
}

export interface PageAnnotations {
  strokes: DrawStroke[]
  texts: TextAnnotation[]
}

const EMPTY: PageAnnotations = { strokes: [], texts: [] }

export function useAnnotations() {
  const [pages, setPages] = useState<Record<number, PageAnnotations>>({})

  const getPage = useCallback((page: number): PageAnnotations => {
    return pages[page] ?? EMPTY
  }, [pages])

  const addStroke = useCallback((page: number, stroke: DrawStroke) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      return { ...prev, [page]: { ...cur, strokes: [...cur.strokes, stroke] } }
    })
  }, [])

  const addText = useCallback((page: number, text: TextAnnotation) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      return { ...prev, [page]: { ...cur, texts: [...cur.texts, text] } }
    })
  }, [])

  const updateText = useCallback((page: number, id: string, updates: Partial<TextAnnotation>) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      return {
        ...prev,
        [page]: { ...cur, texts: cur.texts.map(t => t.id === id ? { ...t, ...updates } : t) }
      }
    })
  }, [])

  const deleteText = useCallback((page: number, id: string) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      return { ...prev, [page]: { ...cur, texts: cur.texts.filter(t => t.id !== id) } }
    })
  }, [])

  /**
   * Erase any stroke whose path comes within `radius` (normalized) of (x, y).
   * This removes the entire stroke — "stroke eraser" mode.
   */
  const eraseAt = useCallback((page: number, x: number, y: number, radius: number) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      const remaining = cur.strokes.filter(stroke =>
        !stroke.points.some(([px, py], i) => {
          if (Math.hypot(px - x, py - y) < radius) return true
          if (i === 0) return false

          // The canvas joins sampled points with straight line segments.
          const [ax, ay] = stroke.points[i - 1]
          const dx = px - ax
          const dy = py - ay
          const lengthSquared = dx * dx + dy * dy
          if (lengthSquared === 0) return false
          const t = Math.max(0, Math.min(1,
            ((x - ax) * dx + (y - ay) * dy) / lengthSquared,
          ))
          return Math.hypot(ax + t * dx - x, ay + t * dy - y) < radius
        })
      )
      if (remaining.length === cur.strokes.length) return prev
      return { ...prev, [page]: { ...cur, strokes: remaining } }
    })
  }, [])

  const undo = useCallback((page: number) => {
    setPages(prev => {
      const cur = prev[page] ?? EMPTY
      if (cur.strokes.length === 0) return prev
      return { ...prev, [page]: { ...cur, strokes: cur.strokes.slice(0, -1) } }
    })
  }, [])

  const clearPage = useCallback((page: number) => {
    setPages(prev => ({ ...prev, [page]: EMPTY }))
  }, [])

  const clearAllPages = useCallback(() => {
    setPages({})
  }, [])

  return { pages, getPage, addStroke, addText, updateText, deleteText, eraseAt, undo, clearPage, clearAllPages }
}
