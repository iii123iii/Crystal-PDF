import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  top: number
  right: number
  bottom: number
  left: number
  onTopChange: (v: number) => void
  onRightChange: (v: number) => void
  onBottomChange: (v: number) => void
  onLeftChange: (v: number) => void
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function CropPanel({
  docId, pdfPassword,
  top, right, bottom, left,
  onTopChange, onRightChange, onBottomChange, onLeftChange,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, marginTop: top, marginRight: right, marginBottom: bottom, marginLeft: left }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', 'Failed to crop')
    } catch { addToast('error', 'Failed to crop pages.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Drag the blue handles on the PDF to set crop margins, or enter values manually (in points, 72pt = 1 inch).
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Top', value: top, set: onTopChange },
          { label: 'Right', value: right, set: onRightChange },
          { label: 'Bottom', value: bottom, set: onBottomChange },
          { label: 'Left', value: left, set: onLeftChange },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>{label} (pt)</label>
            <input
              type="number"
              value={value}
              onChange={e => set(Math.max(0, Math.min(300, +e.target.value)))}
              min={0}
              max={300}
              className="w-full text-sm px-3 py-2 rounded-lg"
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Crop Pages'}
      </button>
    </div>
  )
}
