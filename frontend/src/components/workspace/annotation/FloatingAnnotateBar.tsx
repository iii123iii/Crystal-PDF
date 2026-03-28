import { Eraser, Highlighter, Loader2, Pencil, RotateCcw, Save, Trash2, Type } from 'lucide-react'
import { useRef } from 'react'
import type { AnnotationTool } from './useAnnotations'

interface Props {
  tool: AnnotationTool
  onToolChange: (t: AnnotationTool) => void
  color: string
  onColorChange: (c: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
  onUndo: () => void
  onClearPage: () => void
  onSave: () => void
  saving?: boolean
}

const TOOLS: { id: AnnotationTool; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { id: 'pen',       icon: Pencil,      label: 'Pen'       },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'text',      icon: Type,        label: 'Text'      },
  { id: 'eraser',    icon: Eraser,      label: 'Eraser'    },
]

const COLORS = [
  { value: '#000000', label: 'Black'  },
  { value: '#e2e8f0', label: 'White'  },
  { value: '#3b82f6', label: 'Blue'   },
  { value: '#22c55e', label: 'Green'  },
  { value: '#eab308', label: 'Yellow' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red'    },
  { value: '#a855f7', label: 'Purple' },
]

// Width presets [pen, highlight] — different defaults per tool
const WIDTH_PRESETS: Record<AnnotationTool, [number, number, number]> = {
  pen:       [2, 4, 9],
  highlight: [14, 22, 36],
  text:      [2, 4, 9],
  eraser:    [2, 4, 9],
}

const WIDTH_LABELS = ['Thin', 'Medium', 'Thick']

// Thin/medium/thick visual indicator SVGs as inline
function WidthIcon({ size }: { size: number }) {
  return (
    <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 16,
        height: size,
        borderRadius: size,
        background: 'currentColor',
        minHeight: 1,
      }} />
    </div>
  )
}

