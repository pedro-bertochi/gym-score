import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { DesafioCard } from '../components/DesafioCard'
import {
  listarDesafiosView,
  aceitarDesafio,
  iniciarDesafio,
  encerrarDesafio,
} from '../api/desafios'
import type { Desafio } from '../types'

type Filtro = 'todos' | 'aberto' | 'pendente' | 'em_andamento' | 'encerrado'

const FILTROS: { label: string; value: Filtro }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abertos', value: 'aberto' },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Encerrados', value: 'encerrado' },
]

interface ModalEncerramento {
  desafio: Desafio
}

export function Desafios() {
  const usuario = useAuthStore((s) => s.usuario)
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [modal, setModal] = useState<ModalEncerramento | null>(null)
  const [idVencedor, setIdVencedor] = useState<string>('')
  const [idPerdedor, setIdPerdedor] = useState<string>('')

  const { data: desafios, isLoading, isError } = useQuery({
    queryKey: ['desafios-view'],
    queryFn: listarDesafiosView,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['desafios-view'] })
    queryClient.invalidateQueries({ queryKey: ['desafios', usuario?.id] })
  }

  const mutAceitar = useMutation({
    mutationFn: (idDesafio: number) =>
      aceitarDesafio({ id_desafio: idDesafio, id_usuario: usuario!.id }),
    onSuccess: invalidar,
  })

  const mutIniciar = useMutation({
    mutationFn: (idDesafio: number) => iniciarDesafio({ id_desafio: idDesafio }),
    onSuccess: invalidar,
  })

  const mutEncerrar = useMutation({
    mutationFn: (payload: { id_desafio: number; id_vencedor: number; id_perdedor: number }) =>
      encerrarDesafio(payload),
    onSuccess: () => {
      invalidar()
      setModal(null)
      setIdVencedor('')
      setIdPerdedor('')
    },
  })

  function handleEncerrar(idDesafio: number) {
    const d = desafios?.find((x) => x.id === idDesafio)
    if (d) {
      setModal({ desafio: d })
      setIdVencedor(String(d.id_criador))
      setIdPerdedor(d.id_participante ? String(d.id_participante) : '')
    }
  }

  function confirmarEncerramento() {
    if (!modal || !idVencedor || !idPerdedor) return
    mutEncerrar.mutate({
      id_desafio: modal.desafio.id,
      id_vencedor: Number(idVencedor),
      id_perdedor: Number(idPerdedor),
    })
  }

  const desafiosFiltrados =
    filtro === 'todos' ? (desafios ?? []) : (desafios ?? []).filter((d) => d.status === filtro)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Desafios</h1>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filtro === f.value
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Estados */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 dark:text-red-400 py-8">
          Erro ao carregar desafios.
        </p>
      )}

      {!isLoading && !isError && desafiosFiltrados.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Nenhum desafio encontrado.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3">
          {desafiosFiltrados.map((d) => (
            <DesafioCard
              key={d.id}
              desafio={d}
              usuarioId={usuario?.id}
              onAceitar={(id) => mutAceitar.mutate(id)}
              onIniciar={(id) => mutIniciar.mutate(id)}
              onEncerrar={handleEncerrar}
            />
          ))}
        </div>
      )}

      {/* Modal encerramento */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Encerrar desafio
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
              {modal.desafio.titulo}
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Vencedor (ID)
                </label>
                <select
                  value={idVencedor}
                  onChange={(e) => setIdVencedor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value={modal.desafio.id_criador}>
                    Criador (ID {modal.desafio.id_criador})
                  </option>
                  {modal.desafio.id_participante && (
                    <option value={modal.desafio.id_participante}>
                      Participante (ID {modal.desafio.id_participante})
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Perdedor (ID)
                </label>
                <select
                  value={idPerdedor}
                  onChange={(e) => setIdPerdedor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  {modal.desafio.id_participante && (
                    <option value={modal.desafio.id_participante}>
                      Participante (ID {modal.desafio.id_participante})
                    </option>
                  )}
                  <option value={modal.desafio.id_criador}>
                    Criador (ID {modal.desafio.id_criador})
                  </option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEncerramento}
                disabled={mutEncerrar.isPending || !idVencedor || !idPerdedor}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-95 transition-all"
              >
                {mutEncerrar.isPending ? 'Encerrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
