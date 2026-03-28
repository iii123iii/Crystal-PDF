import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
  action?: ToastAction
}

interface ToastStore {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string, action?: ToastAction) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, action) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, type, message, action }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 6000)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
