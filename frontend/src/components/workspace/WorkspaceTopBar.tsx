import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  Grid3x3,
  Download,
  Check,
  PanelRight,
} from 'lucide-react'

interface WorkspaceTopBarProps {
  docName: string | null
  loading: boolean
  currentPage: number
  totalPages: number
  scale: number
  showThumbnails: boolean
  showOrganizer: boolean
  showToolPanel: boolean
  activeTool: string | null
  renaming: boolean
  renameValue: string
  onBack: () => void
  onPageChange: (page: number) => void
  onScaleChange: (scale: number) => void
  onToggleThumbnails: () => void
  onToggleOrganizer: () => void
  onToggleToolPanel: () => void
  onDownload: () => void
  onRenameStart: () => void
  onRenameChange: (val: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
}

export default function WorkspaceTopBar({
  docName,
  loading,
  currentPage,
  totalPages,
  scale,
  showThumbnails,
  showOrganizer,
  showToolPanel,
  renaming,
  renameValue,
  onBack,
  onPageChange,
  onScaleChange,
  onToggleThumbnails,
  onToggleOrganizer,
  onToggleToolPanel,
  onDownload,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: WorkspaceTopBarProps) {
  const scalePercent = Math.round(scale * 100)

  return (
    <header
      className="shrink-0 flex items-center px-3 select-none"
      style={{
        height: 52,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      {/* ── LEFT: Back, name, page badge ── */}
      <div className="flex items-center gap-2 min-w-0 mr-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-2)'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
          title="Back to dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="w-px h-5 shrink-0" style={{ background: 'var(--color-border)' }} />

        {/* Document name */}
        {renaming ? (
          <form
            className="flex items-center gap-1.5 min-w-0 max-w-[240px]"
            onSubmit={(e) => { e.preventDefault(); onRenameSubmit() }}
          >
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onRenameSubmit}
              onKeyDown={(e) => { if (e.key === 'Escape') onRenameCancel() }}
              className="text-sm bg-transparent outline-none min-w-0 py-0.5 border-b"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-accent)', caretColor: 'var(--color-accent)' }}
            />
            <button type="submit" style={{ color: 'var(--color-accent)' }}>
              <Check size={13} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <span
            className="text-sm font-medium truncate max-w-[220px] cursor-pointer transition-colors"
            style={{ color: 'var(--color-text)' }}
            onClick={onRenameStart}
            title="Click to rename"
          >
            {docName ?? (loading ? 'Loading...' : 'Document')}
          </span>
        )}

        {/* Page count badge */}
        {totalPages > 0 && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}
          >
            {totalPages} pg{totalPages !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── CENTER: Page nav + Zoom ── */}
      <div className="flex-1 flex items-center justify-center gap-3">
        {/* Page navigation */}
        {totalPages > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={currentPage}
                onChange={(e) => {
                  const n = parseInt(e.target.value)
                  if (n >= 1 && n <= totalPages) onPageChange(n)
                }}
                className="w-10 text-center text-xs font-mono py-1 rounded"
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--color-muted-2)' }}>/</span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{totalPages}</span>
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: 'var(--color-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Vertical separator */}
        <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onScaleChange(Math.max(scale - 0.25, 0.5))}
            disabled={scale <= 0.5}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <ZoomOut size={14} />
          </button>

          <span
            className="text-xs w-12 text-center font-mono select-none"
            style={{ color: 'var(--color-muted)' }}
          >
            {scalePercent}%
          </span>

          <button
            onClick={() => onScaleChange(Math.min(scale + 0.25, 3))}
            disabled={scale >= 3}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={() => onScaleChange(1.0)}
            className="h-7 px-2 rounded text-xs font-medium transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-2)'
              e.currentTarget.style.color = 'var(--color-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted)'
            }}
            title="Fit to width"
          >
            <Maximize size={13} />
          </button>
        </div>
      </div>

      {/* ── RIGHT: View toggles + Download ── */}
      <div className="flex items-center gap-1.5 ml-4">
        {/* View toggle buttons */}
        {[
          { icon: LayoutGrid, active: showThumbnails, onClick: onToggleThumbnails, title: 'Page thumbnails' },
          { icon: Grid3x3, active: showOrganizer, onClick: onToggleOrganizer, title: 'Page organizer' },
          { icon: PanelRight, active: showToolPanel, onClick: onToggleToolPanel, title: 'Tool panel' },
        ].map(({ icon: Icon, active, onClick, title }) => (
          <button
            key={title}
            onClick={onClick}
            disabled={totalPages === 0}
            title={title}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
            style={{
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
              background: active ? 'var(--color-accent-muted)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--color-surface-2)'
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent'
            }}
          >
            <Icon size={15} />
          </button>
        ))}

        <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

        {/* Download button */}
        <button
          onClick={onDownload}
          disabled={!docName}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 shrink-0"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
          title="Download PDF"
        >
          <Download size={13} />
          <span>Download</span>
        </button>
      </div>
    </header>
  )
}
