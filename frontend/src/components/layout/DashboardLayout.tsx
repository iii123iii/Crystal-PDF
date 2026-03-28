import { Outlet } from 'react-router-dom'
import DashboardHeader from './DashboardHeader'

export default function DashboardLayout() {
  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <main className="flex-1 overflow-auto" style={{ background: 'var(--color-bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
