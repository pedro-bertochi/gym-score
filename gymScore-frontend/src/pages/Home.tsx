import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { listarDesafiosUsuario, listarDesafiosView } from '../api/desafios'
import { buscarUsuario } from '../api/usuarios'
import { DesafiosMap } from '../components/DesafiosMap'
import { PrivacyToggle } from '../components/PrivacyToggle'

export function Home() {
  const usuario = useAuthStore((s) => s.usuario)
  const { balanceVisible } = useThemeStore()

  const { data: dadosUsuario, isLoading: loadingUsuario } = useQuery({
    queryKey: ['usuario', usuario?.id],
    queryFn: () => buscarUsuario(usuario!.id),
    enabled: !!usuario?.id,
  })

  const { data: desafios, isLoading: loadingDesafios } = useQuery({
    queryKey: ['desafios', usuario?.id],
    queryFn: () => listarDesafiosUsuario(usuario!.id),
    enabled: !!usuario?.id,
  })

  const { data: todosDesafios } = useQuery({
    queryKey: ['desafios-view'],
    queryFn: listarDesafiosView,
  })

  const desafiosAtivos =
    desafios?.filter((d) => d.status === 'em_andamento' || d.status === 'pendente') ?? []
  const desafiosAbertos = desafios?.filter((d) => d.status === 'aberto') ?? []
  const desafiosEncerrados = desafios?.filter((d) => d.status === 'encerrado') ?? []
  const saldo = dadosUsuario?.saldo ?? usuario?.saldo ?? 0

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header gradiente */}
      <header className="mb-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-orange-100 text-xs font-medium">Bem-vindo de volta</p>
            <h1 className="text-xl font-bold">
              {usuario?.nome} {usuario?.sobrenome}
            </h1>
          </div>
        </div>
      </header>

      {/* Card de saldo */}
      <section aria-label="Saldo" className="bg-orange-500 text-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <p className="text-white/80 text-sm font-medium">Saldo disponível</p>
          </div>
          <PrivacyToggle />
        </div>
        {loadingUsuario ? (
          <div className="h-8 w-32 bg-orange-400 rounded animate-pulse" />
        ) : balanceVisible ? (
          <p className="text-3xl font-bold">R$ {saldo.toFixed(2)}</p>
        ) : (
          <p className="text-3xl font-bold tracking-widest">R$ ••••••</p>
        )}
        <Link
          to="/pix"
          className="inline-block mt-4 px-4 py-2 bg-white text-orange-500 rounded-lg font-semibold text-sm hover:bg-orange-50 active:scale-95 transition-all"
        >
          Depositar via PIX
        </Link>
      </section>

      {/* Stats grid 3 colunas */}
      <section aria-label="Resumo de desafios">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Meus desafios</h2>
          <Link to="/desafios" className="text-sm text-orange-500 font-medium hover:underline">
            Ver todos
          </Link>
        </div>
        {loadingDesafios ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-2xl font-bold text-orange-500">{desafiosAtivos.length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Ativos</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-2xl font-bold text-yellow-500">{desafiosAbertos.length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Aguardando</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-2xl font-bold text-green-500">{desafiosEncerrados.length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Encerrados</p>
            </div>
          </div>
        )}
      </section>

      {/* Mapa */}
      <section aria-label="Mapa de desafios" className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Desafios no mapa
        </h2>
        <DesafiosMap desafios={todosDesafios ?? []} />
      </section>

      {/* FAB */}
      <Link
        to="/desafios/criar"
        className="fixed bottom-20 right-4 h-14 w-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center active:scale-95 transition-all z-40"
        aria-label="Novo desafio"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
