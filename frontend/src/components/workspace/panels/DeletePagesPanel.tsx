import { useState } from 'react'
import { Trash2, Loader2, Info } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface DeletePagesPanelProps {
  docId: string
  totalPages: number
  selectedPages: Set<number>
  onSelectAll: () => void
  onClearAll: () => void
  pdfPassword?: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function DeletePagesPanel({
  docId, totalPages, selectedPages, onSelectAll, onClearAll, pdfPassword, onSuccess,
}: DeletePagesPanelProps) {
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  const count = selectedPages.size
  const wouldLeave = totalPages - count

  async function handleDelete() {
    if (count === 0) return
    if (wouldLeave < 1) { addToast('error', 'Cannot delete all pages.'); return }
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/delete-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: Array.from(selectedPages).sort((a, b) => a - b),
          sourcePassword: pdfPassword ?? null,
        }),
      })
      if (res.ok) {
        const doc = await res.json() as { id: number; originalName: string }
        onSuccess(doc)
      } else {
        const data = await res.json().catch(() => ({}))
        addToast('error', (data as { error?: string }).error ?? 'Delete pages failed.')
      }
    } catch {
      addToast('error', 'Cannot reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Instructions */}
      <div
        className="flex items-start gap-2 rounded-lg p-3 text-xs"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
      >
        <Info size={12} className="mt-0.5 shrink-0" />
        Click pages in the viewer to select which ones to delete, then click Delete.
      </div>

      {/* Selection controls */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>
          {count > 0
            ? <><span style={{ color: '#ef4444', fontWeight: 600 }}>{count}</span> of {totalPages} pages selected</>
            : `${totalPages} total pages`}
        </span>
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="transition-colors" style={{ color: 'var(--color-accent)' }}>
            All
          </button>
          <button onClick={onClearAll} style={{ color: 'var(--color-muted)' }}>
            None
          </button>
        </div>
      </div>

      {/* Warning */}
      {count > 0 && (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            background: wouldLeave < 1 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.10)',
            border: `1px solid ${wouldLeave < 1 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
            color: wouldLeave < 1 ? '#ef4444' : '#f59e0b',
          }}
        >
          {wouldLeave < 1
            ? 'Cannot delete all pages — at least one must remain.'
            : `${wouldLeave} page${wouldLeave !== 1 ? 's' : ''} will remain after deletion.`}
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={loading || count === 0 || wouldLeave < 1}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
        style={{ background: '#ef4444', color: '#fff' }}
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" />Deleting…</>
          : <><Trash2 size={14} />{count > 0 ? `Delete ${count} page${count > 1 ? 's' : ''}` : 'Select pages to delete'}</>}
      </button>
    </div>
  )
}
