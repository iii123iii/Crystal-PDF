import { toolCategories } from '../../data/tools'

interface WorkspaceToolSidebarProps {
  activeTool: string | null
  onToolSelect: (id: string | null) => void
}

export default function WorkspaceToolSidebar({ activeTool, onToolSelect }: WorkspaceToolSidebarProps) {
  return (
    <aside
      className="w-44 shrink-0 flex flex-col overflow-y-auto py-2"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {toolCategories.map((cat) => (
        <div key={cat.id} className="mb-1">
          {/* Category label */}
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-muted-2)' }}
          >
            {cat.label}
          </div>

          {/* Tool buttons */}
          {cat.tools.map((tool) => {
            const Icon   = tool.icon
            const active = activeTool === tool.id
            return (
              <button
                key={tool.id}
                title={tool.label}
                onClick={() => onToolSelect(active ? null : tool.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left"
                style={{
                  background: active ? `${cat.color}16` : 'transparent',
                  color: active ? cat.color : 'var(--color-muted)',
                  borderLeft: active ? `2px solid ${cat.color}` : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--color-surface-2)'
                    e.currentTarget.style.color = 'var(--color-text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-muted)'
                  }
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span className="truncate">{tool.label}</span>
              </button>
            )
          })}

          {/* Divider */}
          <div
            className="mx-3 my-1"
            style={{ height: '1px', background: 'var(--color-border)' }}
          />
        </div>
      ))}
    </aside>
  )
}
