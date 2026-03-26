import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const token = useAppStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
