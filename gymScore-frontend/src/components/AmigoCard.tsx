import type { Amizade, Usuario } from '../types'

interface Props {
  amizade: Amizade
  usuarioAtual?: number
  onAceitar?: (id: number) => void
}

export function AmigoCard({ amizade, usuarioAtual, onAceitar }: Props) {
  const outro: Usuario | undefined =
    amizade.id_usuario1 === usuarioAtual ? amizade.usuario2 : amizade.usuario1

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center font-bold">
        {outro?.nome?.charAt(0).toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {outro?.nome} {outro?.sobrenome}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {amizade.status === 'pendente' ? 'Solicitação pendente' : 'Amigo'}
        </p>
      </div>
      {amizade.status === 'pendente' && amizade.id_usuario2 === usuarioAtual && (
        <button
          onClick={() => onAceitar?.(amizade.id)}
          className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg"
        >
          Aceitar
        </button>
      )}
    </div>
  )
}
