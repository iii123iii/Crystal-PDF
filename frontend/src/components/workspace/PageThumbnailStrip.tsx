import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

interface PageThumbnailStripProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  open: boolean
  currentPage: number
  selectedPages?: Set<number>
  onPageClick: (n: number) => void
}

const THUMB_SCALE = 0.16
// A4 proportions at THUMB_SCALE, used for the loading skeleton
const SKELETON_W = Math.round(595 * THUMB_SCALE)  // ≈ 95px
const SKELETON_H = Math.round(842 * THUMB_SCALE)  // ≈ 135px

export default function PageThumbnailStrip({
  pdfDoc,
  open,
  currentPage,
  selectedPages,
  onPageClick,
}: PageThumbnailStripProps) {
  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)

  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: open ? 128 : 0 }}
    >
      {/* Inner strip — fixed width so content doesn't squish during transition */}
      <div
        className="w-32 h-full flex flex-col border-l overflow-hidden"
        style={{
          background: '#080f1c',
          borderColor: 'rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 h-9 flex items-center justify-between px-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <span
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Pages
          </span>
          <span
            className="text-[10px] tabular-nums"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            {pdfDoc.numPages}
          </span>
        </div>

        {/* Scrollable thumbnail list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {pages.map((n) => (
            <Thumbnail
              key={n}
              pdfDoc={pdfDoc}
              pageNum={n}
              isCurrent={currentPage === n}
              isSelected={selectedPages?.has(n) ?? false}
              skeletonW={SKELETON_W}
              skeletonH={SKELETON_H}
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
  skeletonW: number
  skeletonH: number
  onPageClick: (n: number) => void
}

function Thumbnail({
  pdfDoc,
  pageNum,
  isCurrent,
  isSelected,
  skeletonW,
  skeletonH,
  onPageClick,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLButtonElement>(null)
  const [rendered, setRendered] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Lazy render — only start when the thumbnail scrolls into view in the strip
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
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (!cancelled) setRendered(true)
    })()
    return () => { cancelled = true }
  }, [pdfDoc, pageNum, shouldRender])

  // Keep current page in view within the strip — scroll to it automatically
  useEffect(() => {
    if (isCurrent && wrapRef.current) {
      wrapRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isCurrent])

  function handleClick() {
    onPageClick(pageNum)
    // Scroll main viewer to this page
    document.getElementById(`page-${pageNum}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <button
      ref={wrapRef}
      onClick={handleClick}
      className="group w-full flex flex-col items-center px-2 py-2 gap-1.5 transition-all duration-150"
      style={{
        background: isCurrent ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      title={`Page ${pageNum}`}
      aria-label={`Go to page ${pageNum}`}
      aria-current={isCurrent ? 'true' : undefined}
    >
      {/* Canvas wrapper */}
      <div
        className="relative rounded overflow-hidden transition-all duration-150"
        style={{
          width: skeletonW,
          height: rendered ? undefined : skeletonH,
          boxShadow: isCurrent
            ? '0 0 0 1.5px rgba(147,197,253,0.65), 0 2px 12px rgba(0,0,0,0.6)'
            : '0 1px 6px rgba(0,0,0,0.5)',
          outline: isSelected && !isCurrent ? '1.5px solid rgba(167,139,250,0.55)' : undefined,
        }}
      >
        {/* Skeleton */}
        {!rendered && (
          <div
            className="absolute inset-0 bg-white/[0.07] animate-pulse"
            style={{ width: skeletonW, height: skeletonH }}
          />
        )}

        {/* Rendered canvas */}
        <canvas
          ref={canvasRef}
          className={`block transition-opacity duration-200 ${rendered ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: skeletonW }}
        />

        {/* Split-selection tint */}
        {rendered && isSelected && (
          <div className="absolute inset-0" style={{ background: 'rgba(167,139,250,0.22)' }} />
        )}

        {/* Hover scrim */}
        {rendered && !isCurrent && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.04)' }} />
        )}
      </div>

      {/* Page number */}
      <span
        className="text-[10px] tabular-nums leading-none select-none transition-colors"
        style={{ color: isCurrent ? '#93c5fd' : '#374151' }}
      >
        {pageNum}
      </span>
    </button>
  )
}
