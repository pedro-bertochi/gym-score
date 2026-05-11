import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const logout = useCallback(() => {
    clearAuth()
    navigate('/login', { replace: true })
  }, [clearAuth, navigate])

  return { logout }
}
