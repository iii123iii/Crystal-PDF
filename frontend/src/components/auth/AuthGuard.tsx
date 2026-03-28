import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const userEmail = useAppStore((s) => s.userEmail)
  const location = useLocation()

  if (!userEmail) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
