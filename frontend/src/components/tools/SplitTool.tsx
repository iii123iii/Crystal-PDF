import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import localforage from 'localforage'
import { UploadCloud, Download, Loader2, CheckCircle2 } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'

// Worker is copied to public/ as .js by the prebuild/predev script so that
// any server (including Nginx) serves it with the correct application/javascript
// MIME type rather than application/octet-stream.
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

const STORAGE_KEY = 'crystalpdf:split-file'

interface StoredFile {
  name: string
  data: ArrayBuffer
}

// ─── Page thumbnail ───────────────────────────────────────────────────────────

interface ThumbnailProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNum: number
  selected: boolean
  onToggle: () => void
}

function PageThumbnail({ pdfDoc, pageNum, selected, onToggle }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 0.4 })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise
      if (!cancelled) setRendered(true)
    })()
    return () => { cancelled = true }
  }, [pdfDoc, pageNum])

  return (
    <button
      onClick={onToggle}
      className={`
        group flex flex-col items-center gap-2 p-2 rounded-xl border transition-all duration-150
        ${selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-500'}
      `}
    >
      <div className="relative w-full rounded overflow-hidden bg-slate-700">
        {/* Skeleton while rendering */}
        {!rendered && (
          <div className="absolute inset-0 animate-pulse bg-slate-700" style={{ aspectRatio: '3/4' }} />
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />

        {/* Selection overlay */}
        {selected && (
          <div className="absolute inset-0 bg-blue-500/15 flex items-start justify-end p-1">
            <CheckCircle2 size={16} className="text-blue-400" />
          </div>
        )}
      </div>
      <span className="text-xs text-slate-400">{pageNum}</span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SplitTool() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  // Restore persisted file on mount
  useEffect(() => {
    ;(async () => {
      try {
        const stored = await localforage.getItem<StoredFile>(STORAGE_KEY)
        if (stored) await loadBuffer(stored.data, stored.name)
      } finally {
        setRestoring(false)
      }
    })()
  }, [])

  async function loadBuffer(buffer: ArrayBuffer, name: string) {
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise
    setPdfDoc(doc)
    setPageCount(doc.numPages)
    setFileName(name)
    setSelected(new Set())
    setError(null)
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    const buffer = await file.arrayBuffer()
    await localforage.setItem<StoredFile>(STORAGE_KEY, { name: file.name, data: buffer })
    await loadBuffer(buffer, file.name)
  }

  function togglePage(n: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  function selectAll() { setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1))) }
  function deselectAll() { setSelected(new Set()) }

  async function handleExtract() {
    if (selected.size === 0) { setError('Select at least one page.'); return }
    setLoading(true)
    setError(null)

    const stored = await localforage.getItem<StoredFile>(STORAGE_KEY)
    if (!stored) { setError('File not found. Please re-upload.'); setLoading(false); return }

    try {
      const formData = new FormData()
      formData.append('file', new Blob([stored.data], { type: 'application/pdf' }), stored.name)
      Array.from(selected).sort((a, b) => a - b).forEach((p) => formData.append('pages', String(p)))

      const res = await fetch('/api/v1/split', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'extracted.pdf'
      a.click()
      URL.revokeObjectURL(url)
      addToast('success', `Extracted ${selected.size} page${selected.size > 1 ? 's' : ''} — downloading extracted.pdf`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed.')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (restoring) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm gap-2">
        <Loader2 size={16} className="animate-spin" /> Restoring last session…
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Split / Extract Pages</h2>
        <p className="text-slate-400 text-sm">
          Upload a PDF, select the pages you want to keep, then download the result.
        </p>
      </div>

      {/* Upload zone — always visible so user can swap files */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700
                   bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl p-8 cursor-pointer
                   transition-colors duration-200"
      >
        <UploadCloud size={30} className="text-slate-500" />
        {fileName ? (
          <p className="text-sm text-slate-300">
            <span className="text-white font-medium">{fileName}</span>
            <span className="text-slate-500 ml-2">— click or drop to replace</span>
          </p>
        ) : (
          <p className="text-sm text-slate-300 font-medium">
            Drag & drop a PDF here, or <span className="text-blue-400">browse</span>
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
      </div>

      {/* Toolbar */}
      {pdfDoc && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-400">
            {selected.size} of {pageCount} pages selected
          </span>
          <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Select all
          </button>
          <button onClick={deselectAll} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Deselect all
          </button>

          <div className="ml-auto">
            <button
              onClick={handleExtract}
              disabled={loading || selected.size === 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700
                         disabled:text-slate-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Extracting…</>
              ) : (
                <><Download size={14} /> Extract {selected.size > 0 ? `${selected.size} page${selected.size > 1 ? 's' : ''}` : 'Pages'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Thumbnail grid */}
      {pdfDoc && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <PageThumbnail
              key={n}
              pdfDoc={pdfDoc}
              pageNum={n}
              selected={selected.has(n)}
              onToggle={() => togglePage(n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
