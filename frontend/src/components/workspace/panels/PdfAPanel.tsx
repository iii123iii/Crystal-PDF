import { useState } from 'react'
import { Loader2, FileCheck } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function PdfAPanel({ docId, pdfPassword, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleConvert() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/pdfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', await res.text().catch(() => 'Failed'))
    } catch { addToast('error', 'Failed to convert to PDF/A.') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <FileCheck size={16} className="shrink-0 mt-0.5" style={{ color: '#8b5cf6' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>PDF/A-2b Conversion</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Converts your PDF to PDF/A-2b, the ISO standard for long-term digital preservation. Required for legal archival and regulatory compliance.
          </p>
        </div>
      </div>
      <button onClick={handleConvert} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Convert to PDF/A'}
      </button>
    </div>
  )
}
