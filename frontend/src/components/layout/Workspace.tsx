import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../dashboard/Dashboard'
import SettingsView from './SettingsView'

export default function Workspace() {
  return (
    <main className="flex-1 overflow-auto" style={{ background: '#0b1422' }}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  )
}
