import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorkspacePage from './pages/WorkspacePage'
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
        {/* Workspace must be declared before /* so it isn't eaten by the catch-all */}
        <Route
          path="/workspace/:id"
          element={
            <AuthGuard>
              <WorkspacePage />
            </AuthGuard>
          }
        />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
