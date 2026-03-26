import { useToastStore } from '../../store/useToastStore'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
            pointer-events-auto animate-in slide-in-from-right-4 duration-200
            ${toast.type === 'success'
              ? 'bg-slate-800 border-green-500/40 text-white'
              : 'bg-slate-800 border-red-500/40 text-white'
            }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            : <XCircle size={16} className="text-red-400 shrink-0" />
          }
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
