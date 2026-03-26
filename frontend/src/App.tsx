import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthGuard from './components/auth/AuthGuard'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Workspace from './components/layout/Workspace'
import ToastContainer from './components/ui/ToastContainer'

function MainLayout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <Workspace />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
