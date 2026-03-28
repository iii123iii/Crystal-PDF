import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function PageNumberPanel({ docId, pdfPassword, onSuccess }: Props) {
  const [position, setPosition] = useState('bottom-center')
  const [startNumber, setStartNumber] = useState(1)
  const [fontSize, setFontSize] = useState(10)
  const [format, setFormat] = useState('number')
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/page-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, position, startNumber, fontSize, format }),
      })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', 'Failed to add page numbers')
    } catch { addToast('error', 'Failed to add page numbers.') }
    finally { setLoading(false) }
  }

  const selectStyle: React.CSSProperties = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Position</label>
        <select value={position} onChange={e => setPosition(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg" style={selectStyle}>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="top-center">Top Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Format</label>
        <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg" style={selectStyle}>
          <option value="number">1, 2, 3...</option>
          <option value="page-number">Page 1, Page 2...</option>
          <option value="number-of-total">1 of 10, 2 of 10...</option>
          <option value="page-number-of-total">Page 1 of 10...</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Start From</label>
          <input type="number" value={startNumber} onChange={e => setStartNumber(+e.target.value)} min={1}
            className="w-full text-sm px-3 py-2 rounded-lg" style={selectStyle} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Font Size</label>
          <input type="number" value={fontSize} onChange={e => setFontSize(+e.target.value)} min={6} max={36}
            className="w-full text-sm px-3 py-2 rounded-lg" style={selectStyle} />
        </div>
      </div>
      <button onClick={handleApply} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Add Page Numbers'}
      </button>
    </div>
  )
}
