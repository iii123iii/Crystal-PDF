interface Props {
  pageNum: number
  totalPages: number
  pageWidth: number
  pageHeight: number
  position: string
  startNumber: number
  fontSize: number
  format: string
}

// Backend margin = 36pt on a 595×842pt page
const MARGIN_PT   = 36
const PAGE_W_PT   = 595
const PAGE_H_PT   = 842

function formatLabel(format: string, pageNum: number, total: number): string {
  switch (format) {
    case 'number-of-total':       return `${pageNum} of ${total}`
    case 'page-number':           return `Page ${pageNum}`
    case 'page-number-of-total':  return `Page ${pageNum} of ${total}`
    default:                      return String(pageNum)
  }
}

export default function PageNumberOverlay({
  pageNum, totalPages, pageWidth, pageHeight,
  position, startNumber, fontSize, format,
}: Props) {
  const displayNum = startNumber + pageNum - 1
  const label = formatLabel(format, displayNum, startNumber + totalPages - 1)

  // Scale the backend's fixed 36pt margin to CSS pixels
  const marginX = (MARGIN_PT / PAGE_W_PT) * pageWidth
  const marginY = (MARGIN_PT / PAGE_H_PT) * pageHeight
  const scaledFontSize = fontSize * (pageWidth / PAGE_W_PT)

  const posStyle = ((): React.CSSProperties => {
    switch (position) {
      case 'top-left':    return { top: marginY,    left: marginX,    textAlign: 'left' }
      case 'top-center':  return { top: marginY,    left: '50%',      transform: 'translateX(-50%)', textAlign: 'center' }
      case 'top-right':   return { top: marginY,    right: marginX,   textAlign: 'right' }
      case 'bottom-left': return { bottom: marginY, left: marginX,    textAlign: 'left' }
      case 'bottom-right':return { bottom: marginY, right: marginX,   textAlign: 'right' }
      default:            return { bottom: marginY, left: '50%',      transform: 'translateX(-50%)', textAlign: 'center' }
    }
  })()

  return (
    <div style={{ width: pageWidth, height: pageHeight, position: 'relative', pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          ...posStyle,
          fontSize: scaledFontSize,
          fontFamily: 'Helvetica, Arial, sans-serif',
          color: 'rgba(50,50,50,0.8)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          // Dashed border to indicate preview
          padding: '2px 6px',
          border: '1.5px dashed rgba(59, 130, 246, 0.6)',
          borderRadius: 3,
          background: 'rgba(59, 130, 246, 0.07)',
        }}
      >
        {label}
      </div>
    </div>
  )
}
