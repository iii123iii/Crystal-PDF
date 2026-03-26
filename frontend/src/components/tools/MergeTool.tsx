import { useRef, useState } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { UploadCloud, X, FileText, Loader2, Download, GripVertical } from 'lucide-react'

interface PdfFile {
  id: string
  file: File
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MergeTool() {
  const [files, setFiles] = useState<PdfFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const pdfs = Array.from(incoming).filter((f) => f.type === 'application/pdf')
    if (pdfs.length !== incoming.length) {
      setError('Only PDF files are accepted.')
    } else {
      setError(null)
    }
    setFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ id: crypto.randomUUID(), file: f })),
    ])
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError('Add at least two PDF files to merge.')
      return
    }
    setLoading(true)
    setError(null)

    const formData = new FormData()
    files.forEach(({ file }) => formData.append('files', file))

    try {
      const res = await fetch('/api/v1/merge', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Merge PDF</h2>
        <p className="text-slate-400 text-sm">
          Combine multiple PDF files into a single document. Drag the handles to reorder.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-xl p-10 cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'}
        `}
      >
        <UploadCloud size={36} className="text-slate-500" />
        <p className="text-sm text-slate-300 font-medium">
          Drag & drop PDF files here, or <span className="text-blue-400">browse</span>
        </p>
        <p className="text-xs text-slate-500">Only .pdf files are accepted</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Sortable file list */}
      {files.length > 0 && (
        <ReactSortable
          tag="ul"
          list={files}
          setList={setFiles}
          handle=".drag-handle"
          animation={150}
          ghostClass="opacity-40"
          className="space-y-2"
        >
          {files.map(({ id, file }, index) => (
            <li
              key={id}
              className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-lg px-4 py-3 select-none"
            >
              <span className="drag-handle cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                <GripVertical size={16} />
              </span>
              <span className="text-slate-500 text-xs w-5 text-right shrink-0">{index + 1}</span>
              <FileText size={16} className="text-blue-400 shrink-0" />
              <span className="text-sm text-white flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-500 shrink-0">{formatBytes(file.size)}</span>
              <button
                onClick={() => removeFile(id)}
                className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ReactSortable>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleMerge}
          disabled={loading || files.length < 2}
          className="
            flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
            disabled:text-slate-500 text-white text-sm font-medium
            px-6 py-2.5 rounded-lg transition-colors
          "
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Merging…</>
          ) : (
            <><Download size={15} /> Merge & Download</>
          )}
        </button>

        {files.length > 0 && (
          <button
            onClick={() => setFiles([])}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
