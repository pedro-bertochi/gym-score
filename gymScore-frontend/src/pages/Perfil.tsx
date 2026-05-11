import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useAuth } from '../hooks/useAuth'
import { PrivacyToggle } from '../components/PrivacyToggle'
import { listarDesafiosUsuario } from '../api/desafios'

const GENERO_LABELS: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' }

function formatarData(d: string) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR')
  } catch {
    return d
  }
}

export function Perfil() {
  const usuario = useAuthStore((s) => s.usuario)
  const { balanceVisible } = useThemeStore()
  const { logout } = useAuth()

  const { data: desafios } = useQuery({
    queryKey: ['desafios', usuario?.id],
    queryFn: () => listarDesafiosUsuario(usuario!.id),
    enabled: !!usuario?.id,
  })

  if (!usuario) return null

  const encerrados = desafios?.filter((d) => d.status === 'encerrado').length ?? 0
  const total = desafios?.length ?? 0

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
        <PrivacyToggle className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" />
      </div>

      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-4 ring-orange-500/30 flex items-center justify-center text-4xl font-bold">
          {usuario.nome.charAt(0).toUpperCase()}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {usuario.nome} {usuario.sobrenome}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {balanceVisible ? usuario.email : `••••••@${usuario.email.split('@')[1]}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-lg font-bold text-orange-500">
            {balanceVisible ? `R$ ${usuario.saldo.toFixed(0)}` : '••••'}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Saldo</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-lg font-bold text-blue-500">{total}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Desafios</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-lg font-bold text-green-500">{encerrados}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Encerrados</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 p-5 mb-6">
        <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-4">
          Informações pessoais
        </h3>
        <dl className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-slate-400">CPF</dt>
            <dd className="font-medium text-gray-800 dark:text-white">
              {balanceVisible ? usuario.cpf : '•••.•••.•••-••'}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-slate-400">Nascimento</dt>
            <dd className="font-medium text-gray-800 dark:text-white">
              {formatarData(usuario.data_nascimento)}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-slate-400">Gênero</dt>
            <dd className="font-medium text-gray-800 dark:text-white">
              {GENERO_LABELS[usuario.genero] ?? usuario.genero}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-slate-400">Membro desde</dt>
            <dd className="font-medium text-gray-800 dark:text-white">
              {formatarData(usuario.criado_em)}
            </dd>
          </div>
        </dl>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
      >
        Sair da conta
      </button>
    </div>
  )
}
