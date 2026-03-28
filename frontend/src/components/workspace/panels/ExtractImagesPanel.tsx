import { useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
}

export default function ExtractImagesPanel({ docId, pdfPassword }: Props) {
  const [format, setFormat] = useState('png')
  const [loading, setLoading] = useState(false)
  const [resultDocId, setResultDocId] = useState<number | null>(null)
  const addToast = useToastStore(s => s.addToast)

  async function handleExtract() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/extract-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword, format }),
      })
      if (res.ok) {
        const doc = await res.json() as { id: number }
        setResultDocId(doc.id)
        addToast('success', 'Images extracted successfully!')
      } else {
        const msg = await res.text().catch(() => 'Failed')
        addToast('error', msg)
      }
    } catch { addToast('error', 'Failed to extract images.') }
    finally { setLoading(false) }
  }

  async function handleDownload() {
    if (!resultDocId) return
    const res = await apiFetch(`/api/documents/${resultDocId}/download`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'extracted_images.zip'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Image Format</label>
        <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
        </select>
      </div>
      {resultDocId ? (
        <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          <Download size={14} /> Download ZIP
        </button>
      ) : (
        <button onClick={handleExtract} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Extract Images'}
        </button>
      )}
    </div>
  )
}
