import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { ArrowLeft, ZoomIn, ZoomOut, Loader2, AlertCircle, LayoutGrid } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { PdfViewer } from '../components/workspace/PdfViewer'
import WorkspaceToolSidebar from '../components/workspace/WorkspaceToolSidebar'
import WorkspaceToolPanel from '../components/workspace/WorkspaceToolPanel'
import PageThumbnailStrip from '../components/workspace/PageThumbnailStrip'
import PdfPasswordModal from '../components/workspace/PdfPasswordModal'
import SplitPanel from '../components/workspace/panels/SplitPanel'
import ProtectPanel from '../components/workspace/panels/ProtectPanel'
import CompressPanel from '../components/workspace/panels/CompressPanel'
import OcrPanel from '../components/workspace/panels/OcrPanel'
import UnlockPanel from '../components/workspace/panels/UnlockPanel'
import PdfToImagePanel from '../components/workspace/panels/PdfToImagePanel'
import WordToPdfPanel from '../components/workspace/panels/WordToPdfPanel'
import ImageToPdfPanel from '../components/workspace/panels/ImageToPdfPanel'
import MergePanel from '../components/workspace/panels/MergePanel'
import AnnotatePanel from '../components/workspace/panels/AnnotatePanel'
import FloatingAnnotateBar from '../components/workspace/annotation/FloatingAnnotateBar'
import { useAnnotations } from '../components/workspace/annotation/useAnnotations'
import type { AnnotationTool } from '../components/workspace/annotation/useAnnotations'
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

  // Split-tool page selection state
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())

  // Page thumbnail strip
  const [showPages, setShowPages] = useState(false)

  // Annotation state
  const annotations = useAnnotations()
  const [annotateTool, setAnnotateTool] = useState<AnnotationTool>('pen')
  const [annotateColor, setAnnotateColor] = useState('#e2e8f0')
  const [annotateStrokeWidth, setAnnotateStrokeWidth] = useState(4)

  // Password-protected PDF state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)
  // The password used to open the PDF (so tool panels can pass it to the backend)
  const [pdfPassword, setPdfPassword] = useState<string | null>(null)
  // Preserved copy of the raw bytes — never passed directly to PDF.js so it
  // is never neutered by the worker's structured-clone transfer.
  const pdfBytesRef = useRef<ArrayBuffer | null>(null)

  useEffect(() => {
    if (!id) return
    loadDocument(id)
  }, [id])

  // Clear selection whenever the active tool changes
  useEffect(() => {
    setSelectedPages(new Set())
  }, [activeTool])

  async function loadDocument(docId: string) {
    setLoading(true)
    setError(null)
    setPdfDoc(null)
    try {
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
      // Store an independent copy BEFORE calling PDF.js — getDocument transfers
      // the ArrayBuffer to the worker, neutering the original (byteLength → 0).
      // We slice(0) again on every attempt so retries always get a fresh buffer.
      pdfBytesRef.current = buffer.slice(0)
      await openPdf('')
    } catch {
      setError('Failed to load the document. Is the backend running?')
      addToast('error', 'Could not open document.')
    } finally {
      setLoading(false)
    }
  }

  async function openPdf(password: string) {
    const stored = pdfBytesRef.current
    if (!stored) return
    try {
      // slice(0) creates a fresh transferable copy; the stored ref stays intact
      const doc = await pdfjsLib.getDocument({ data: stored.slice(0), password }).promise
      setPdfDoc(doc)
      setCurrentPage(1)
      setShowPasswordModal(false)
      setWrongPassword(false)
      setPdfPassword(password || null)
    } catch (e: unknown) {
      const pdfErr = e as { name?: string; code?: number }
      if (pdfErr?.name === 'PasswordException') {
        // code 1 = NEED_PASSWORD, code 2 = INCORRECT_PASSWORD
        setWrongPassword(pdfErr.code === 2)
        setShowPasswordModal(true)
      } else {
        setError('Failed to render the document.')
        addToast('error', 'Could not open document.')
      }
    }
  }

  function handlePasswordSubmit(password: string) {
    openPdf(password)
  }

  function handlePasswordCancel() {
    setShowPasswordModal(false)
    setWrongPassword(false)
    navigate('/dashboard')
  }

  function togglePage(n: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  function selectAll() {
    if (!pdfDoc) return
    setSelectedPages(new Set(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)))
  }

  const scalePercent = Math.round(scale * 100)
  const isSelectionMode = activeTool === 'split'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a1520' }}>

      {/* ── Password modal ───────────────────────────────────────────────────── */}
      <PdfPasswordModal
        open={showPasswordModal}
        wrongPassword={wrongPassword}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 border-b"
        style={{ background: '#0d1829', borderColor: 'rgba(255,255,255,0.05)', height: 52 }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="w-px h-5 bg-white/[0.07] shrink-0" />

        <span className="text-sm text-white/80 truncate flex-1 min-w-0">
          {meta?.originalName ?? (loading ? 'Loading…' : 'Document')}
        </span>

        {pdfDoc && (
          <span className="text-xs text-slate-500 shrink-0 tabular-nums">
            {currentPage} / {pdfDoc.numPages}
          </span>
        )}

        <div className="w-px h-5 bg-white/[0.07] shrink-0" />

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

        <div className="w-px h-5 bg-white/[0.07] shrink-0" />

        <button
          onClick={() => setShowPages((v) => !v)}
          disabled={!pdfDoc}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
          style={{
            color: showPages ? '#93c5fd' : undefined,
            background: showPages ? 'rgba(147,197,253,0.1)' : undefined,
          }}
          title="Toggle pages panel"
        >
          <LayoutGrid size={15} className={showPages ? '' : 'text-slate-400 hover:text-white'} />
        </button>
      </header>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Icon sidebar */}
        <WorkspaceToolSidebar activeTool={activeTool} onToolSelect={setActiveTool} />

        {/* Sliding tool panel */}
        <WorkspaceToolPanel toolId={activeTool} onClose={() => setActiveTool(null)}>
          {activeTool === 'split' && id && pdfDoc && (
            <SplitPanel
              docId={id}
              totalPages={pdfDoc.numPages}
              selectedPages={selectedPages}
              onSelectAll={selectAll}
              onClearAll={() => setSelectedPages(new Set())}
              pdfPassword={pdfPassword}
            />
          )}
          {activeTool === 'protect' && id && (
            <ProtectPanel docId={id} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'compress' && id && (
            <CompressPanel docId={id} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'ocr' && id && (
            <OcrPanel docId={id} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'unlock' && id && (
            <UnlockPanel docId={id} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'pdf-to-image' && id && (
            <PdfToImagePanel docId={id} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'word-to-pdf' && id && meta && (
            <WordToPdfPanel docId={id} docName={meta.originalName} />
          )}
          {activeTool === 'image-to-pdf' && id && (
            <ImageToPdfPanel docId={id} />
          )}
          {activeTool === 'merge' && id && meta && (
            <MergePanel docId={id} docName={meta.originalName} pdfPassword={pdfPassword} />
          )}
          {activeTool === 'annotate' && (
            <AnnotatePanel />
          )}
        </WorkspaceToolPanel>

        {/* PDF viewer + thumbnail strip side by side */}
        <div className="flex-1 flex overflow-hidden">
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
              <>
                {/* Floating annotation toolbar */}
                {activeTool === 'annotate' && (
                  <FloatingAnnotateBar
                    tool={annotateTool}
                    onToolChange={setAnnotateTool}
                    color={annotateColor}
                    onColorChange={setAnnotateColor}
                    strokeWidth={annotateStrokeWidth}
                    onStrokeWidthChange={setAnnotateStrokeWidth}
                    onUndo={() => annotations.undo(currentPage)}
                    onClearPage={() => annotations.clearPage(currentPage)}
                  />
                )}
                <PdfViewer
                  pdfDoc={pdfDoc}
                  scale={scale}
                  onPageChange={setCurrentPage}
                  selectionMode={isSelectionMode}
                  selectedPages={selectedPages}
                  onPageClick={togglePage}
                  annotationHandlers={activeTool === 'annotate' ? {
                    tool: annotateTool,
                    color: annotateColor,
                    strokeWidth: annotateStrokeWidth,
                    getPageAnnotations: annotations.getPage,
                    onStrokeComplete: annotations.addStroke,
                    onErase: annotations.eraseAt,
                    onTextAdd: annotations.addText,
                    onTextUpdate: annotations.updateText,
                    onTextDelete: annotations.deleteText,
                  } : undefined}
                />
              </>
            ) : null}
          </div>

          {/* Page thumbnail strip (right side) */}
          {pdfDoc && (
            <PageThumbnailStrip
              pdfDoc={pdfDoc}
              open={showPages}
              currentPage={currentPage}
              selectedPages={isSelectionMode ? selectedPages : undefined}
              onPageClick={(n) => {
                if (isSelectionMode) togglePage(n)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
