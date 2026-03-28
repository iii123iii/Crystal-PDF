import { useRef } from 'react'

interface Props {
  pageWidth: number
  pageHeight: number
  top: number
  right: number
  bottom: number
  left: number
  onTopChange: (v: number) => void
  onRightChange: (v: number) => void
  onBottomChange: (v: number) => void
  onLeftChange: (v: number) => void
}

// Convert PDF points to pixels (page is rendered at some scale)
// We use normalized fractions of the page for display
// 1 PDF point = ~1.333 px at 96dpi, but we work in pixels directly

export default function CropOverlay({
  pageWidth, pageHeight,
  top, right, bottom, left,
  onTopChange, onRightChange, onBottomChange, onLeftChange,
}: Props) {
  // PDF pages are typically 595×842 pt (A4). We map points to pixels proportionally.
  const ptToPixX = pageWidth / 595
  const ptToPixY = pageHeight / 842

  const topPx    = top    * ptToPixY
  const rightPx  = right  * ptToPixX
  const bottomPx = bottom * ptToPixY
  const leftPx   = left   * ptToPixX

  const dragging = useRef<'top' | 'right' | 'bottom' | 'left' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function startDrag(edge: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = edge

    function onMove(ev: MouseEvent) {
      const rect = containerRef.current!.getBoundingClientRect()
      if (edge === 'top') {
        const px = Math.max(0, Math.min(ev.clientY - rect.top, pageHeight - bottomPx - 20))
        onTopChange(Math.round(px / ptToPixY))
      } else if (edge === 'bottom') {
        const px = Math.max(0, Math.min(rect.bottom - ev.clientY, pageHeight - topPx - 20))
        onBottomChange(Math.round(px / ptToPixY))
      } else if (edge === 'left') {
        const px = Math.max(0, Math.min(ev.clientX - rect.left, pageWidth - rightPx - 20))
        onLeftChange(Math.round(px / ptToPixX))
      } else if (edge === 'right') {
        const px = Math.max(0, Math.min(rect.right - ev.clientX, pageWidth - leftPx - 20))
        onRightChange(Math.round(px / ptToPixX))
      }
    }

    function onUp() {
      dragging.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    background: '#3b82f6',
    borderRadius: 2,
  }

  // The kept area (inside crop margins)
  const keptStyle: React.CSSProperties = {
    position: 'absolute',
    top: topPx,
    left: leftPx,
    right: rightPx,
    bottom: bottomPx,
    border: '2px solid #3b82f6',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
    pointerEvents: 'none',
    zIndex: 1,
  }

  return (
    <div
      ref={containerRef}
      style={{ width: pageWidth, height: pageHeight, position: 'relative', overflow: 'hidden' }}
    >
      {/* Dimming overlay with hole */}
      <div style={keptStyle} />

      {/* Corner label */}
      <div style={{
        position: 'absolute',
        top: topPx + 6,
        left: leftPx + 6,
        fontSize: 10,
        fontWeight: 700,
        color: '#3b82f6',
        letterSpacing: '0.08em',
        userSelect: 'none',
        zIndex: 3,
        pointerEvents: 'none',
        background: 'rgba(0,0,0,0.5)',
        padding: '2px 5px',
        borderRadius: 3,
      }}>
        CROP AREA
      </div>

      {/* TOP handle */}
      <div
        style={{ ...handleStyle, top: topPx - 3, left: leftPx, right: rightPx, height: 6, cursor: 'ns-resize', zIndex: 4 }}
        onMouseDown={(e) => startDrag('top', e)}
      />

      {/* BOTTOM handle */}
      <div
        style={{ ...handleStyle, bottom: bottomPx - 3, left: leftPx, right: rightPx, height: 6, cursor: 'ns-resize', zIndex: 4 }}
        onMouseDown={(e) => startDrag('bottom', e)}
      />

      {/* LEFT handle */}
      <div
        style={{ ...handleStyle, left: leftPx - 3, top: topPx, bottom: bottomPx, width: 6, cursor: 'ew-resize', zIndex: 4 }}
        onMouseDown={(e) => startDrag('left', e)}
      />

      {/* RIGHT handle */}
      <div
        style={{ ...handleStyle, right: rightPx - 3, top: topPx, bottom: bottomPx, width: 6, cursor: 'ew-resize', zIndex: 4 }}
        onMouseDown={(e) => startDrag('right', e)}
      />

      {/* Corner squares */}
      {[
        { top: topPx - 5, left: leftPx - 5 },
        { top: topPx - 5, right: rightPx - 5 },
        { bottom: bottomPx - 5, left: leftPx - 5 },
        { bottom: bottomPx - 5, right: rightPx - 5 },
      ].map((pos, i) => (
        <div key={i} style={{
          ...handleStyle,
          ...pos,
          width: 10,
          height: 10,
          borderRadius: 2,
          zIndex: 5,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  )
}
