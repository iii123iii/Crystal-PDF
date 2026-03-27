import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { TextAnnotation } from './useAnnotations'

interface Props {
  annotation: TextAnnotation
  canvasWidth: number
  canvasHeight: number
  onUpdate: (updates: Partial<TextAnnotation>) => void
  onDelete: () => void
}

export default function TextAnnotationBox({
  annotation, canvasWidth, canvasHeight, onUpdate, onDelete,
}: Props) {
  const [editing, setEditing] = useState(annotation.text === '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // px coords
  const left = annotation.x * canvasWidth
  const top = annotation.y * canvasHeight
  const width = annotation.width * canvasWidth

  useEffect(() => {
    if (editing) {
      setTimeout(() => textareaRef.current?.focus(), 20)
    }
  }, [editing])

  // ── Drag ──────────────────────────────────────────────────────────────────
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  function onDragStart(e: React.MouseEvent) {
    if (editing) return
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: annotation.x,
      oy: annotation.y,
    }
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  }

  function onDragMove(e: MouseEvent) {
    if (!dragRef.current) return
    const dx = (e.clientX - dragRef.current.startX) / canvasWidth
    const dy = (e.clientY - dragRef.current.startY) / canvasHeight
    onUpdate({
      x: Math.max(0, Math.min(1 - annotation.width, dragRef.current.ox + dx)),
      y: Math.max(0, dragRef.current.oy + dy),
    })
  }

  function onDragEnd() {
    dragRef.current = null
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null)

  function onResizeStart(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startW: annotation.width }
    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', onResizeEnd)
  }

  function onResizeMove(e: MouseEvent) {
    if (!resizeRef.current) return
    const dx = (e.clientX - resizeRef.current.startX) / canvasWidth
    onUpdate({ width: Math.max(0.1, resizeRef.current.startW + dx) })
  }

  function onResizeEnd() {
    resizeRef.current = null
    window.removeEventListener('mousemove', onResizeMove)
    window.removeEventListener('mouseup', onResizeEnd)
  }

  return (
    <div
      ref={boxRef}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        minHeight: 28,
        cursor: editing ? 'text' : 'move',
        zIndex: 10,
      }}
      onMouseDown={onDragStart}
      onDoubleClick={() => setEditing(true)}
    >
      {/* Container */}
      <div
        style={{
          position: 'relative',
          background: 'rgba(7,16,28,0.55)',
          backdropFilter: 'blur(6px)',
          border: `1.5px solid ${annotation.color}60`,
          borderRadius: 6,
          padding: '4px 6px',
          minHeight: 28,
          boxShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 0 1px ${annotation.color}20`,
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={annotation.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => { if (annotation.text.trim()) setEditing(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: annotation.color,
              fontSize: annotation.fontSize,
              fontFamily: 'inherit',
              lineHeight: 1.4,
              cursor: 'text',
              minHeight: 24,
              overflow: 'hidden',
            }}
            rows={1}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = t.scrollHeight + 'px'
            }}
          />
        ) : (
          <div
            style={{
              color: annotation.color,
              fontSize: annotation.fontSize,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: 20,
              userSelect: 'none',
            }}
          >
            {annotation.text || <span style={{ opacity: 0.4 }}>Double-click to edit</span>}
          </div>
        )}

        {/* Delete button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            border: '1.5px solid rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            padding: 0,
          }}
        >
          <X size={10} color="white" strokeWidth={2.5} />
        </button>

        {/* Resize handle */}
        <div
          onMouseDown={onResizeStart}
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            width: 12,
            height: 12,
            background: annotation.color,
            border: '2px solid rgba(7,16,28,0.8)',
            borderRadius: 3,
            cursor: 'se-resize',
            zIndex: 20,
          }}
        />
      </div>
    </div>
  )
}
