import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Check } from 'lucide-react'
import type { AnnotationTool, DrawStroke, PageAnnotations, TextAnnotation } from './annotation/useAnnotations'
import AnnotationCanvas from './annotation/AnnotationCanvas'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export interface AnnotationHandlers {
  tool: AnnotationTool
  color: string
  strokeWidth: number
  getPageAnnotations: (n: number) => PageAnnotations
  onStrokeComplete: (page: number, stroke: DrawStroke) => void
  onErase: (page: number, x: number, y: number, radius: number) => void
  onTextAdd: (page: number, text: TextAnnotation) => void
  onTextUpdate: (page: number, id: string, updates: Partial<TextAnnotation>) => void
  onTextDelete: (page: number, id: string) => void
}

interface PdfViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  scale: number
  onPageChange: (n: number) => void
  selectionMode?: boolean
  selectedPages?: Set<number>
  onPageClick?: (n: number) => void
  annotationHandlers?: AnnotationHandlers
}

export function PdfViewer({
  pdfDoc,
  scale,
  onPageChange,
  selectionMode = false,
  selectedPages,
  onPageClick,
  annotationHandlers,
}: PdfViewerProps) {
  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)

  return (
    <div className="py-10 px-4 flex flex-col items-center">
      {pages.map((n) => (
        <PdfPage
          key={`${n}-${scale}`}
          pdfDoc={pdfDoc}
          pageNum={n}
          scale={scale}
          onVisible={onPageChange}
          selectionMode={selectionMode}
          selected={selectedPages?.has(n) ?? false}
          onPageClick={onPageClick}
          annotationHandlers={annotationHandlers}
        />
      ))}
    </div>
  )
}

// ─── Individual page ──────────────────────────────────────────────────────────

interface PdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNum: number
  scale: number
  onVisible: (n: number) => void
  selectionMode: boolean
  selected: boolean
  onPageClick?: (n: number) => void
  annotationHandlers?: AnnotationHandlers
}

function PdfPage({ pdfDoc, pageNum, scale, onVisible, selectionMode, selected, onPageClick, annotationHandlers }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    setRendered(false)
    ;(async () => {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (!cancelled) {
        setRendered(true)
        setDims({ w: Math.floor(viewport.width), h: Math.floor(viewport.height) })
      }
    })()
    return () => { cancelled = true }
  }, [pdfDoc, pageNum, scale])

  const stableOnVisible = useCallback(onVisible, [onVisible])
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) stableOnVisible(pageNum) },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [pageNum, stableOnVisible])

  const ah = annotationHandlers

  return (
    <div id={`page-${pageNum}`} ref={wrapRef} className="mb-5 relative">
      {!rendered && (
        <div className="bg-white/10 animate-pulse rounded" style={{ width: 595, height: 842 }} />
      )}
      <canvas
        ref={canvasRef}
        className={`block rounded shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-opacity duration-200 ${
          rendered ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />
      {rendered && (
        <p className="text-center text-xs text-slate-600 mt-2 select-none">{pageNum}</p>
      )}

      {/* ── Annotation canvas overlay ── */}
      {rendered && dims && ah && (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}>
          <AnnotationCanvas
            pageNum={pageNum}
            canvasWidth={dims.w}
            canvasHeight={dims.h}
            tool={ah.tool}
            color={ah.color}
            strokeWidth={ah.strokeWidth}
            annotations={ah.getPageAnnotations(pageNum)}
            onStrokeComplete={(stroke) => ah.onStrokeComplete(pageNum, stroke)}
            onErase={(x, y, r) => ah.onErase(pageNum, x, y, r)}
            onTextAdd={(text) => ah.onTextAdd(pageNum, text)}
            onTextUpdate={(id, updates) => ah.onTextUpdate(pageNum, id, updates)}
            onTextDelete={(id) => ah.onTextDelete(pageNum, id)}
          />
        </div>
      )}

      {/* ── Selection overlay ── */}
      {rendered && selectionMode && (
        <button
          onClick={() => onPageClick?.(pageNum)}
          className={`
            absolute inset-0 rounded transition-all duration-150 cursor-pointer
            ${selected
              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent bg-purple-500/20'
              : 'bg-transparent hover:bg-white/[0.04] hover:ring-1 hover:ring-white/20'}
          `}
          style={{ bottom: 20 }}
          aria-label={`${selected ? 'Deselect' : 'Select'} page ${pageNum}`}
        >
          {selected && (
            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
              <Check size={13} className="text-white" strokeWidth={2.5} />
            </span>
          )}
        </button>
      )}
    </div>
  )
}
