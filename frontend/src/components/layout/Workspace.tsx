import { type ReactNode } from 'react'

interface WorkspaceProps {
  children?: ReactNode
}

export default function Workspace({ children }: WorkspaceProps) {
  return (
    <main className="flex-1 overflow-auto p-8">
      {children ?? (
        <div className="flex h-full items-center justify-center text-gray-600 text-sm">
          Select a tool from the sidebar to get started.
        </div>
      )}
    </main>
  )
}
