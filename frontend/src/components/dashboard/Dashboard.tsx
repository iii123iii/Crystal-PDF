import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, Loader2, Search, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useToastStore } from '../../store/useToastStore'
import { toolCategories, type Tool } from '../../data/tools'

export default function Dashboard() {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [query, setQuery]         = useState('')
  const [pendingTool, setPendingTool] = useState<Tool | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)
  const navigate = useNavigate()

  async function uploadAndOpen(fileList: FileList | null, tool?: Tool) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    const file = fileList[0]
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await apiFetch('/api/documents/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const doc = await res.json() as { id: number }
        addToast('success', `"${file.name}" uploaded`)
        navigate(`/workspace/${doc.id}`, { state: { activeTool: tool?.id ?? null } })
      } else {
        addToast('error', 'Upload failed.')
      }
    } catch {
      addToast('error', 'Cannot reach the server.')
    } finally {
      setUploading(false)
      setPendingTool(null)
    }
  }

  function handleToolClick(tool: Tool) {
    setPendingTool(tool)
    inputRef.current?.click()
  }

  function handleToolDrop(e: React.DragEvent, tool: Tool) {
    e.preventDefault()
    e.stopPropagation()
    uploadAndOpen(e.dataTransfer.files, tool)
  }

  const q = query.trim().toLowerCase()
  const filteredCategories = q
    ? toolCategories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter(
            (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
          ),
        }))
        .filter((cat) => cat.tools.length > 0)
    : toolCategories

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-8 w-full">

      {/* ── Hero upload zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); uploadAndOpen(e.dataTransfer.files) }}
        onClick={() => { setPendingTool(null); inputRef.current?.click() }}
        className="mb-8 flex flex-col items-center justify-center gap-3 rounded-xl p-6 sm:p-10 cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
          background: dragging ? 'var(--color-accent-muted)' : 'var(--color-surface)',
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Uploading...</p>
          </>
        ) : (
          <>
            <UploadCloud size={32} style={{ color: dragging ? 'var(--color-accent)' : 'var(--color-muted)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {dragging ? 'Drop to upload' : 'Upload a PDF to get started'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Drag & drop or <span style={{ color: 'var(--color-accent)' }}>browse files</span>
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { uploadAndOpen(e.target.files, pendingTool ?? undefined); e.target.value = '' }}
        />
      </div>

      {/* ── Full-width search ── */}
      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full pl-11 pr-10 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Tool categories ── */}
      <div className="space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No tools match "{query}"</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="cat-section scroll-mt-6">
              {/* Category header */}
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: cat.color }}>
                  {cat.label}
                </h2>
                <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {cat.tools.length} tool{cat.tools.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tool cards — larger, 3-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    categoryColor={cat.color}
                    onClick={() => handleToolClick(tool)}
                    onDrop={(e) => handleToolDrop(e, tool)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Tool card — larger, with drag-drop ──────────────────────────────────────

interface ToolCardProps {
  tool: Tool
  categoryColor: string
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
}

function ToolCard({ tool, categoryColor, onClick, onDrop }: ToolCardProps) {
  const Icon = tool.icon
  const [drop, setDrop] = useState(false)

  return (
    <button
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDrop(true) }}
      onDragLeave={() => setDrop(false)}
      onDrop={(e) => { setDrop(false); onDrop(e) }}
      className="tool-card group text-left rounded-xl p-5 flex items-start gap-4 outline-none focus-visible:ring-2"
      style={{
        background: drop ? `${categoryColor}14` : 'var(--color-surface)',
        border: `1px solid ${drop ? categoryColor : 'var(--color-border)'}`,
        '--tw-ring-color': categoryColor,
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!drop) {
          e.currentTarget.style.borderColor = `${categoryColor}80`
          e.currentTarget.style.background = `${categoryColor}08`
        }
      }}
      onMouseLeave={(e) => {
        if (!drop) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.background = 'var(--color-surface)'
        }
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${categoryColor}14` }}
      >
        <Icon size={20} style={{ color: categoryColor }} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {tool.label}
        </p>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {tool.description}
        </p>
      </div>
    </button>
  )
}
