import Dashboard from '../dashboard/Dashboard'
import ToolView from '../dashboard/ToolView'

interface WorkspaceProps {
  activeTool: string | null
  onToolSelect: (id: string) => void
  onBack: () => void
}

export default function Workspace({ activeTool, onToolSelect, onBack }: WorkspaceProps) {
  return (
    <main className="flex-1 overflow-auto p-8">
      {activeTool ? (
        <ToolView toolId={activeTool} onBack={onBack} />
      ) : (
        <Dashboard onToolSelect={onToolSelect} />
      )}
    </main>
  )
}
