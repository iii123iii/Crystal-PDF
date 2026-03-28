import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface AppState {
  activeTool: string | null
  setActiveTool: (id: string | null) => void

  // Auth — token lives in HttpOnly cookie; only email stored here for UI
  userEmail: string | null
  isAdmin: boolean
  passwordChangeRequired: boolean
  setAuth: (email: string, isAdmin: boolean, passwordChangeRequired: boolean) => void
  clearAuth: () => void

  // Theme
  theme: Theme
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTool: null,
      setActiveTool: (id) => set({ activeTool: id }),

      userEmail: null,
      isAdmin: false,
      passwordChangeRequired: false,
      setAuth: (email, isAdmin, passwordChangeRequired) =>
        set({ userEmail: email, isAdmin, passwordChangeRequired }),
      clearAuth: () => set({ userEmail: null, isAdmin: false, passwordChangeRequired: false }),

      theme: 'dark',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('light', next === 'light')
          return { theme: next }
        }),
    }),
    {
      name: 'crystalpdf-session',
      partialize: (state) => ({
        userEmail: state.userEmail,
        isAdmin: state.isAdmin,
        passwordChangeRequired: state.passwordChangeRequired,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply saved theme class on load
        if (state?.theme === 'light') {
          document.documentElement.classList.add('light')
        }
      },
    },
  ),
)
