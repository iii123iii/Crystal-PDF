import { create } from 'zustand'

interface AppState {
  activeTool: string | null
  setActiveTool: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTool: null,
  setActiveTool: (id) => set({ activeTool: id }),
}))
