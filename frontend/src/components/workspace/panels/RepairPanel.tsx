import { useState } from 'react'
import { Loader2, Wrench } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function RepairPanel({ docId, pdfPassword, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleRepair() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', await res.text().catch(() => 'Failed'))
    } catch { addToast('error', 'Failed to repair PDF.') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <Wrench size={16} className="shrink-0 mt-0.5" style={{ color: '#10b981' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Repair & Linearize</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Fixes corrupted cross-reference tables, rebuilds the PDF structure, and optimizes for web viewing (linearization).
          </p>
        </div>
      </div>
      <button onClick={handleRepair} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: '#10b981', color: '#fff' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Repair PDF'}
      </button>
    </div>
  )
}
