import { ArrowLeft } from 'lucide-react'
import { findTool } from '../../data/tools'
import MergeTool from '../tools/MergeTool'
import SplitTool from '../tools/SplitTool'
import ProtectTool from '../tools/ProtectTool'
import UnlockTool from '../tools/UnlockTool'
import WordToPdfTool from '../tools/WordToPdfTool'
import PdfToImageTool from '../tools/PdfToImageTool'
import ImageToPdfTool from '../tools/ImageToPdfTool'
import CompressTool from '../tools/CompressTool'
import OcrTool from '../tools/OcrTool'

interface ToolViewProps {
  toolId: string
  onBack: () => void
}

// Map of implemented tool IDs to their components
const toolComponents: Partial<Record<string, React.ComponentType>> = {
  merge: MergeTool,
  split: SplitTool,
  protect: ProtectTool,
  unlock: UnlockTool,
  'word-to-pdf': WordToPdfTool,
  'pdf-to-image': PdfToImageTool,
  'image-to-pdf': ImageToPdfTool,
  compress: CompressTool,
  ocr: OcrTool,
}

export default function ToolView({ toolId, onBack }: ToolViewProps) {
  const tool = findTool(toolId)
  if (!tool) return null

  const ToolComponent = toolComponents[toolId]
  const { label, description, icon: Icon, color } = tool

  return (
    <div className="max-w-2xl mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
      >
        <ArrowLeft size={15} />
        All Tools
      </button>

      {ToolComponent ? (
        <ToolComponent />
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="inline-block mb-4" style={{ color }}>
            <Icon size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{label}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{description}</p>
          <span
            className="inline-block text-xs px-3 py-1 rounded-full"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            Coming soon
          </span>
        </div>
      )}
    </div>
  )
}
