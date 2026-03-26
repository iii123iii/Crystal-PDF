import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { tools } from '../../data/tools'

interface WorkspaceToolPanelProps {
  toolId: string | null
  onClose: () => void
  children: ReactNode
}

export default function WorkspaceToolPanel({ toolId, onClose, children }: WorkspaceToolPanelProps) {
  const tool = tools.find((t) => t.id === toolId)
  const open = toolId !== null

  // Accent colour per tool, as a CSS hex so we can use it inline
  const accentMap: Record<string, string> = {
    merge:        '#60a5fa',
    split:        '#a78bfa',
    compress:     '#34d399',
    ocr:          '#fb923c',
    'pdf-to-image': '#22d3ee',
    'image-to-pdf': '#f472b6',
    'word-to-pdf':  '#818cf8',
    protect:      '#f87171',
    unlock:       '#fbbf24',
  }
  const accent = toolId ? (accentMap[toolId] ?? '#60a5fa') : '#60a5fa'

  return (
    <div
      className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: open ? 288 : 0 }}
    >
      <div
        className="w-72 h-full flex flex-col border-r overflow-hidden"
        style={{
          background: '#0b1929',
          borderColor: 'rgba(255,255,255,0.05)',
          borderLeft: `2px solid ${accent}22`,
        }}
      >
        {/* Panel header */}
        <div
          className="shrink-0 h-11 flex items-center justify-between px-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            {tool && (
              <>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accent }}
                />
                <span
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: accent, letterSpacing: '0.12em' }}
                >
                  {tool.label}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
