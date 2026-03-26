import { LayoutGrid } from 'lucide-react'
import { tools } from '../../data/tools'

interface SidebarProps {
  activeTool: string | null
  onToolSelect: (id: string | null) => void
}

export default function Sidebar({ activeTool, onToolSelect }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col py-4">
      <div className="px-4 mb-6">
        <span className="text-xl font-bold tracking-tight text-white">Crystal-PDF</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {/* All Tools home */}
        <button
          onClick={() => onToolSelect(null)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left
            ${activeTool === null
              ? 'bg-slate-700/60 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
          `}
        >
          <LayoutGrid size={16} />
          All Tools
        </button>

        <div className="my-2 border-t border-slate-800" />

        {tools.map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            onClick={() => onToolSelect(id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left
              ${activeTool === id
                ? 'bg-slate-700/60 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <Icon size={16} className={activeTool === id ? color : ''} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
