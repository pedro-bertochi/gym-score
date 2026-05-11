import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  balanceVisible: boolean
  toggleBalance: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggle: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      balanceVisible: false,
      toggleBalance: () => set((s) => ({ balanceVisible: !s.balanceVisible })),
    }),
    {
      name: 'gymscore-theme',
      version: 1,
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion === 0) {
          return { ...(persisted as object), balanceVisible: false }
        }
        return persisted as ThemeState
      },
    }
  )
)
