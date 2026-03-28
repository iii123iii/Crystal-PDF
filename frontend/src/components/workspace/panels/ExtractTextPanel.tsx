import { useState } from 'react'
import { Loader2, Copy, Check } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface Props {
  docId: string
  pdfPassword: string | null
}

export default function ExtractTextPanel({ docId, pdfPassword }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  async function handleExtract() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/extract-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePassword: pdfPassword }),
      })
      if (res.ok) {
        const data = await res.json() as { text: string }
        setText(data.text)
      } else addToast('error', 'Failed to extract text')
    } catch { addToast('error', 'Failed to extract text.') }
    finally { setLoading(false) }
  }

  async function handleCopy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'extracted_text.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">
      {text === null ? (
        <button onClick={handleExtract} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Extract Text'}
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="text-xs px-3 py-1.5 rounded-md"
              style={{ background: 'var(--color-accent)', color: '#fff' }}>
              Download .txt
            </button>
          </div>
          <textarea readOnly value={text} className="w-full h-64 text-xs p-3 rounded-lg font-mono resize-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }} />
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{text.length.toLocaleString()} characters</p>
        </>
      )}
    </div>
  )
}