export default function FloatingAnnotateBar({
  tool, onToolChange,
  color, onColorChange,
  strokeWidth, onStrokeWidthChange,
  onUndo, onClearPage,
  onSave, saving = false,
}: Props) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const presets = WIDTH_PRESETS[tool]
  const activePresetIdx = presets.indexOf(strokeWidth) === -1
    ? 1
    : presets.indexOf(strokeWidth)

  function handleToolChange(t: AnnotationTool) {
    onToolChange(t)
    // Auto-select medium width for the new tool
    onStrokeWidthChange(WIDTH_PRESETS[t][1])
  }

  function handleWidthPreset(idx: number) {
    onStrokeWidthChange(presets[idx])
  }

  const toolColor =
    tool === 'pen'       ? '#93c5fd' :
    tool === 'highlight' ? '#fde68a' :
    tool === 'text'      ? '#d8b4fe' :
    tool === 'eraser'    ? '#94a3b8' : '#93c5fd'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '5px 10px',
          background: 'rgba(10, 18, 32, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset',
          userSelect: 'none',
        }}
      >
        {/* ── Active tool label ── */}
        <span style={{
          fontSize: 10,
          color: toolColor,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          paddingRight: 4,
          minWidth: 52,
          textAlign: 'right',
          opacity: 0.9,
        }}>
          {tool}
        </span>

        <Divider />

        {/* ── Tool buttons ── */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TOOLS.map(({ id, icon: Icon, label }) => {
            const active = tool === id
            const tc =
              id === 'pen'       ? '#93c5fd' :
              id === 'highlight' ? '#fde68a' :
              id === 'text'      ? '#d8b4fe' :
              '#94a3b8'

            return (
              <button
                key={id}
                title={label}
                onClick={() => handleToolChange(id)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: active ? `1px solid ${tc}30` : '1px solid transparent',
                  background: active ? `${tc}15` : 'transparent',
                  color: active ? tc : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 0 12px ${tc}25` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#475569'
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </button>
            )
          })}
        </div>

        <Divider />

        {/* ── Color swatches + custom picker ── */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 4px' }}>
          {COLORS.map(({ value, label }) => {
            const active = color === value
            return (
              <button
                key={value}
                title={label}
                onClick={() => onColorChange(value)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: value,
                  border: active
                    ? '2px solid rgba(255,255,255,0.9)'
                    : '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  boxShadow: active
                    ? `0 0 0 2px rgba(0,0,0,0.6), 0 0 8px ${value}80`
                    : '0 0 0 1px rgba(0,0,0,0.3)',
                  transition: 'all 0.12s',
                  flexShrink: 0,
                  padding: 0,
                }}
              />
            )
          })}

          {/* Custom color picker */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              title="Custom color"
              onClick={() => colorInputRef.current?.click()}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: `conic-gradient(red, yellow, lime, cyan, blue, magenta, red)`,
                border: !COLORS.some(c => c.value === color)
                  ? '2px solid rgba(255,255,255,0.9)'
                  : '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                boxShadow: !COLORS.some(c => c.value === color)
                  ? `0 0 0 2px rgba(0,0,0,0.6), 0 0 8px ${color}80`
                  : '0 0 0 1px rgba(0,0,0,0.3)',
                transition: 'all 0.12s',
                padding: 0,
              }}
            />
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            />
          </div>
        </div>

        {/* ── Stroke width (hidden for eraser/text) ── */}
        {tool !== 'eraser' && tool !== 'text' && (
          <>
            <Divider />
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {[0, 1, 2].map((idx) => {
                const active = activePresetIdx === idx
                const sizes = [1.5, 3, 5.5]
                return (
                  <button
                    key={idx}
                    title={WIDTH_LABELS[idx]}
                    onClick={() => handleWidthPreset(idx)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                      background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: active ? '#e2e8f0' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <WidthIcon size={sizes[idx]} />
                  </button>
                )
              })}
            </div>
          </>
        )}

        <Divider />

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 2 }}>
          <ActionBtn title="Undo last stroke" onClick={onUndo}>
            <RotateCcw size={14} strokeWidth={2} />
          </ActionBtn>
          <ActionBtn title="Clear page annotations" onClick={onClearPage} danger>
            <Trash2 size={13} strokeWidth={2} />
          </ActionBtn>
        </div>

        <Divider />

        {/* ── Save to PDF ── */}
        <button
          title="Save annotations to PDF"
          onClick={onSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            height: 30,
            padding: '0 10px',
            borderRadius: 7,
            border: '1px solid rgba(99,202,183,0.3)',
            background: saving ? 'rgba(99,202,183,0.06)' : 'rgba(99,202,183,0.12)',
            color: saving ? 'rgba(99,202,183,0.5)' : '#63cab7',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(99,202,183,0.2)'
              el.style.borderColor = 'rgba(99,202,183,0.5)'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = saving ? 'rgba(99,202,183,0.06)' : 'rgba(99,202,183,0.12)'
            el.style.borderColor = 'rgba(99,202,183,0.3)'
          }}
        >
          {saving
            ? <Loader2 size={12} strokeWidth={2} className="animate-spin" />
            : <Save size={12} strokeWidth={2} />
          }
          Save to PDF
        </button>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      width: 1,
      height: 22,
      background: 'rgba(255,255,255,0.07)',
      margin: '0 6px',
      flexShrink: 0,
    }} />
  )
}

function ActionBtn({ children, title, onClick, danger }: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        border: '1px solid transparent',
        background: 'transparent',
        color: danger ? '#ef4444' : '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.12s',
        opacity: 0.7,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.opacity = '1'
        el.style.background = danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'
        el.style.color = danger ? '#ef4444' : '#94a3b8'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.opacity = '0.7'
        el.style.background = 'transparent'
        el.style.color = danger ? '#ef4444' : '#475569'
      }}
    >
      {children}
    </button>
  )
}
