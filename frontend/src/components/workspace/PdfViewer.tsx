import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface PdfViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  scale: number
  onPageChange: (n: number) => void
}

export function PdfViewer({ pdfDoc, scale, onPageChange }: PdfViewerProps) {
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
}

function PdfPage({ pdfDoc, pageNum, scale, onVisible }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  // Render page onto canvas
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

  // Track which page is the "current" one for the top-bar counter
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
    <div ref={wrapRef} className="mb-5 relative">
      {/* Skeleton shown while rendering */}
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
    </div>
  )
}
