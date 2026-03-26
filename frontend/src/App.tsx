import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Workspace from './components/layout/Workspace'
import ToastContainer from './components/ui/ToastContainer'

export default function App() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <Workspace />
      </div>
      <ToastContainer />
    </div>
  )
}
