import type { ReactNode } from 'react'
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

export default function WorkspaceToolPanel({
  toolId,
  activeTool,
  onToolSelect,
  onClose,
  children,
  open,
  onToggle,
}: WorkspaceToolPanelProps) {
  const tool = findTool(toolId ?? '')
  const cat  = findToolCategory(toolId ?? '')
  const accent = tool?.color ?? 'var(--color-accent)'

  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: open ? 320 : 0 }}
    >
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: 320,
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
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
                <ChevronRight size={13} />
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
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--color-surface-2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent'
                          }
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
    </div>
  )
}
