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
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
            color: 'var(--color-text)',
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            : <XCircle size={16} className="text-red-400 shrink-0" />
          }
          <span className="flex-1">{toast.message}</span>

          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); removeToast(toast.id) }}
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{
                color: '#93c5fd',
                background: 'rgba(147,197,253,0.12)',
                border: '1px solid rgba(147,197,253,0.25)',
              }}
            >
              {toast.action.label}
            </button>
          )}

          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
