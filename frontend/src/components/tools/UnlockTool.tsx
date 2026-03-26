import { useRef, useState } from 'react'
import { UploadCloud, Eye, EyeOff, Download, Loader2, FileText } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'

export default function UnlockTool() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  function handleFile(f: File) {
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
    setFile(f)
    setError(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleUnlock() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    if (password.trim()) formData.append('password', password)

    try {
      const res = await fetch('/api/v1/unlock', { method: 'POST', body: formData })

      if (res.status === 403) {
        setError('Incorrect password. Please try again.')
        return
      }
      if (res.status === 400) {
        setError('This PDF is not encrypted.')
        return
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'unlocked.pdf'
      a.click()
      URL.revokeObjectURL(url)
      addToast('success', 'Password removed — downloading unlocked.pdf')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Unlock PDF</h2>
        <p className="text-slate-400 text-sm">
          Remove password protection from a PDF you have access to.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700
                   bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl p-8
                   cursor-pointer transition-colors duration-200"
      >
        {file ? (
          <>
            <FileText size={28} className="text-yellow-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a PDF, or <span className="text-yellow-400">browse</span>
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && file) handleUnlock() }}
            placeholder="Enter the PDF password"
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2.5 pr-10
                       text-sm text-white placeholder-slate-500 focus:outline-none
                       focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-1">Leave blank if the PDF has no open password.</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleUnlock}
        disabled={loading || !file}
        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium
                   px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Unlocking…</>
          : <><Download size={15} /> Unlock & Download</>}
      </button>
    </div>
  )
}
