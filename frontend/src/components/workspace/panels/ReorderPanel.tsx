import { ArrowUpDown, Grid3x3 } from 'lucide-react'

interface ReorderPanelProps {
  onOpenOrganizer: () => void
}

export default function ReorderPanel({ onOpenOrganizer }: ReorderPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <div
        className="rounded-xl p-4 text-center space-y-3"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Grid3x3 size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Page Organizer
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Drag to reorder, rotate, or delete pages in a visual grid view.
          </p>
        </div>
      </div>

      <button
        onClick={onOpenOrganizer}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        <ArrowUpDown size={14} />
        Open Organizer
      </button>
    </div>
  )
}
