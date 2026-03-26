import { ArrowLeft } from 'lucide-react'
import { tools } from '../../data/tools'
import MergeTool from '../tools/MergeTool'
import SplitTool from '../tools/SplitTool'
import ProtectTool from '../tools/ProtectTool'
import UnlockTool from '../tools/UnlockTool'

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
}

export default function ToolView({ toolId, onBack }: ToolViewProps) {
  const tool = tools.find((t) => t.id === toolId)
  if (!tool) return null

  const ToolComponent = toolComponents[toolId]
  const { label, description, icon: Icon, color } = tool

  return (
    <div className="max-w-2xl mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        All Tools
      </button>

      {ToolComponent ? (
        <ToolComponent />
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-8 text-center">
          <div className={`inline-block mb-4 ${color}`}>
            <Icon size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{label}</h2>
          <p className="text-slate-400 text-sm mb-6">{description}</p>
          <span className="inline-block bg-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full">
            Coming in a future phase
          </span>
        </div>
      )}
    </div>
  )
}
