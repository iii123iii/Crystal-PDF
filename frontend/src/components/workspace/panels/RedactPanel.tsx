import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'
import type { RedactArea } from '../overlays/RedactOverlay'

interface Props {
  docId: string
  totalPages: number
  pdfPassword: string | null
  areas: RedactArea[]
  onRemoveArea: (index: number) => void
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function RedactPanel({ docId, pdfPassword, areas, onRemoveArea, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/redact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, areas }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', 'Failed to redact')
    } catch { addToast('error', 'Failed to redact.') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Draw rectangles directly on the PDF to mark areas for redaction. Click a marked area to remove it.
      </p>

      {areas.length === 0 ? (
        <div className="py-6 text-center rounded-lg" style={{ border: '1px dashed var(--color-border)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>No areas marked</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Drag on the PDF to mark areas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {areas.map((area, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                Page {area.page} &mdash; {Math.round(area.width * 100)}×{Math.round(area.height * 100)}%
              </span>
              <button onClick={() => onRemoveArea(idx)} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: '#ef4444' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={loading || areas.length === 0}
        className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Apply Redaction (${areas.length} area${areas.length !== 1 ? 's' : ''})`}
      </button>
    </div>
  )
}
