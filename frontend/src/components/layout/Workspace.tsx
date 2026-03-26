import { useAppStore } from '../../store/useAppStore'
import Dashboard from '../dashboard/Dashboard'
import ToolView from '../dashboard/ToolView'

export default function Workspace() {
  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)

  return (
    <main className="flex-1 overflow-auto p-8">
      {activeTool ? (
        <ToolView toolId={activeTool} onBack={() => setActiveTool(null)} />
      ) : (
        <Dashboard onToolSelect={setActiveTool} />
      )}
    </main>
  )
}
