import React, { useState, useEffect, useRef } from 'react'
import { X, RotateCw, Trash2, Check, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { apiFetch } from '../../lib/api'
import { useToastStore } from '../../store/useToastStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface VisualOrganizerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null
  documentId: string
  pdfPassword?: string | null
  onClose: () => void
  /** Called after a successful save so the workspace can reload */
  onSaved: (newDoc: { id: number; originalName: string }) => void
}

interface PageState {
  /** Original 1-based page number in the source PDF */
  originalPage: number
  rotation: number
  thumbnail: string | null
}

export function VisualOrganizer({ pdfDoc, documentId, pdfPassword, onClose, onSaved }: VisualOrganizerProps) {
  const [pages, setPages]               = useState<PageState[]>([])
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set())
  const [draggedPos, setDraggedPos]     = useState<number | null>(null)
  const [dropTargetPos, setDropTargetPos] = useState<number | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [isExporting, setIsExporting]   = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  // Touch drag refs (avoid re-renders during drag)
  const touchDragPosRef    = useRef<number | null>(null)
  const touchDropTargetRef = useRef<number | null>(null)
  const gridRef            = useRef<HTMLDivElement>(null)

  // ── Load thumbnails ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc) return
    setIsLoading(true)
    const load = async () => {
      const result: PageState[] = []
      for (let i = 1; i <= Math.min(pdfDoc.numPages, 200); i++) {
        try {
          const page     = await pdfDoc.getPage(i)
          const viewport = page.getViewport({ scale: 0.15 })
          const canvas   = document.createElement('canvas')
          canvas.width   = viewport.width
          canvas.height  = viewport.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise
            result.push({ originalPage: i, rotation: 0, thumbnail: canvas.toDataURL('image/png') })
          }
        } catch {
          result.push({ originalPage: i, rotation: 0, thumbnail: null })
        }
      }
      setPages(result)
      setIsLoading(false)
    }
    load()
  }, [pdfDoc])

  // ── Non-passive touchmove for drag-and-drop scroll prevention ─────────────
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const onTouchMove = (e: TouchEvent) => {
      if (touchDragPosRef.current === null) return
      e.preventDefault()
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const card = el?.closest('[data-pos]')
      if (card) {
        const idx = parseInt((card as HTMLElement).getAttribute('data-pos') ?? '-1')
        if (idx >= 0 && idx !== touchDragPosRef.current) {
          touchDropTargetRef.current = idx
          setDropTargetPos(idx)
        }
      }
    }
    grid.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => grid.removeEventListener('touchmove', onTouchMove)
  }, [isLoading])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedIdxs(new Set()); return }
      if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSelectedIdxs(new Set(pages.map((_, i) => i)))
        return
      }
      if (e.key === 'd' && selectedIdxs.size > 0) {
        e.preventDefault()
        deleteSelected()
      }
      if (e.key === 'r' && selectedIdxs.size > 0) {
        e.preventDefault()
        rotateSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages, selectedIdxs])

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSelect(pos: number, multi: boolean) {
    setSelectedIdxs((prev) => {
      const next = new Set(prev)
      if (multi) {
        if (next.has(pos)) next.delete(pos)
        else next.add(pos)
      } else {
        next.clear()
        next.add(pos)
      }
      return next
    })
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  function deleteSelected() {
    setPages((prev) => prev.filter((_, i) => !selectedIdxs.has(i)))
    setSelectedIdxs(new Set())
    addToast('success', `${selectedIdxs.size} page${selectedIdxs.size > 1 ? 's' : ''} removed`)
  }

  function deleteSingle(pos: number) {
    setPages((prev) => prev.filter((_, i) => i !== pos))
    setSelectedIdxs((prev) => {
      const next = new Set(prev)
      next.delete(pos)
      return next
    })
  }

  function rotateSelected() {
    setPages((prev) =>
      prev.map((p, i) => selectedIdxs.has(i) ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
    )
  }

  function rotateSingle(pos: number) {
    setPages((prev) =>
      prev.map((p, i) => i === pos ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
    )
  }

  // ── Mouse drag & drop ─────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, pos: number) {
    setDraggedPos(pos)
    setDropTargetPos(null)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, pos: number) {
    e.preventDefault()
    if (draggedPos !== null && pos !== draggedPos) {
      setDropTargetPos(pos)
    }
  }

  function handleDragLeave() {
    setDropTargetPos(null)
  }

  function handleDrop(e: React.DragEvent, targetPos: number) {
    e.preventDefault()
    if (draggedPos === null || draggedPos === targetPos) { setDraggedPos(null); setDropTargetPos(null); return }
    setPages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(draggedPos, 1)
      next.splice(targetPos, 0, moved)
      return next
    })
    setDraggedPos(null)
    setDropTargetPos(null)
  }

  function handleDragEnd() {
    setDraggedPos(null)
    setDropTargetPos(null)
  }

  // ── Touch drag & drop ─────────────────────────────────────────────────────
  function handleTouchStart(pos: number) {
    touchDragPosRef.current = pos
    touchDropTargetRef.current = null
    setDraggedPos(pos)
    setDropTargetPos(null)
  }

  function handleTouchEnd() {
    const from = touchDragPosRef.current
    const to   = touchDropTargetRef.current
    if (from !== null && to !== null && from !== to) {
      setPages((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
    touchDragPosRef.current    = null
    touchDropTargetRef.current = null
    setDraggedPos(null)
    setDropTargetPos(null)
  }

  // ── Export (overwrite original) ───────────────────────────────────────────
  async function handleExport() {
    if (pages.length === 0) { addToast('error', 'At least one page must remain.'); return }
    setIsExporting(true)
    try {
      const pageOrder = pages.map((p) => p.originalPage)
      const reorderRes = await apiFetch(`/api/documents/${documentId}/tools/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageOrder, sourcePassword: pdfPassword ?? null }),
      })
      if (!reorderRes.ok) {
        const msg = await reorderRes.text().catch(() => 'Unknown error')
        addToast('error', `Save failed: ${msg}`)
        return
      }
      let resultDoc = await reorderRes.json() as { id: number; originalName: string }

      // Apply rotations grouped by angle
      const rotGroups = new Map<number, number[]>()
      pages.forEach((p, i) => {
        if (p.rotation !== 0) {
          const newPageNum = i + 1
          rotGroups.set(p.rotation, [...(rotGroups.get(p.rotation) ?? []), newPageNum])
        }
      })
      for (const [rotation, pageNums] of rotGroups) {
        const rotRes = await apiFetch(`/api/documents/${resultDoc.id}/tools/rotate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: pageNums, rotation }),
        })
        if (!rotRes.ok) { addToast('error', 'Save failed during rotation step.'); return }
        resultDoc = await rotRes.json() as { id: number; originalName: string }
      }

      // Overwrite the original document with the result
      const overwriteRes = await apiFetch(
        `/api/documents/${documentId}/tools/overwrite-with/${resultDoc.id}`,
        { method: 'POST' }
      )
      if (!overwriteRes.ok) { addToast('error', 'Failed to save changes.'); return }

      addToast('success', 'Document saved.')
      onSaved(resultDoc)
    } catch {
      addToast('error', 'Save failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-3 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <h2 className="text-sm font-semibold shrink-0" style={{ color: 'var(--color-text)' }}>
            Page Organizer
          </h2>
          <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
            {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>
          {/* Keyboard shortcuts — desktop only */}
          <div className="hidden lg:flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted-2)' }}>
            <span><kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}>r</kbd> rotate</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}>d</kbd> delete</span>
            <span><kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}>⌘A</kbd> select all</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedIdxs.size > 0 && (
            <>
              <span className="hidden sm:inline text-xs" style={{ color: 'var(--color-muted)' }}>
                {selectedIdxs.size} selected
              </span>
              <button
                onClick={rotateSelected}
                className="flex items-center gap-1 sm:gap-1.5 text-xs px-2 sm:px-2.5 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted)', background: 'var(--color-surface-2)' }}
              >
                <RotateCw size={12} />
                <span className="hidden sm:inline">Rotate</span>
              </button>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 sm:gap-1.5 text-xs px-2 sm:px-2.5 py-1.5 rounded-md transition-colors"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.10)' }}
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <div className="w-px h-4" style={{ background: 'var(--color-border)' }} />
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-3" style={{ color: 'var(--color-muted)' }}>
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading pages…</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 sm:p-6" ref={gridRef}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 auto-rows-max">
            {pages.map((page, pos) => {
              const isDropTarget = dropTargetPos === pos && draggedPos !== pos
              return (
                <div
                  key={`${page.originalPage}-${pos}`}
                  data-pos={pos}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pos)}
                  onDragOver={(e) => handleDragOver(e, pos)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, pos)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(pos)}
                  onTouchEnd={handleTouchEnd}
                  className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all"
                  style={{
                    border: selectedIdxs.has(pos)
                      ? '2px solid var(--color-accent)'
                      : isDropTarget
                        ? '2px solid #f59e0b'
                        : '2px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    opacity: draggedPos === pos ? 0.4 : 1,
                    boxShadow: selectedIdxs.has(pos)
                      ? '0 0 0 2px var(--color-accent-muted)'
                      : isDropTarget
                        ? '0 0 0 2px rgba(245,158,11,0.25)'
                        : 'none',
                    transform: isDropTarget ? 'scale(1.03)' : 'none',
                  }}
                >
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.originalPage}`}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 150ms ease',
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {page.originalPage}
                      </span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                  {/* Page number */}
                  <div
                    className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                  >
                    {pos + 1}
                  </div>

                  {/* Rotation badge */}
                  {page.rotation !== 0 && (
                    <div
                      className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                      style={{ background: 'rgba(245,158,11,0.85)', color: '#fff' }}
                    >
                      <RotateCw size={9} />
                      {page.rotation}°
                    </div>
                  )}

                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(pos, e.ctrlKey || e.metaKey || e.shiftKey) }}
                    className="absolute bottom-1.5 left-1.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: selectedIdxs.has(pos) ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
                      background: selectedIdxs.has(pos) ? 'var(--color-accent)' : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    {selectedIdxs.has(pos) && <Check size={10} color="#fff" strokeWidth={3} />}
                  </button>

                  {/* Hover controls — always visible on touch devices, hover on desktop */}
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); rotateSingle(pos) }}
                      className="p-1 rounded transition-colors"
                      style={{ background: 'rgba(59,130,246,0.85)', color: '#fff' }}
                      title="Rotate 90°"
                    >
                      <RotateCw size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSingle(pos) }}
                      className="p-1 rounded transition-colors"
                      style={{ background: 'rgba(239,68,68,0.85)', color: '#fff' }}
                      title="Delete page"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="shrink-0 flex items-center justify-end gap-2 px-3 sm:px-5 py-3 border-t"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ color: 'var(--color-muted)', background: 'var(--color-surface-2)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting || pages.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          {isExporting
            ? <><Loader2 size={14} className="animate-spin" />Saving…</>
            : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
