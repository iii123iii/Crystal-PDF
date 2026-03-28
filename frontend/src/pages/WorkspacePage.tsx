import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { PdfViewer } from '../components/workspace/PdfViewer'
import WorkspaceTopBar from '../components/workspace/WorkspaceTopBar'
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
import SanitizePanel from '../components/workspace/panels/SanitizePanel'
import DeletePagesPanel from '../components/workspace/panels/DeletePagesPanel'
import ReorderPanel from '../components/workspace/panels/ReorderPanel'
import WatermarkPanel from '../components/workspace/panels/WatermarkPanel'
import RedactPanel from '../components/workspace/panels/RedactPanel'
import PageNumberPanel from '../components/workspace/panels/PageNumberPanel'
import ExtractTextPanel from '../components/workspace/panels/ExtractTextPanel'
import ExtractImagesPanel from '../components/workspace/panels/ExtractImagesPanel'
import CropPanel from '../components/workspace/panels/CropPanel'
import RepairPanel from '../components/workspace/panels/RepairPanel'
import PdfAPanel from '../components/workspace/panels/PdfAPanel'
import HeaderFooterPanel from '../components/workspace/panels/HeaderFooterPanel'
import StampPanel from '../components/workspace/panels/StampPanel'
import FloatingAnnotateBar from '../components/workspace/annotation/FloatingAnnotateBar'
import { useAnnotations } from '../components/workspace/annotation/useAnnotations'
import type { AnnotationTool } from '../components/workspace/annotation/useAnnotations'
import { useToastStore } from '../store/useToastStore'
import { VisualOrganizer } from '../components/workspace/VisualOrganizer'
import RedactOverlay from '../components/workspace/overlays/RedactOverlay'
import type { RedactArea } from '../components/workspace/overlays/RedactOverlay'
import RedactPreviewOverlay from '../components/workspace/overlays/RedactPreviewOverlay'
import WatermarkOverlay from '../components/workspace/overlays/WatermarkOverlay'
import CropOverlay from '../components/workspace/overlays/CropOverlay'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface DocMeta {
  id: number
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export default function WorkspacePage() {
  const { id }   = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const location  = useLocation()
  const addToast  = useToastStore((s) => s.addToast)

  const [meta, setMeta]             = useState<DocMeta | null>(null)
  const [pdfDoc, setPdfDoc]         = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [scale, setScale]           = useState(1.2)
  const [currentPage, setCurrentPage] = useState(1)

  const initialTool = (location.state as { activeTool?: string } | null)?.activeTool ?? null
  const [activeTool, setActiveTool] = useState<string | null>(initialTool)

  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [showOrganizer, setShowOrganizer]   = useState(false)
  const [showToolPanel, setShowToolPanel]   = useState(true)

  // Redact state (lifted so overlay + panel share it)
  const [redactAreas, setRedactAreas] = useState<RedactArea[]>([])

  // Watermark state (lifted for live preview)
  const [wmText, setWmText]         = useState('CONFIDENTIAL')
  const [wmFontSize, setWmFontSize] = useState(48)
  const [wmOpacity, setWmOpacity]   = useState(0.3)
  const [wmRotation, setWmRotation] = useState(-45)
  const [wmPosition, setWmPosition] = useState('center')

  // Crop state (lifted for visual handles)
  const [cropTop, setCropTop]       = useState(36)
  const [cropRight, setCropRight]   = useState(36)
  const [cropBottom, setCropBottom] = useState(36)
  const [cropLeft, setCropLeft]     = useState(36)

  // Annotation state
  const annotations = useAnnotations()
  const [annotateTool, setAnnotateTool]           = useState<AnnotationTool>('pen')
  const [annotateColor, setAnnotateColor]         = useState('#e2e8f0')
  const [annotateStrokeWidth, setAnnotateStrokeWidth] = useState(4)
  const [savingAnnotations, setSavingAnnotations] = useState(false)

  // Inline rename
  const [renaming, setRenaming]       = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Scroll ref for Ctrl+scroll zoom
  const viewerScrollRef = useRef<HTMLDivElement>(null)

  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingScaleRef = useRef(scale)
  useEffect(() => {
    const el = viewerScrollRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      pendingScaleRef.current = Math.min(Math.max(+(pendingScaleRef.current + delta).toFixed(2), 0.5), 3)
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current)
      zoomTimerRef.current = setTimeout(() => {
        setScale(pendingScaleRef.current)
      }, 80)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Password-protected PDF state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [wrongPassword, setWrongPassword]         = useState(false)
  const [pdfPassword, setPdfPassword]             = useState<string | null>(null)
  const pdfBytesRef = useRef<ArrayBuffer | null>(null)

  useEffect(() => {
    if (!id) return
    loadDocument(id)
  }, [id])

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
      const doc = await pdfjsLib.getDocument({ data: stored.slice(0), password }).promise
      setPdfDoc(doc)
      setCurrentPage(1)
      setShowPasswordModal(false)
      setWrongPassword(false)
      setPdfPassword(password || null)
    } catch (e: unknown) {
      const pdfErr = e as { name?: string; code?: number }
      if (pdfErr?.name === 'PasswordException') {
        setWrongPassword(pdfErr.code === 2)
        setShowPasswordModal(true)
      } else {
        setError('Failed to render the document.')
        addToast('error', 'Could not open document.')
      }
    }
  }

  function handlePasswordSubmit(password: string) { openPdf(password) }

  async function handleSaveAnnotations() {
    if (!id || !pdfDoc) return
    setSavingAnnotations(true)
    try {
      const res = await apiFetch(`/api/documents/${id}/tools/flatten-annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: annotations.pages, scale, sourcePassword: pdfPassword ?? null }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Unknown error')
        addToast('error', `Failed to save: ${msg}`)
        return
      }
      const doc = await res.json() as { id: number; originalName: string }
      annotations.clearAllPages()
      await handleToolSuccess(doc)
    } catch {
      addToast('error', 'Failed to save annotations.')
    } finally {
      setSavingAnnotations(false)
    }
  }

  async function handleRename() {
    const trimmed = renameValue.trim()
    setRenaming(false)
    if (!id || !trimmed || trimmed === meta?.originalName) return
    try {
      const res = await apiFetch(`/api/documents/${id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        const doc = await res.json() as { originalName: string }
        setMeta((prev) => prev ? { ...prev, originalName: doc.originalName } : prev)
      }
    } catch { /* best effort */ }
  }

  async function handleToolSuccess(newDoc: { id: number; originalName: string }) {
    if (!id) return
    try {
      const res = await apiFetch(`/api/documents/${id}/tools/overwrite-with/${newDoc.id}`, { method: 'POST' })
      if (!res.ok) { addToast('error', 'Failed to save changes to document.'); return }
      addToast('success', 'Document saved.')
      // Clear redaction areas after successful application
      if (activeTool === 'redact') setRedactAreas([])
      setActiveTool(null)
      await loadDocument(id)
    } catch {
      addToast('error', 'Failed to save changes to document.')
    }
  }

  function handlePasswordCancel() {
    setShowPasswordModal(false)
    setWrongPassword(false)
    navigate('/dashboard')
  }

  function togglePage(n: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
  }

  function selectAll() {
    if (!pdfDoc) return
    setSelectedPages(new Set(Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)))
  }

  async function handleDownload() {
    if (!id || !meta) return
    try {
      const res = await apiFetch(`/api/documents/${id}/download`)
      if (!res.ok) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = meta.originalName; a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const isSelectionMode = activeTool === 'split' || activeTool === 'delete-pages'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Password modal */}
      <PdfPasswordModal
        open={showPasswordModal}
        wrongPassword={wrongPassword}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />

      {/* ── Acrobat-style top bar ── */}
      <WorkspaceTopBar
        docName={meta?.originalName ?? null}
        loading={loading}
        currentPage={currentPage}
        totalPages={pdfDoc?.numPages ?? 0}
        scale={scale}
        showThumbnails={showThumbnails}
        showOrganizer={showOrganizer}
        showToolPanel={showToolPanel}
        activeTool={activeTool}
        renaming={renaming}
        renameValue={renameValue}
        onBack={() => navigate('/dashboard')}
        onPageChange={setCurrentPage}
        onScaleChange={setScale}
        onToggleThumbnails={() => setShowThumbnails((v) => !v)}
        onToggleOrganizer={() => setShowOrganizer((v) => !v)}
        onToggleToolPanel={() => setShowToolPanel((v) => !v)}
        onDownload={handleDownload}
        onRenameStart={() => {
          if (!meta) return
          setRenameValue(meta.originalName)
          setRenaming(true)
        }}
        onRenameChange={setRenameValue}
        onRenameSubmit={handleRename}
        onRenameCancel={() => setRenaming(false)}
      />

      {/* ── Main area ── */}
      {showOrganizer ? (
        <VisualOrganizer
          pdfDoc={pdfDoc!}
          documentId={id!}
          pdfPassword={pdfPassword}
          onClose={() => setShowOrganizer(false)}
          onSaved={async () => { setShowOrganizer(false); await loadDocument(id!) }}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Page thumbnails (Acrobat-style) */}
          {pdfDoc && (
            <PageThumbnailStrip
              pdfDoc={pdfDoc}
              open={showThumbnails}
              currentPage={currentPage}
              selectedPages={isSelectionMode ? selectedPages : undefined}
              onPageClick={(n) => { if (isSelectionMode) togglePage(n) }}
              onToggle={() => setShowThumbnails((v) => !v)}
            />
          )}

          {/* CENTER: PDF viewer */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Floating annotation bar — positioned above the scroll area */}
            {activeTool === 'annotate' && pdfDoc && (
              <div className="shrink-0" style={{ zIndex: 20 }}>
                <FloatingAnnotateBar
                  tool={annotateTool}
                  onToolChange={setAnnotateTool}
                  color={annotateColor}
                  onColorChange={setAnnotateColor}
                  strokeWidth={annotateStrokeWidth}
                  onStrokeWidthChange={setAnnotateStrokeWidth}
                  onUndo={() => annotations.undo(currentPage)}
                  onClearPage={() => annotations.clearPage(currentPage)}
                  onSave={handleSaveAnnotations}
                  saving={savingAnnotations}
                />
              </div>
            )}
            <div
              ref={viewerScrollRef}
              className="flex-1 overflow-auto"
              style={{ background: 'var(--color-bg)' }}
            >
            {loading ? (
              <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--color-muted)' }}>
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading document...</span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} style={{ color: 'var(--color-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{error}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-2 text-sm transition-colors"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Return to dashboard
                </button>
              </div>
            ) : pdfDoc ? (
              <>
                <PdfViewer
                  pdfDoc={pdfDoc}
                  scale={scale}
                  currentPage={currentPage}
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
                  pageOverlay={
                    activeTool === 'redact'
                      ? (pageNum, w, h) => (
                          <RedactOverlay
                            pageNum={pageNum}
                            pageWidth={w}
                            pageHeight={h}
                            areas={redactAreas}
                            onAddArea={(area) => setRedactAreas(prev => [...prev, area])}
                            onRemoveArea={(idx) => setRedactAreas(prev => prev.filter((_, i) => i !== idx))}
                          />
                        )
                    : activeTool === 'watermark'
                      ? (_pageNum, w, h) => (
                          <>
                            {/* Redactions as background overlay (read-only) */}
                            {redactAreas.length > 0 && (
                              <RedactPreviewOverlay pageNum={_pageNum} pageWidth={w} pageHeight={h} areas={redactAreas} />
                            )}
                            <WatermarkOverlay
                              pageWidth={w}
                              pageHeight={h}
                              text={wmText}
                              fontSize={wmFontSize}
                              opacity={wmOpacity}
                              rotation={wmRotation}
                              position={wmPosition}
                            />
                          </>
                        )
                    : activeTool === 'crop'
                      ? (_pageNum, w, h) => (
                          <>
                            {/* Redactions as background overlay (read-only) */}
                            {redactAreas.length > 0 && (
                              <RedactPreviewOverlay pageNum={_pageNum} pageWidth={w} pageHeight={h} areas={redactAreas} />
                            )}
                            <CropOverlay
                              pageWidth={w}
                              pageHeight={h}
                              top={cropTop}
                              right={cropRight}
                              bottom={cropBottom}
                              left={cropLeft}
                              onTopChange={setCropTop}
                              onRightChange={setCropRight}
                              onBottomChange={setCropBottom}
                              onLeftChange={setCropLeft}
                            />
                          </>
                        )
                    : redactAreas.length > 0
                      ? (pageNum, w, h) => (
                          <RedactPreviewOverlay pageNum={pageNum} pageWidth={w} pageHeight={h} areas={redactAreas} />
                        )
                    : undefined
                  }
                />
              </>
            ) : null}
          </div>
          </div>

          {/* RIGHT: Tool panel (tool picker when idle, tool options when active) */}
          <WorkspaceToolPanel
            toolId={activeTool}
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            onClose={() => setActiveTool(null)}
            open={showToolPanel}
            onToggle={() => setShowToolPanel((v) => !v)}
          >
            {activeTool === 'split' && id && pdfDoc && (
              <SplitPanel
                docId={id}
                totalPages={pdfDoc.numPages}
                selectedPages={selectedPages}
                onSelectAll={selectAll}
                onClearAll={() => setSelectedPages(new Set())}
                pdfPassword={pdfPassword}
                onSuccess={handleToolSuccess}
              />
            )}
            {activeTool === 'protect' && id && (
              <ProtectPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'compress' && id && (
              <CompressPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'ocr' && id && (
              <OcrPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'unlock' && id && (
              <UnlockPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
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
              <MergePanel docId={id} docName={meta.originalName} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'annotate' && (
              <AnnotatePanel />
            )}
            {activeTool === 'sanitize' && id && (
              <SanitizePanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'delete-pages' && id && pdfDoc && (
              <DeletePagesPanel
                docId={id}
                totalPages={pdfDoc.numPages}
                selectedPages={selectedPages}
                onSelectAll={selectAll}
                onClearAll={() => setSelectedPages(new Set())}
                pdfPassword={pdfPassword}
                onSuccess={handleToolSuccess}
              />
            )}
            {activeTool === 'reorder' && (
              <ReorderPanel onOpenOrganizer={() => { setActiveTool(null); setShowOrganizer(true) }} />
            )}
            {activeTool === 'watermark' && id && (
              <WatermarkPanel
                docId={id} pdfPassword={pdfPassword}
                text={wmText} fontSize={wmFontSize} opacity={wmOpacity} rotation={wmRotation} position={wmPosition}
                onTextChange={setWmText} onFontSizeChange={setWmFontSize} onOpacityChange={setWmOpacity}
                onRotationChange={setWmRotation} onPositionChange={setWmPosition}
                onSuccess={handleToolSuccess}
              />
            )}
            {activeTool === 'redact' && id && pdfDoc && (
              <RedactPanel
                docId={id} totalPages={pdfDoc.numPages} pdfPassword={pdfPassword}
                areas={redactAreas}
                onRemoveArea={(idx) => setRedactAreas(prev => prev.filter((_, i) => i !== idx))}
                onSuccess={handleToolSuccess}
              />
            )}
            {activeTool === 'page-numbers' && id && (
              <PageNumberPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'extract-text' && id && (
              <ExtractTextPanel docId={id} pdfPassword={pdfPassword} />
            )}
            {activeTool === 'extract-images' && id && (
              <ExtractImagesPanel docId={id} pdfPassword={pdfPassword} />
            )}
            {activeTool === 'crop' && id && (
              <CropPanel
                docId={id} pdfPassword={pdfPassword}
                top={cropTop} right={cropRight} bottom={cropBottom} left={cropLeft}
                onTopChange={setCropTop} onRightChange={setCropRight}
                onBottomChange={setCropBottom} onLeftChange={setCropLeft}
                onSuccess={handleToolSuccess}
              />
            )}
            {activeTool === 'repair' && id && (
              <RepairPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'pdfa' && id && (
              <PdfAPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'header-footer' && id && (
              <HeaderFooterPanel docId={id} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
            {activeTool === 'stamp' && id && pdfDoc && (
              <StampPanel docId={id} totalPages={pdfDoc.numPages} pdfPassword={pdfPassword} onSuccess={handleToolSuccess} />
            )}
          </WorkspaceToolPanel>
        </div>
      )}
    </div>
  )
}
