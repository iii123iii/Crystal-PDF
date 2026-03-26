import { useState } from 'react'
import { Search } from 'lucide-react'
import { tools } from '../../data/tools'
import ToolCard from './ToolCard'

interface DashboardProps {
  onToolSelect: (id: string) => void
}

export default function Dashboard({ onToolSelect }: DashboardProps) {
  const [query, setQuery] = useState('')

  const filtered = tools.filter(
    (t) =>
      t.label.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Page heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">All Tools</h2>
        <p className="text-slate-400 text-sm">Select a tool to get started.</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="
            w-full bg-slate-800/60 border border-slate-700/60 rounded-xl
            pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40
            transition-colors
          "
        />
      </div>

      {/* Tool grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onSelect={onToolSelect} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm text-center py-16">
          No tools match "<span className="text-slate-300">{query}</span>".
        </p>
      )}
    </div>
  )
}
