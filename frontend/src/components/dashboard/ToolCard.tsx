// Legacy ToolCard — kept for compatibility; new tool cards are in Dashboard.tsx
import { type Tool } from '../../data/tools'

interface ToolCardProps {
  tool: Tool
  onSelect: (id: string) => void
}

export default function ToolCard({ tool, onSelect }: ToolCardProps) {
  const { id, label, description, icon: Icon, color } = tool

  return (
    <button
      onClick={() => onSelect(id)}
      className="group text-left w-full rounded-xl p-5 transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="mb-4 inline-block" style={{ color }}>
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{label}</p>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{description}</p>
    </button>
  )
}
