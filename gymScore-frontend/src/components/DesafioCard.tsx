import type { Desafio } from '../types'

const STATUS_BORDER: Record<string, string> = {
  aberto: 'border-orange-400',
  pendente: 'border-yellow-400',
  em_andamento: 'border-blue-400',
  encerrado: 'border-green-400',
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  encerrado: 'Encerrado',
}

interface Props {
  desafio: Desafio
  usuarioId?: number
  onAceitar?: (id: number) => void
  onIniciar?: (id: number) => void
  onEncerrar?: (id: number) => void
}

export function DesafioCard({ desafio, usuarioId, onAceitar, onIniciar, onEncerrar }: Props) {
  const borderColor = STATUS_BORDER[desafio.status] ?? 'border-gray-300'
  const isCriador = desafio.id_criador === usuarioId

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 border-l-4 ${borderColor} p-4`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug">
          {desafio.titulo}
        </h3>
        <span className="shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full font-bold text-sm">
          R$ {desafio.valor_aposta.toFixed(2)}
        </span>
      </div>
      {desafio.descricao && (
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 line-clamp-2">
          {desafio.descricao}
        </p>
      )}
      {desafio.local && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
          📍 {desafio.local}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
          {STATUS_LABEL[desafio.status]}
        </span>
        <div className="flex gap-2">
          {desafio.status === 'aberto' && !isCriador && (
            <button
              onClick={() => onAceitar?.(desafio.id)}
              className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-all"
            >
              Aceitar
            </button>
          )}
          {desafio.status === 'pendente' && (
            <button
              onClick={() => onIniciar?.(desafio.id)}
              className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-all"
            >
              Iniciar
            </button>
          )}
          {desafio.status === 'em_andamento' && isCriador && (
            <button
              onClick={() => onEncerrar?.(desafio.id)}
              className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-all"
            >
              Encerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
