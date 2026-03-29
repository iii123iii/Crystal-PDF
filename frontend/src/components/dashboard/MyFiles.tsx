import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Trash2, ExternalLink, UploadCloud, Loader2,
  Download, FolderOpen, Search, Pencil, Check, X,
} from 'lucide-react'
import { apiFetch } from '../../lib/api'
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
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function MyFiles() {
  const [files, setFiles]         = useState<DocumentInfo[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [query, setQuery]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addToast = useToastStore((s) => s.addToast)
  const navigate = useNavigate()

  useEffect(() => { loadFiles() }, [])

  async function loadFiles() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/documents/my-files')
      if (res.ok) setFiles(await res.json())
      else addToast('error', 'Could not load files.')
    } catch {
      addToast('error', 'Cannot reach the server.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    let count = 0
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await apiFetch('/api/documents/upload', { method: 'POST', body: fd })
        if (res.ok) count++
      } catch { /* individual failure silent */ }
    }
    if (count > 0) {
      addToast('success', `${count} file${count > 1 ? 's' : ''} uploaded`)
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
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
    } catch {
      addToast('error', 'Download failed.')
    }
  }

  async function handleRename(id: number, newName: string) {
    try {
      const res = await apiFetch(`/api/documents/${id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (res.ok) {
        const updated = await res.json() as DocumentInfo
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, originalName: updated.originalName } : f))
      } else {
        addToast('error', 'Rename failed.')
      }
    } catch {
      addToast('error', 'Rename failed.')
    }
  }

  const filtered = query.trim()
    ? files.filter((f) => f.originalName.toLowerCase().includes(query.toLowerCase()))
    : files

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 sm:py-8 w-full space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            My Files
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {loading ? 'Loading…' : `${files.length} document${files.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin" />Uploading…</>
            : <><UploadCloud size={14} />Upload</>}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-7 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
          background: dragging ? 'var(--color-accent-muted)' : 'var(--color-surface)',
        }}
      >
        <UploadCloud
          size={22}
          style={{ color: dragging ? 'var(--color-accent)' : 'var(--color-muted)' }}
        />
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {dragging ? 'Drop to upload' : <>Drag & drop or <span style={{ color: 'var(--color-accent)' }}>browse</span></>}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Search */}
      {!loading && files.length > 0 && (
        <div className="relative" style={{ maxWidth: 320 }}>
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl animate-pulse"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <FolderOpen size={24} style={{ color: 'var(--color-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Your library is empty
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Upload a document to get started.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No files match "{query}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              deleting={deletingId === file.id}
              onDelete={() => handleDelete(file.id, file.originalName)}
              onDownload={() => handleDownload(file.id, file.originalName)}
              onOpen={() => navigate(`/workspace/${file.id}`)}
              onRename={(name) => handleRename(file.id, name)}
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
  onRename: (name: string) => void
}

function FileCard({ file, deleting, onDelete, onDownload, onOpen, onRename }: FileCardProps) {
  const ext = file.originalName.split('.').pop()?.toUpperCase() ?? 'FILE'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(file.originalName)
  const inputRef              = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(file.originalName)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== file.originalName) onRename(trimmed)
    setEditing(false)
  }

  function cancelRename() {
    setDraft(file.originalName)
    setEditing(false)
  }

  return (
    <div
      className="group flex flex-col rounded-xl p-4 transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-muted-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      {/* Icon + name */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <FileText size={13} style={{ color: '#f87171' }} />
          <span className="text-[9px] font-bold leading-none mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>
            {ext}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  commitRename()
                  if (e.key === 'Escape') cancelRename()
                }}
                className="flex-1 min-w-0 text-xs bg-transparent outline-none pb-0.5"
                style={{
                  color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-accent)',
                }}
                autoFocus
              />
              <button onClick={commitRename} style={{ color: '#34d399' }}>
                <Check size={11} />
              </button>
              <button onClick={cancelRename} style={{ color: 'var(--color-muted)' }}>
                <X size={11} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <p
                className="text-xs font-medium truncate flex-1 min-w-0 leading-snug"
                style={{ color: 'var(--color-text)' }}
                title={file.originalName}
              >
                {file.originalName}
              </p>
              <button
                onClick={startEdit}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-muted)' }}
                title="Rename"
              >
                <Pencil size={10} />
              </button>
            </div>
          )}
          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {formatBytes(file.sizeBytes)}
          </p>
        </div>
      </div>

      {/* Date */}
      <p className="text-[11px] mt-2.5" style={{ color: 'var(--color-muted-2)' }}>
        {formatDate(file.createdAt)}
      </p>

      {/* Actions */}
      <div
        className="flex items-center gap-1 mt-3 pt-3"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg transition-colors"
          style={{
            color: 'var(--color-muted)',
            background: 'var(--color-surface-2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          <ExternalLink size={11} />
          Open
        </button>
        <button
          onClick={onDownload}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          title="Download"
        >
          <Download size={13} />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          title="Delete"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  )
}
