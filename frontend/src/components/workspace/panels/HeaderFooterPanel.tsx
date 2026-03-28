import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function HeaderFooterPanel({ docId, pdfPassword, onSuccess }: Props) {
  const [headerLeft, setHeaderLeft] = useState('')
  const [headerCenter, setHeaderCenter] = useState('')
  const [headerRight, setHeaderRight] = useState('')
  const [footerLeft, setFooterLeft] = useState('')
  const [footerCenter, setFooterCenter] = useState('{page} of {total}')
  const [footerRight, setFooterRight] = useState('')
  const [fontSize, setFontSize] = useState(9)
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/header-footer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, headerLeft, headerCenter, headerRight, footerLeft, footerCenter, footerRight, fontSize }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', 'Failed to add header/footer')
    } catch { addToast('error', 'Failed to add header/footer.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Use <code className="font-mono px-1 rounded" style={{ background: 'var(--color-surface-2)' }}>{'{page}'}</code> and <code className="font-mono px-1 rounded" style={{ background: 'var(--color-surface-2)' }}>{'{total}'}</code> as placeholders.
      </p>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-muted)' }}>Header</label>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Left" value={headerLeft} onChange={e => setHeaderLeft(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
          <input placeholder="Center" value={headerCenter} onChange={e => setHeaderCenter(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
          <input placeholder="Right" value={headerRight} onChange={e => setHeaderRight(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-muted)' }}>Footer</label>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Left" value={footerLeft} onChange={e => setFooterLeft(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
          <input placeholder="Center" value={footerCenter} onChange={e => setFooterCenter(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
          <input placeholder="Right" value={footerRight} onChange={e => setFooterRight(e.target.value)} className="text-xs px-2 py-1.5 rounded" style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Font Size</label>
        <input type="number" value={fontSize} onChange={e => setFontSize(+e.target.value)} min={6} max={24}
          className="w-20 text-sm px-3 py-2 rounded-lg" style={inputStyle} />
      </div>

      <button onClick={handleApply} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Apply Header & Footer'}
      </button>
    </div>
  )
}
