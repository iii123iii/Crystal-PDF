import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { tools } from '../../data/tools'
import { useAppStore } from '../../store/useAppStore'

export default function Header() {
  const activeTool = useAppStore((s) => s.activeTool)
  const userEmail = useAppStore((s) => s.userEmail)
  const clearAuth = useAppStore((s) => s.clearAuth)
  const tool = tools.find((t) => t.id === activeTool)
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-2">
      <span className="text-sm font-medium text-white">Crystal-PDF</span>
      {tool && (
        <>
          <span className="text-slate-600 text-sm">/</span>
          <span className="text-sm text-slate-400">{tool.label}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-4">
        {userEmail && (
          <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>
        )}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
