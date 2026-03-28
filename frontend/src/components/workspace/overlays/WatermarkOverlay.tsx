interface Props {
  pageWidth: number
  pageHeight: number
  text: string
  fontSize: number
  opacity: number
  rotation: number
  position: string
}

// Backend uses 50pt fixed margin on a standard page (595×842pt).
// Convert to CSS pixels relative to actual rendered page size.
const BACKEND_MARGIN_X_PT = 50
const BACKEND_MARGIN_Y_PT = 50
const BACKEND_PAGE_W_PT   = 595
const BACKEND_PAGE_H_PT   = 842

export default function WatermarkOverlay({ pageWidth, pageHeight, text, fontSize, opacity, rotation, position }: Props) {
  if (!text.trim()) return null

  // Scale font size exactly as the backend does (backend uses fontSize in PDF points)
  const scaledFontSize = fontSize * (pageWidth / BACKEND_PAGE_W_PT)

  // Margins in CSS pixels — match the 50pt backend constant
  const mX = (BACKEND_MARGIN_X_PT / BACKEND_PAGE_W_PT) * pageWidth
  const mY = (BACKEND_MARGIN_Y_PT / BACKEND_PAGE_H_PT) * pageHeight

  // Each corner position mirrors the backend anchor point and rotation origin.
  // Backend rotates text around (cx, cy) which is the text-start anchor.
  // We set transform-origin to match that anchor on the CSS element.
  const positionStyle = ((): React.CSSProperties => {
    switch (position) {
      case 'top-left':
        return {
          left: mX,
          top: mY,
          transformOrigin: 'left top',
          transform: `rotate(${-rotation}deg)`,
        }
      case 'top-right':
        return {
          right: mX,
          top: mY,
          transformOrigin: 'right top',
          transform: `rotate(${-rotation}deg)`,
        }
      case 'bottom-left':
        return {
          left: mX,
          bottom: mY,
          transformOrigin: 'left bottom',
          transform: `rotate(${-rotation}deg)`,
        }
      case 'bottom-right':
        return {
          right: mX,
          bottom: mY,
          transformOrigin: 'right bottom',
          transform: `rotate(${-rotation}deg)`,
        }
      case 'center':
      default:
        // Backend: cx = (W - textWidth)/2, cy = H/2 — centers horizontally and vertically
        return {
          left: '50%',
          top: '50%',
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
        }
    }
  })()

  return (
    <div style={{ width: pageWidth, height: pageHeight, position: 'relative', pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          ...positionStyle,
          color: '#888',
          fontSize: scaledFontSize,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 700,
          opacity,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          // Dashed border to indicate preview
          padding: '3px 8px',
          border: '1.5px dashed rgba(59, 130, 246, 0.6)',
          borderRadius: 3,
          background: 'rgba(59, 130, 246, 0.05)',
        }}
      >
        {text}
      </div>
    </div>
  )
}
