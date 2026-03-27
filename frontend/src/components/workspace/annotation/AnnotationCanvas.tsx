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
        width: 0.22,
        fontSize: 16,
        color,
        text: '',
      })
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
    currentPoints.current = []
    redraw()
  }

  const cursor =
    tool === 'pen' || tool === 'highlight' ? 'crosshair'
    : tool === 'text' ? 'text'
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
    </div>
  )
}
