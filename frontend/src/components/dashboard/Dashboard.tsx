import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Trash2, ExternalLink, UploadCloud, Loader2, Download, FolderOpen } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import { useToastStore } from '../../store/useToastStore'

interface DocumentInfo {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [files, setFiles] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addToast = useToastStore((s) => s.addToast)
  const userEmail = useAppStore((s) => s.userEmail)
  const navigate = useNavigate()

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/documents/my-files')
      if (res.ok) {
        setFiles(await res.json())
      } else {
        addToast('error', 'Could not load files.')
      }
    } catch {
      addToast('error', 'Cannot reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    let successCount = 0

    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await apiFetch('/api/documents/upload', { method: 'POST', body: fd })
        if (res.ok) successCount++
      } catch {
        // individual file failures are silent; overall count shows result
      }
    }

    if (successCount > 0) {
      addToast('success', `${successCount} file${successCount > 1 ? 's' : ''} uploaded`)
      await loadFiles()
    } else {
      addToast('error', 'Upload failed.')
    }
    setUploading(false)
  }

  async function handleDelete(id: number, name: string) {
    setDeletingId(id)
    try {
      const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id))
        addToast('success', `"${name}" deleted`)
      } else {
        addToast('error', 'Delete failed.')
      }
    } catch {
      addToast('error', 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDownload(id: number, name: string) {
    try {
      const res = await apiFetch(`/api/documents/${id}/download`)
      if (!res.ok) { addToast('error', 'Download failed.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      addToast('error', 'Download failed.')
    }
  }

  const firstName = userEmail?.split('@')[0] ?? 'there'

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Hello, <span className="text-blue-400">{firstName}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading
              ? 'Loading your files…'
              : files.length === 0
              ? 'No files yet — upload one to get started.'
              : `${files.length} document${files.length !== 1 ? 's' : ''} in your library`}
          </p>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
            : <><UploadCloud size={15} /> Upload file</>}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer
          transition-colors duration-200
          ${dragging
            ? 'border-blue-500 bg-blue-500/8'
            : 'border-slate-700/80 bg-slate-800/20 hover:border-slate-600 hover:bg-slate-800/30'}
        `}
      >
        <UploadCloud size={28} className={dragging ? 'text-blue-400' : 'text-slate-600'} />
        <p className="text-sm text-slate-400 text-center">
          {uploading
            ? 'Uploading…'
            : dragging
            ? 'Drop to upload'
            : <>Drag & drop any file here, or <span className="text-blue-400">browse</span></>}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Divider */}
      {!loading && files.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-600 uppercase tracking-wider">Recent files</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              deleting={deletingId === file.id}
              onDelete={() => handleDelete(file.id, file.originalName)}
              onDownload={() => handleDownload(file.id, file.originalName)}
              onOpen={() => navigate(`/workspace/${file.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── File card ─────────────────────────────────────────────────────────────────

interface FileCardProps {
  file: DocumentInfo
  deleting: boolean
  onDelete: () => void
  onDownload: () => void
  onOpen: () => void
}

function FileCard({ file, deleting, onDelete, onDownload, onOpen }: FileCardProps) {
  const ext = file.originalName.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <div className="group flex flex-col bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 hover:bg-slate-800/60 transition-colors">

      {/* Icon + name */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
          <FileText size={14} className="text-red-400" />
          <span className="text-red-400/70 text-[9px] font-bold leading-none mt-0.5">{ext}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white font-medium truncate leading-snug" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatBytes(file.sizeBytes)}
          </p>
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-slate-600 mt-3">{formatDate(file.createdAt)}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700/50">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/60 rounded-lg py-1.5 transition-colors"
        >
          <ExternalLink size={11} />
          Open
        </button>
        <button
          onClick={onDownload}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-700/40 transition-colors"
          title="Download"
        >
          <Download size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-40"
          title="Delete"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-36 bg-slate-800/30 border border-slate-700/30 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-5">
        <FolderOpen size={28} className="text-slate-600" />
      </div>
      <p className="text-slate-300 font-medium text-lg">Your library is empty</p>
      <p className="text-slate-600 text-sm mt-1.5 max-w-xs">
        Upload a document using the zone above or the button in the header.
      </p>
    </div>
  )
}
