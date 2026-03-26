import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // ── Active tool (dashboard navigation) ───────────────────────────────────
  activeTool: string | null
  setActiveTool: (id: string | null) => void

  // ── Auth ──────────────────────────────────────────────────────────────────
  token: string | null
  userEmail: string | null
  setAuth: (token: string, email: string) => void
  clearAuth: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTool: null,
      setActiveTool: (id) => set({ activeTool: id }),

      token: null,
      userEmail: null,
      setAuth: (token, email) => set({ token, userEmail: email }),
      clearAuth: () => set({ token: null, userEmail: null }),
    }),
    {
      name: 'crystalpdf-session',
      // Only persist auth fields — activeTool resets on each session
      partialize: (state) => ({ token: state.token, userEmail: state.userEmail }),
    },
  ),
)
