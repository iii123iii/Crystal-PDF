import { useEffect, useState, type ReactNode } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { toolCategories, findTool, findToolCategory } from '../../data/tools'

interface WorkspaceToolPanelProps {
  toolId: string | null
  activeTool: string | null
  onToolSelect: (id: string) => void
  onClose: () => void
  children: ReactNode
  open: boolean
  onToggle: () => void
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

export default function WorkspaceToolPanel({
  toolId,
  activeTool,
  onToolSelect,
  onClose,
  children,
  open,
  onToggle,
}: WorkspaceToolPanelProps) {
  const tool   = findTool(toolId ?? '')
  const cat    = findToolCategory(toolId ?? '')
  const accent = tool?.color ?? 'var(--color-accent)'
  const isMobile = useIsMobile()

  const innerContent = (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        width: isMobile ? undefined : 320,
        background: 'var(--color-surface)',
        borderLeft: isMobile ? 'none' : '1px solid var(--color-border)',
        boxShadow: isMobile ? 'none' : '-4px 0 16px rgba(0,0,0,0.12)',
      }}
    >
      {toolId === null ? (
        /* ── Tool Picker ── */
        <>
          <div
            className="shrink-0 h-11 flex items-center justify-between px-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--color-muted)' }}
            >
              Tools
            </span>
            <button
              onClick={onToggle}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {isMobile ? <X size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {toolCategories.map((cat) => (
              <div key={cat.id} className="mb-1">
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                </div>
                {cat.tools.map((t) => {
                  const Icon = t.icon
                  const isActive = activeTool === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => onToolSelect(t.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: isActive ? `${cat.color}12` : 'transparent',
                        color: isActive ? cat.color : 'var(--color-text)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cat.color}14` }}
                      >
                        <Icon size={14} style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{t.label}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>
                          {t.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
                <div className="mx-4 my-1 h-px" style={{ background: 'var(--color-border)' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── Active Tool Panel ── */
        <>
          <div
            className="shrink-0 h-11 flex items-center justify-between px-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              {cat && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              )}
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: accent, letterSpacing: '0.12em' }}
              >
                {tool?.label ?? 'Tool'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <X size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </>
      )}
    </div>
  )

  /* ── Mobile: bottom sheet overlay ── */
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onToggle}
          />
        )}
        {/* Bottom sheet */}
        <div
          className="fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ease-in-out flex flex-col"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            maxHeight: '80vh',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--color-border)' }}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            {innerContent}
          </div>
        </div>
      </>
    )
  }

  /* ── Desktop: right panel ── */
  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: open ? 320 : 0 }}
    >
      {innerContent}
    </div>
  )
}
