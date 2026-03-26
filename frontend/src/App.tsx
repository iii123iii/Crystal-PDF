import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Workspace from './components/layout/Workspace'

export default function App() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  return (
    <div className="flex h-full">
      <Sidebar activeTool={activeTool} onToolSelect={setActiveTool} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header activeTool={activeTool} />
        <Workspace
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          onBack={() => setActiveTool(null)}
        />
      </div>
    </div>
  )
}
