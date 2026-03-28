interface Props {
  pageWidth: number
  pageHeight: number
  text: string
  fontSize: number
  opacity: number
  rotation: number
  position: string
}

export default function WatermarkOverlay({ pageWidth, pageHeight, text, fontSize, opacity, rotation, position }: Props) {
  if (!text.trim()) return null

  // Scale font size relative to page
  const scaledFontSize = fontSize * (pageWidth / 595) // 595 is standard A4 width in points

  const positionStyles: React.CSSProperties = (() => {
    switch (position) {
      case 'top-left':
        return { top: '10%', left: '10%', transform: `rotate(${rotation}deg)` }
      case 'top-right':
        return { top: '10%', right: '10%', transform: `rotate(${rotation}deg)` }
      case 'bottom-left':
        return { bottom: '10%', left: '10%', transform: `rotate(${rotation}deg)` }
      case 'bottom-right':
        return { bottom: '10%', right: '10%', transform: `rotate(${rotation}deg)` }
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }
    }
  })()

  return (
    <div style={{ width: pageWidth, height: pageHeight, position: 'relative', pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          ...positionStyles,
          color: '#888',
          fontSize: scaledFontSize,
          fontWeight: 700,
          opacity,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          // Dashed border to show it's a preview
          padding: '4px 12px',
          border: '2px dashed rgba(59, 130, 246, 0.5)',
          borderRadius: 4,
          background: 'rgba(59, 130, 246, 0.05)',
        }}
      >
        {text}
      </div>
    </div>
  )
}
