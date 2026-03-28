import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorkspacePage from './pages/WorkspacePage'
import LandingPage from './pages/LandingPage'
import ForcePasswordChangePage from './pages/ForcePasswordChangePage'
import AuthGuard from './components/auth/AuthGuard'
import AdminGuard from './components/auth/AdminGuard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminUsersPage from './components/admin/AdminUsersPage'
import AdminSettingsPage from './components/admin/AdminSettingsPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './components/dashboard/Dashboard'
import MyFiles from './components/dashboard/MyFiles'
import SettingsView from './components/layout/SettingsView'
import ToastContainer from './components/ui/ToastContainer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/force-change-password" element={<ForcePasswordChangePage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Workspace (PDF editor) */}
        <Route
          path="/workspace/:id"
          element={
            <AuthGuard>
              <WorkspacePage />
            </AuthGuard>
          }
        />

        {/* Dashboard with horizontal header */}
        <Route
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/files" element={<MyFiles />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
