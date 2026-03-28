import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  totalPages: number
  pdfPassword: string | null
  onSuccess: (doc: { id: number; originalName: string }) => void
}

export default function StampPanel({ docId, totalPages, pdfPassword, onSuccess }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pages, setPages] = useState('1')
  const [x, setX] = useState(0.35)
  const [y, setY] = useState(0.8)
  const [width, setWidth] = useState(0.3)
  const [height, setHeight] = useState(0.1)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore(s => s.addToast)

  async function handleApply() {
    if (!imageFile) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      if (pdfPassword) fd.append('sourcePassword', pdfPassword)
      const pageNums = pages.split(',').map(s => s.trim()).filter(Boolean).map(Number)
      pageNums.forEach(p => fd.append('pages', String(p)))
      fd.append('x', String(x))
      fd.append('y', String(y))
      fd.append('width', String(width))
      fd.append('height', String(height))

      const res = await apiFetch(`/api/documents/${docId}/tools/stamp`, { method: 'POST', body: fd })
      if (res.ok) onSuccess(await res.json())
      else addToast('error', await res.text().catch(() => 'Failed'))
    } catch { addToast('error', 'Failed to add stamp.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Signature / Stamp Image</label>
        <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs"
          style={{ border: '1px dashed var(--color-border)', color: imageFile ? 'var(--color-text)' : 'var(--color-muted)' }}>
          <Upload size={14} /> {imageFile ? imageFile.name : 'Choose PNG or JPG'}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
          onChange={e => { if (e.target.files?.[0]) setImageFile(e.target.files[0]) }} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Pages (comma-separated)</label>
        <input value={pages} onChange={e => setPages(e.target.value)} placeholder={`1-${totalPages}`}
          className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
      </div>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Position & size (normalized 0-1):</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'X', value: x, set: setX },
          { label: 'Y', value: y, set: setY },
          { label: 'Width', value: width, set: setWidth },
          { label: 'Height', value: height, set: setHeight },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-muted)' }}>{label}</label>
            <input type="number" value={value} onChange={e => set(+e.target.value)} step={0.05} min={0} max={1}
              className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
          </div>
        ))}
      </div>
      <button onClick={handleApply} disabled={loading || !imageFile} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>
        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Apply Stamp'}
      </button>
    </div>
  )
}
