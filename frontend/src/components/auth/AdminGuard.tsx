import { Navigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const userEmail = useAppStore((s) => s.userEmail)
  const isAdmin   = useAppStore((s) => s.isAdmin)

  if (!userEmail) return <Navigate to="/login" replace />
  if (!isAdmin)   return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
