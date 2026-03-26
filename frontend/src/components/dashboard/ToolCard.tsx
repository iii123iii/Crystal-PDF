import { type Tool } from '../../data/tools'

interface ToolCardProps {
  tool: Tool
  onSelect: (id: string) => void
}

export default function ToolCard({ tool, onSelect }: ToolCardProps) {
  const { id, label, description, icon: Icon, color, borderHover } = tool

  return (
    <button
      onClick={() => onSelect(id)}
      className={`
        group text-left w-full
        bg-slate-800/50 border border-slate-700/60 rounded-xl p-5
        transition-all duration-200
        hover:bg-slate-800 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5
        ${borderHover}
      `}
    >
      <div className={`mb-4 transition-transform duration-200 group-hover:scale-110 inline-block ${color}`}>
        <Icon size={28} strokeWidth={1.75} />
      </div>

      <p className="font-semibold text-white text-sm mb-1">{label}</p>
      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
    </button>
  )
}
