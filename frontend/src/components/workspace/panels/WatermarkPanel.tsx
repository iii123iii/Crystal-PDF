import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  text: string
  fontSize: number
  opacity: number
  rotation: number
  position: string
  onTextChange: (v: string) => void
  onFontSizeChange: (v: number) => void
  onOpacityChange: (v: number) => void
  onRotationChange: (v: number) => void
  onPositionChange: (v: string) => void
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function WatermarkPanel({
  docId, pdfPassword,
  text, fontSize, opacity, rotation, position,
  onTextChange, onFontSizeChange, onOpacityChange, onRotationChange, onPositionChange,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/watermark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, text, fontSize, opacity, rotation, position }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', await res.text().catch(() => 'Failed'))
    } catch { addToast('error', 'Failed to add watermark.') }
    finally { setLoading(false) }
  }

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        See the watermark preview live on the PDF as you adjust settings.
      </p>
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Watermark Text</label>
        <input
          value={text}
          onChange={e => onTextChange(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg"
          style={fieldStyle}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Font Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={e => onFontSizeChange(+e.target.value)}
            min={8}
            max={200}
            className="w-full text-sm px-3 py-2 rounded-lg"
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Opacity — {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => onOpacityChange(+e.target.value)}
            className="w-full mt-2"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Rotation — {rotation}°
        </label>
        <input
          type="range"
          min={-90}
          max={90}
          step={5}
          value={rotation}
          onChange={e => onRotationChange(+e.target.value)}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Position</label>
        <select
          value={position}
          onChange={e => onPositionChange(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg"
          style={fieldStyle}
        >
          <option value="center">Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>
      <button
        onClick={handleApply}
        disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Apply Watermark'}
      </button>
    </div>
  )
}
