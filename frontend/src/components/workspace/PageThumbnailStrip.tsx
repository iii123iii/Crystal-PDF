import { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

interface PageThumbnailStripProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  open: boolean
  currentPage: number
  selectedPages?: Set<number>
  onPageClick: (n: number) => void
  onToggle: () => void
}

const THUMB_SCALE = 0.22
const SKELETON_W = Math.round(595 * THUMB_SCALE)  // ~131px
const SKELETON_H = Math.round(842 * THUMB_SCALE)  // ~185px

export default function PageThumbnailStrip({
  pdfDoc,
  open,
  currentPage,
  selectedPages,
  onPageClick,
  onToggle,
}: PageThumbnailStripProps) {
  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)

  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: open ? 172 : 0 }}
    >
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: 172,
          background: '#060a12',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 h-10 flex items-center justify-between px-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Pages
          </span>
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.background = 'transparent'
            }}
            title="Close pages panel"
          >
            <ChevronLeft size={13} />
          </button>
        </div>

        {/* Scrollable thumbnails */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {pages.map((n) => (
            <Thumbnail
              key={n}
              pdfDoc={pdfDoc}
              pageNum={n}
              isCurrent={currentPage === n}
              isSelected={selectedPages?.has(n) ?? false}
              onPageClick={onPageClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Single thumbnail ─────────────────────────────────────────────────────────

interface ThumbnailProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNum: number
  isCurrent: boolean
  isSelected: boolean
  onPageClick: (n: number) => void
}

function Thumbnail({ pdfDoc, pageNum, isCurrent, isSelected, onPageClick }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLButtonElement>(null)
  const [rendered, setRendered]       = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Lazy render
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShouldRender(true) },
      { threshold: 0.05 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldRender) return
    let cancelled = false
    ;(async () => {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: THUMB_SCALE })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width  = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (!cancelled) setRendered(true)
    })()
    return () => { cancelled = true }
  }, [pdfDoc, pageNum, shouldRender])

  // Scroll current into view
  useEffect(() => {
    if (isCurrent && wrapRef.current) {
      wrapRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isCurrent])

  function handleClick() {
    onPageClick(pageNum)
    document.getElementById(`page-${pageNum}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <button
      ref={wrapRef}
      onClick={handleClick}
      className="group w-full flex flex-col items-center px-3 py-2.5 gap-2 transition-all duration-150"
      style={{
        background: isCurrent ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isCurrent ? '3px solid var(--color-accent)' : '3px solid transparent',
      }}
      title={`Page ${pageNum}`}
      aria-label={`Go to page ${pageNum}`}
      aria-current={isCurrent ? 'true' : undefined}
    >
      {/* Canvas wrapper */}
      <div
        className="relative rounded overflow-hidden transition-all duration-150"
        style={{
          width: SKELETON_W,
          height: rendered ? undefined : SKELETON_H,
          boxShadow: isCurrent
            ? '0 2px 12px rgba(0,0,0,0.6)'
            : '0 1px 6px rgba(0,0,0,0.5)',
          outline: isSelected && !isCurrent ? '1.5px solid rgba(167,139,250,0.55)' : undefined,
        }}
      >
        {!rendered && (
          <div
            className="absolute inset-0 bg-white/[0.07] animate-pulse"
            style={{ width: SKELETON_W, height: SKELETON_H }}
          />
        )}
        <canvas
          ref={canvasRef}
          className={`block transition-opacity duration-200 ${rendered ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: SKELETON_W }}
        />
        {rendered && isSelected && (
          <div className="absolute inset-0" style={{ background: 'rgba(167,139,250,0.22)' }} />
        )}
        {rendered && !isCurrent && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.04)' }} />
        )}
      </div>

      {/* Page number */}
      <span
        className="text-[11px] tabular-nums font-mono leading-none select-none transition-colors"
        style={{ color: isCurrent ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }}
      >
        {pageNum}
      </span>
    </button>
  )
}
