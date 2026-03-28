import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../dashboard/Dashboard'
import MyFiles from '../dashboard/MyFiles'
import SettingsView from './SettingsView'

export default function Workspace() {
  return (
    <main
      className="flex-1 overflow-auto"
      style={{ background: 'var(--color-bg)' }}
    >
      <Routes>
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/dashboard/files" element={<MyFiles />} />
        <Route path="/settings"        element={<SettingsView />} />
        <Route path="*"                element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  )
}
