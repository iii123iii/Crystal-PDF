import { tools } from '../../data/tools'

interface HeaderProps {
  activeTool: string | null
}

export default function Header({ activeTool }: HeaderProps) {
  const tool = tools.find((t) => t.id === activeTool)

  return (
    <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-2">
      <span className="text-sm font-medium text-white">Crystal-PDF</span>
      {tool && (
        <>
          <span className="text-slate-600 text-sm">/</span>
          <span className="text-sm text-slate-400">{tool.label}</span>
        </>
      )}
    </header>
  )
}
