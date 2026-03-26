import { useRef, useState } from 'react'
import { UploadCloud, Eye, EyeOff, Download, Loader2, FileText } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'

export default function ProtectTool() {
  const [file, setFile] = useState<File | null>(null)
  const [userPassword, setUserPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showUser, setShowUser] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOwner, setShowOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  const passwordMismatch = confirmPassword.length > 0 && userPassword !== confirmPassword
  const canSubmit = file !== null && userPassword.length > 0 && !passwordMismatch

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

  async function handleProtect() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file!)
    formData.append('userPassword', userPassword)
    if (ownerPassword.trim()) formData.append('ownerPassword', ownerPassword)

    try {
      const res = await fetch('/api/v1/protect', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'protected.pdf'
      a.click()
      URL.revokeObjectURL(url)
      addToast('success', 'PDF encrypted — downloading protected.pdf')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to protect PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Protect PDF</h2>
        <p className="text-slate-400 text-sm">Encrypt a PDF with a password to restrict access.</p>
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
            <FileText size={28} className="text-red-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a PDF, or <span className="text-red-400">browse</span>
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

      {/* Password fields */}
      <div className="space-y-4">
        <PasswordField
          label="User Password"
          hint="Required — readers must enter this to open the PDF."
          value={userPassword}
          onChange={setUserPassword}
          show={showUser}
          onToggleShow={() => setShowUser((v) => !v)}
        />

        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggleShow={() => setShowConfirm((v) => !v)}
          invalid={passwordMismatch}
          invalidMessage="Passwords do not match."
        />

        <details className="group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none">
            Advanced: set owner password
          </summary>
          <div className="mt-3">
            <PasswordField
              label="Owner Password"
              hint="Optional — controls editing permissions. Defaults to user password."
              value={ownerPassword}
              onChange={setOwnerPassword}
              show={showOwner}
              onToggleShow={() => setShowOwner((v) => !v)}
            />
          </div>
        </details>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleProtect}
        disabled={loading || !canSubmit}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium
                   px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Encrypting…</>
          : <><Download size={15} /> Protect & Download</>}
      </button>
    </div>
  )
}

interface PasswordFieldProps {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  invalid?: boolean
  invalidMessage?: string
}

function PasswordField({ label, hint, value, onChange, show, onToggleShow, invalid, invalidMessage }: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-800/60 border rounded-lg px-4 py-2.5 pr-10 text-sm text-white
                      placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors
                      ${invalid
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
                        : 'border-slate-700/60 focus:border-red-500 focus:ring-red-500/40'}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {invalid && invalidMessage && (
        <p className="text-red-400 text-xs mt-1">{invalidMessage}</p>
      )}
      {hint && !invalid && (
        <p className="text-slate-600 text-xs mt-1">{hint}</p>
      )}
    </div>
  )
}
