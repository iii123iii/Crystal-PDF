import { useState } from 'react'
import { ShieldX, Loader2, CheckCircle } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface SanitizePanelProps {
  docId: string
  pdfPassword?: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function SanitizePanel({ docId, pdfPassword, onSuccess }: SanitizePanelProps) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  async function handleSanitize() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword ?? null }),
      })
      if (res.ok) {
        const doc = await res.json() as { id: number; originalName: string }
        onSuccess(doc)
      } else {
        const data = await res.json().catch(() => ({}))
        addToast('error', (data as { error?: string }).error ?? 'Sanitize failed.')
      }
    } catch {
      addToast('error', 'Cannot reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldX size={14} style={{ color: '#ef4444' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            What gets removed
          </span>
        </div>
        <ul className="space-y-1">
          {[
            'Metadata (author, title, creator)',
            'Embedded JavaScript',
            'Hidden form fields',
            'Embedded files & attachments',
            'Digital signatures',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <CheckCircle size={11} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSanitize}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" />Sanitizing…</>
          : <><ShieldX size={14} />Sanitize PDF</>}
      </button>
    </div>
  )
}
