import type { RedactArea } from './RedactOverlay'

interface Props {
  pageNum: number
  pageWidth: number
  pageHeight: number
  areas: RedactArea[]
}

export default function RedactPreviewOverlay({ pageNum, pageWidth, pageHeight, areas }: Props) {
  const pageAreas = areas.filter(a => a.page === pageNum)

  return (
    <div style={{ position: 'relative', width: pageWidth, height: pageHeight }}>
      {pageAreas.map((area, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: area.x * pageWidth,
            top: area.y * pageHeight,
            width: area.width * pageWidth,
            height: area.height * pageHeight,
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}
