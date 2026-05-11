import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login } from '../api/auth'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await login(email, senha)
      setAuth(res.token, res.usuario)
      navigate('/', { replace: true })
    } catch {
      setErro('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
            <svg
              className="h-9 w-9 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">GymScore</h1>
          <p className="text-slate-400 text-sm mt-1">Entre na sua conta</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="text-center text-slate-400 text-sm">
            Não tem conta?{' '}
            <Link to="/register" className="text-orange-400 font-medium">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
