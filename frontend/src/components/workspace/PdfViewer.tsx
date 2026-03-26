import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Check } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface PdfViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  scale: number
  onPageChange: (n: number) => void
  selectionMode?: boolean
  selectedPages?: Set<number>
  onPageClick?: (n: number) => void
}

export function PdfViewer({
  pdfDoc,
  scale,
  onPageChange,
  selectionMode = false,
  selectedPages,
  onPageClick,
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
}

function PdfPage({ pdfDoc, pageNum, scale, onVisible, selectionMode, selected, onPageClick }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

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
      if (!cancelled) setRendered(true)
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
