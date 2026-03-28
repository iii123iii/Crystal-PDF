import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { TextLayer } from 'pdfjs-dist'
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
  currentPage: number
  onPageChange: (n: number) => void
  selectionMode?: boolean
  selectedPages?: Set<number>
  onPageClick?: (n: number) => void
  annotationHandlers?: AnnotationHandlers
  pageOverlay?: (pageNum: number, width: number, height: number) => React.ReactNode
}

export function PdfViewer({
  pdfDoc,
  scale,
  currentPage,
  onPageChange,
  selectionMode = false,
  selectedPages,
  onPageClick,
  annotationHandlers,
  pageOverlay,
}: PdfViewerProps) {
  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)

  // Scroll to page when currentPage changes from external source (top-bar input, etc.)
  const programmaticScrollRef = useRef(false)
  const lastReportedPage = useRef(currentPage)

  useEffect(() => {
    if (currentPage === lastReportedPage.current) return
    lastReportedPage.current = currentPage
    const el = document.getElementById(`page-${currentPage}`)
    if (!el) return
    programmaticScrollRef.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Allow observer updates again after scroll settles
    const timer = setTimeout(() => { programmaticScrollRef.current = false }, 600)
    return () => clearTimeout(timer)
  }, [currentPage])

  const handleVisible = useCallback((n: number) => {
    if (programmaticScrollRef.current) return
    lastReportedPage.current = n
    onPageChange(n)
  }, [onPageChange])

  return (
    <div className="py-10 px-4 flex flex-col items-center">
      {pages.map((n) => (
        <PdfPage
          key={n}
          pdfDoc={pdfDoc}
          pageNum={n}
          scale={scale}
          onVisible={handleVisible}
          selectionMode={selectionMode}
          selected={selectedPages?.has(n) ?? false}
          onPageClick={onPageClick}
          annotationHandlers={annotationHandlers}
          pageOverlay={pageOverlay}
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
  pageOverlay?: (pageNum: number, width: number, height: number) => React.ReactNode
}

const VIEWPORT_BUFFER = 1500 // px above/below viewport to pre-render

function PdfPage({ pdfDoc, pageNum, scale, onVisible, selectionMode, selected, onPageClick, annotationHandlers, pageOverlay }: PdfPageProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [nearViewport, setNearViewport] = useState(false)

  // Lazy rendering: only render pages within buffer distance of viewport
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setNearViewport(true) },
      { rootMargin: `${VIEWPORT_BUFFER}px 0px ${VIEWPORT_BUFFER}px 0px` },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Placeholder dimensions (computed without rendering)
  const [placeholderH, setPlaceholderH] = useState(842)
  useEffect(() => {
    let cancelled = false
    pdfDoc.getPage(pageNum).then((page) => {
      if (cancelled) return
      const vp = page.getViewport({ scale })
      setPlaceholderH(Math.floor(vp.height))
    })
    return () => { cancelled = true }
  }, [pdfDoc, pageNum, scale])

  useEffect(() => {
    if (!nearViewport) return
    let cancelled = false
    let textLayerInst: InstanceType<typeof TextLayer> | null = null
    setRendered(false)

    ;(async () => {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return

      canvas.width  = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (cancelled) return

      setRendered(true)
      setDims({ w: Math.floor(viewport.width), h: Math.floor(viewport.height) })

      const textDiv = textLayerRef.current
      if (!textDiv || cancelled) return
      textDiv.replaceChildren()
      textDiv.style.width  = `${Math.floor(viewport.width)}px`
      textDiv.style.height = `${Math.floor(viewport.height)}px`

      try {
        textLayerInst = new TextLayer({
          textContentSource: page.streamTextContent(),
          container: textDiv,
          viewport,
        })
        await textLayerInst.render()
      } catch {
        // Text layer is optional — ignore failures on scanned/image-only PDFs
      }
    })()

    return () => {
      cancelled = true
      textLayerInst?.cancel()
    }
  }, [pdfDoc, pageNum, scale, nearViewport])

  // Track which page is visible for the top-bar page indicator
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
  const textSelectionActive = rendered && !ah && !selectionMode

  return (
    <div
      id={`page-${pageNum}`}
      ref={wrapRef}
      className="mb-5 relative"
      style={!rendered ? { minHeight: placeholderH, width: Math.round(595 * scale) } : undefined}
    >
      {!rendered && (
        <div className="bg-white/10 animate-pulse rounded" style={{ width: Math.round(595 * scale), height: placeholderH }} />
      )}
      <canvas
        ref={canvasRef}
        className={`block rounded shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-opacity duration-200 ${
          rendered ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Text layer — enables native text selection/copy when not in annotation/selection mode */}
      <div
        ref={textLayerRef}
        className="textLayer"
        style={{
          pointerEvents: textSelectionActive ? 'auto' : 'none',
          userSelect:    textSelectionActive ? 'text'  : 'none',
          zIndex: 1,
        }}
      />

      {rendered && (
        <p className="text-center text-xs text-slate-600 mt-2 select-none">{pageNum}</p>
      )}

      {/* ── Annotation canvas overlay ── */}
      {rendered && dims && ah && (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto', zIndex: 2 }}>
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

      {/* ── Tool overlay (redact, crop, watermark preview) ── */}
      {rendered && dims && pageOverlay && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: dims.w, height: dims.h, zIndex: 2, pointerEvents: 'auto' }}>
          {pageOverlay(pageNum, dims.w, dims.h)}
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
          style={{ bottom: 20, zIndex: 3 }}
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
