import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '../types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  setAuth: (token: string, usuario: Usuario) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      clearAuth: () => set({ token: null, usuario: null }),
    }),
    { name: 'gymscore-auth' }
  )
)
