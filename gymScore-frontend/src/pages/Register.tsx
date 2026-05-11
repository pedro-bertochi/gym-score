import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { register } from '../api/auth'

export function Register() {
  const [form, setForm] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    data_nascimento: '',
    genero: 'M',
    senha: '',
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await register(form)
      setAuth(res.token, res.usuario)
      navigate('/', { replace: true })
    } catch {
      setErro('Erro ao criar conta. Verifique os dados e tente novamente.')
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
          <p className="text-slate-400 text-sm mt-1">Crie sua conta</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              name="nome"
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              name="sobrenome"
              type="text"
              placeholder="Sobrenome"
              value={form.sobrenome}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            name="cpf"
            type="text"
            placeholder="CPF (somente números)"
            value={form.cpf}
            onChange={handleChange}
            required
            maxLength={11}
            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div>
            <label className="block text-slate-400 text-xs mb-1">Data de nascimento</label>
            <input
              name="data_nascimento"
              type="date"
              value={form.data_nascimento}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Gênero</label>
            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-white/20 rounded-lg py-3 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          <input
            name="senha"
            type="password"
            placeholder="Senha"
            value={form.senha}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
          <p className="text-center text-slate-400 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-orange-400 font-medium">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
