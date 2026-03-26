import { tools } from '../../data/tools'

interface WorkspaceToolSidebarProps {
  activeTool: string | null
  onToolSelect: (id: string | null) => void
}

export default function WorkspaceToolSidebar({ activeTool, onToolSelect }: WorkspaceToolSidebarProps) {
  return (
    <aside className="w-16 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-white/[0.05] bg-[#07101c] overflow-y-auto">
      {tools.map((tool) => {
        const Icon = tool.icon
        const active = activeTool === tool.id
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => onToolSelect(active ? null : tool.id)}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0
              ${active
                ? 'bg-white/[0.08] ' + tool.color
                : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]'}
            `}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </aside>
  )
}
