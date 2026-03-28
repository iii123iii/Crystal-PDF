import { useRef, useState } from 'react'

export interface RedactArea {
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  pageNum: number
  pageWidth: number
  pageHeight: number
  areas: RedactArea[]
  onAddArea: (area: RedactArea) => void
  onRemoveArea: (index: number) => void
}

export default function RedactOverlay({ pageNum, pageWidth, pageHeight, areas, onAddArea, onRemoveArea }: Props) {
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const pageAreas = areas.filter(a => a.page === pageNum)

  function getRelativePos(e: React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / pageWidth,
      y: (e.clientY - rect.top) / pageHeight,
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const pos = getRelativePos(e)
    setDrawing(true)
    setStartPos(pos)
    setCurrentPos(pos)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawing) return
    setCurrentPos(getRelativePos(e))
  }

  function handleMouseUp() {
    if (!drawing || !startPos || !currentPos) {
      setDrawing(false)
      return
    }

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    // Only add if the area is big enough (not an accidental click)
    if (width > 0.01 && height > 0.005) {
      onAddArea({ page: pageNum, x, y, width, height })
    }

    setDrawing(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  // Drawing preview rect
  const previewRect = drawing && startPos && currentPos ? {
    left: Math.min(startPos.x, currentPos.x) * pageWidth,
    top: Math.min(startPos.y, currentPos.y) * pageHeight,
    width: Math.abs(currentPos.x - startPos.x) * pageWidth,
    height: Math.abs(currentPos.y - startPos.y) * pageHeight,
  } : null

  return (
    <div
      ref={containerRef}
      style={{ width: pageWidth, height: pageHeight, cursor: 'crosshair', position: 'relative' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (drawing) handleMouseUp() }}
    >
      {/* Existing redact areas */}
      {pageAreas.map((area) => {
        const globalIdx = areas.indexOf(area)
        return (
          <div
            key={globalIdx}
            style={{
              position: 'absolute',
              left: area.x * pageWidth,
              top: area.y * pageHeight,
              width: area.width * pageWidth,
              height: area.height * pageHeight,
              background: 'rgba(0, 0, 0, 0.75)',
              border: '2px solid #ef4444',
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onRemoveArea(globalIdx)
            }}
            title="Click to remove"
          >
            <span style={{
              color: '#ef4444',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              userSelect: 'none',
              opacity: area.width * pageWidth > 60 ? 1 : 0,
            }}>
              REDACTED
            </span>
          </div>
        )
      })}

      {/* Drawing preview */}
      {previewRect && (
        <div
          style={{
            position: 'absolute',
            left: previewRect.left,
            top: previewRect.top,
            width: previewRect.width,
            height: previewRect.height,
            background: 'rgba(239, 68, 68, 0.25)',
            border: '2px dashed #ef4444',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
