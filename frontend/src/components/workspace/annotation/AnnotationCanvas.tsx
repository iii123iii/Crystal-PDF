import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnnotationTool, DrawStroke, PageAnnotations, TextAnnotation } from './useAnnotations'
import TextAnnotationBox from './TextAnnotationBox'

interface Props {
  pageNum: number
  canvasWidth: number
  canvasHeight: number
  tool: AnnotationTool
  color: string
  strokeWidth: number
  annotations: PageAnnotations
  onStrokeComplete: (stroke: DrawStroke) => void
  onErase: (x: number, y: number, radius: number) => void
  onTextAdd: (text: TextAnnotation) => void
  onTextUpdate: (id: string, updates: Partial<TextAnnotation>) => void
  onTextDelete: (id: string) => void
}

const ERASE_RADIUS = 0.035  // normalized
// Default text box width (normalized) — must match value in handleMouseDown
const TEXT_BOX_WIDTH = 0.22

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawStroke[],
  w: number,
  h: number,
) {
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue
    ctx.save()
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const [fx, fy] = stroke.points[0]
    ctx.moveTo(fx * w, fy * h)
    for (let i = 1; i < stroke.points.length; i++) {
      const [px, py] = stroke.points[i]
      ctx.lineTo(px * w, py * h)
    }
    ctx.stroke()
    ctx.restore()
  }
}

export default function AnnotationCanvas({
  pageNum: _pageNum, canvasWidth, canvasHeight, tool, color, strokeWidth,
  annotations, onStrokeComplete, onErase, onTextAdd, onTextUpdate, onTextDelete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const currentPoints = useRef<Array<[number, number]>>([])
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null)
  // Normalized mouse position for text placement preview
  const [textPreview, setTextPreview] = useState<{ x: number; y: number } | null>(null)

  // Setup canvas dimensions and redraw when anything changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    drawStrokes(ctx, annotations.strokes, canvasWidth, canvasHeight)
  }, [annotations.strokes, canvasWidth, canvasHeight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    redraw()
  }, [canvasWidth, canvasHeight, redraw])

  // Clear text preview when switching away from text tool
  useEffect(() => {
    if (tool !== 'text') setTextPreview(null)
  }, [tool])

  function getNorm(e: React.MouseEvent): [number, number] {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return [
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
    ]
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return

    if (tool === 'text') {
      const [x, y] = getNorm(e)
      onTextAdd({
        id: crypto.randomUUID(),
        x,
        y,
        width: TEXT_BOX_WIDTH,
        fontSize: 16,
        color,
        text: '',
      })
      setTextPreview(null)
      return
    }

    if (tool === 'eraser') {
      drawing.current = true
      const [x, y] = getNorm(e)
      onErase(x, y, ERASE_RADIUS)
      return
    }

    drawing.current = true
    currentPoints.current = [getNorm(e)]
  }

  function handleMouseMove(e: React.MouseEvent) {
    const [x, y] = getNorm(e)

    if (tool === 'text') {
      setTextPreview({ x, y })
      return
    }

    if (tool === 'eraser') {
      setEraserPos({ x: x * canvasWidth, y: y * canvasHeight })
      if (drawing.current) onErase(x, y, ERASE_RADIUS)
      return
    }

    if (!drawing.current) return
    currentPoints.current.push([x, y])

    // Redraw committed strokes + live preview of current stroke
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    drawStrokes(ctx, annotations.strokes, canvasWidth, canvasHeight)

    // Current stroke preview
    if (currentPoints.current.length >= 2) {
      ctx.save()
      ctx.globalAlpha = tool === 'highlight' ? 0.38 : 1
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const [fx, fy] = currentPoints.current[0]
      ctx.moveTo(fx * canvasWidth, fy * canvasHeight)
      for (let i = 1; i < currentPoints.current.length; i++) {
        const [px, py] = currentPoints.current[i]
        ctx.lineTo(px * canvasWidth, py * canvasHeight)
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  function handleMouseUp() {
    if (!drawing.current) return
    drawing.current = false

    if (tool !== 'eraser' && currentPoints.current.length >= 2) {
      onStrokeComplete({
        type: tool as 'pen' | 'highlight',
        color,
        width: strokeWidth,
        opacity: tool === 'highlight' ? 0.38 : 1,
        points: [...currentPoints.current],
      })
    }
    currentPoints.current = []
  }

  function handleMouseLeave() {
    drawing.current = false
    setEraserPos(null)
    setTextPreview(null)
    currentPoints.current = []
    redraw()
  }

  const cursor =
    tool === 'pen' || tool === 'highlight' ? 'crosshair'
    : tool === 'text' ? 'none'   // custom preview replaces the cursor
    : 'none'

  const eraserPx = ERASE_RADIUS * canvasWidth

  return (
    <div
      style={{ position: 'absolute', top: 0, left: 0, width: canvasWidth, height: canvasHeight, cursor }}
    >
      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />

      {/* Interaction overlay (transparent, catches events) */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Eraser circle indicator */}
      {tool === 'eraser' && eraserPos && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
            width: eraserPx * 2,
            height: eraserPx * 2,
            left: eraserPos.x - eraserPx,
            top: eraserPos.y - eraserPx,
          }}
        />
      )}

      {/* Text placement preview — blinking text cursor at exact click position */}
      {tool === 'text' && textPreview && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: textPreview.x * canvasWidth,
            top: textPreview.y * canvasHeight,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 4,
          }}
        >
          {/* Blinking I-beam cursor */}
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 20,
              background: color,
              borderRadius: 1,
              animation: 'blink 1s step-end infinite',
              boxShadow: `0 0 4px ${color}80`,
            }}
          />
          {/* Subtle hint label */}
          <span
            style={{
              fontSize: 10,
              color,
              opacity: 0.65,
              userSelect: 'none',
              background: 'rgba(0,0,0,0.45)',
              borderRadius: 3,
              padding: '1px 4px',
              lineHeight: 1.6,
              whiteSpace: 'nowrap',
            }}
          >
            click to place text
          </span>
        </div>
      )}

      {/* Text annotation overlays */}
      {annotations.texts.map((text) => (
        <TextAnnotationBox
          key={text.id}
          annotation={text}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onUpdate={(updates) => onTextUpdate(text.id, updates)}
          onDelete={() => onTextDelete(text.id)}
        />
      ))}

      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </div>
  )
}
