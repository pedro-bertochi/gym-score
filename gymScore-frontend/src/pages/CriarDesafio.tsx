import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { criarDesafio } from '../api/desafios'

export function CriarDesafio() {
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valor_aposta: '',
    local: '',
  })
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoErro, setGeoErro] = useState('')
  const [erro, setErro] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function obterLocalizacao() {
    if (!navigator.geolocation) {
      setGeoErro('Geolocalização não suportada neste dispositivo.')
      return
    }
    setGeoLoading(true)
    setGeoErro('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => {
        setGeoErro('Não foi possível obter a localização.')
        setGeoLoading(false)
      }
    )
  }

  const mutacao = useMutation({
    mutationFn: () =>
      criarDesafio({
        titulo: form.titulo,
        descricao: form.descricao,
        valor_aposta: Number(form.valor_aposta),
        local: form.local,
        id_criador: usuario!.id,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desafios-view'] })
      queryClient.invalidateQueries({ queryKey: ['desafios', usuario?.id] })
      navigate('/desafios')
    },
    onError: () => setErro('Erro ao criar desafio. Tente novamente.'),
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.local.trim()) { setErro('O local é obrigatório.'); return }
    setErro('')
    mutacao.mutate()
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/desafios"
          className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Voltar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo desafio</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Título *
          </label>
          <input
            name="titulo"
            type="text"
            value={form.titulo}
            onChange={handleChange}
            required
            placeholder="Ex: Corrida de 5km"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Descrição
          </label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows={3}
            placeholder="Detalhe o desafio..."
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Valor da aposta (R$) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500 dark:text-slate-400 text-sm font-medium">
              R$
            </span>
            <input
              name="valor_aposta"
              type="number"
              min={1}
              step={0.01}
              value={form.valor_aposta}
              onChange={handleChange}
              required
              placeholder="10,00"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Local *
          </label>
          <div className="flex gap-2">
            <input
              name="local"
              type="text"
              value={form.local}
              onChange={handleChange}
              required
              placeholder="Ex: Academia Brasil, São Paulo"
              className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
            />
            <button
              type="button"
              onClick={obterLocalizacao}
              disabled={geoLoading}
              title="Usar minha localização"
              className="px-3 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
              aria-label="Usar minha localização"
            >
              {geoLoading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {geoErro && <p className="text-xs text-red-500 mt-1">{geoErro}</p>}
          {coords && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Coordenadas capturadas: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </p>
          )}
        </div>
        {erro && <p role="alert" className="text-sm text-red-600 dark:text-red-400 text-center">{erro}</p>}
        <button
          type="submit"
          disabled={mutacao.isPending}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold active:scale-95 transition-all disabled:opacity-60"
        >
          {mutacao.isPending ? 'Criando...' : 'Criar desafio'}
        </button>
      </form>
    </div>
  )
}
