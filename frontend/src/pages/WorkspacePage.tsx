import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { ArrowLeft, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { PdfViewer } from '../components/workspace/PdfViewer'
import WorkspaceToolSidebar from '../components/workspace/WorkspaceToolSidebar'
import { useToastStore } from '../store/useToastStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface DocMeta {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  const [meta, setMeta] = useState<DocMeta | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.2)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadDocument(id)
  }, [id])

  async function loadDocument(docId: string) {
    setLoading(true)
    setError(null)
    try {
      // Fetch metadata and binary in parallel
      const [metaRes, fileRes] = await Promise.all([
        apiFetch(`/api/documents/${docId}`),
        apiFetch(`/api/documents/${docId}/download`),
      ])

      if (!metaRes.ok || !fileRes.ok) {
        setError('Document not found or you do not have access.')
        return
      }

      const [docMeta, buffer] = await Promise.all([
        metaRes.json() as Promise<DocMeta>,
        fileRes.arrayBuffer(),
      ])

      setMeta(docMeta)
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise
      setPdfDoc(doc)
      setCurrentPage(1)
    } catch {
      setError('Failed to load the document. Is the backend running?')
      addToast('error', 'Could not open document.')
    } finally {
      setLoading(false)
    }
  }

  const scalePercent = Math.round(scale * 100)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a1520' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="h-13 shrink-0 flex items-center gap-3 px-4 border-b"
        style={{ background: '#0d1829', borderColor: 'rgba(255,255,255,0.05)', height: 52 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="w-px h-5 bg-white/[0.07] shrink-0" />

        {/* Document name */}
        <span className="text-sm text-white/80 truncate flex-1 min-w-0">
          {meta?.originalName ?? (loading ? 'Loading…' : 'Document')}
        </span>

        {/* Page counter */}
        {pdfDoc && (
          <span className="text-xs text-slate-500 shrink-0 tabular-nums">
            {currentPage} / {pdfDoc.numPages}
          </span>
        )}

        <div className="w-px h-5 bg-white/[0.07] shrink-0" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            disabled={scale <= 0.5}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center tabular-nums select-none">
            {scalePercent}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            disabled={scale >= 3}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </header>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Tool sidebar */}
        <WorkspaceToolSidebar activeTool={activeTool} onToolSelect={setActiveTool} />

        {/* PDF viewer area */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: '#101c2e' }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center gap-3 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading document…</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <AlertCircle size={32} className="text-slate-600" />
              <p className="text-sm text-slate-400">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Return to dashboard
              </button>
            </div>
          ) : pdfDoc ? (
            <PdfViewer pdfDoc={pdfDoc} scale={scale} onPageChange={setCurrentPage} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
