import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { AmigoCard } from '../components/AmigoCard'
import { listarAmizades, enviarSolicitacao, aceitarAmizade } from '../api/amizades'

export function Amigos() {
  const usuario = useAuthStore((s) => s.usuario)
  const queryClient = useQueryClient()
  const [novoId, setNovoId] = useState('')
  const [addErro, setAddErro] = useState('')

  const { data: amizades, isLoading, isError } = useQuery({
    queryKey: ['amizades', usuario?.id],
    queryFn: () => listarAmizades(usuario!.id),
    enabled: !!usuario?.id,
  })

  const mutEnviar = useMutation({
    mutationFn: () =>
      enviarSolicitacao({ id_usuario1: usuario!.id, id_usuario2: Number(novoId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amizades', usuario?.id] })
      setNovoId('')
      setAddErro('')
    },
    onError: () => setAddErro('Não foi possível enviar a solicitação. Verifique o ID.'),
  })

  const mutAceitar = useMutation({
    mutationFn: (idAmizade: number) =>
      aceitarAmizade({ id_amizade: idAmizade, id_usuario: usuario!.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['amizades', usuario?.id] }),
  })

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoId || isNaN(Number(novoId))) {
      setAddErro('Digite um ID válido.')
      return
    }
    setAddErro('')
    mutEnviar.mutate()
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Amigos</h1>

      {/* Adicionar amigo */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">
          Adicionar por ID
        </h2>
        <form onSubmit={handleEnviar} className="flex gap-2">
          <input
            type="number"
            value={novoId}
            onChange={(e) => setNovoId(e.target.value)}
            placeholder="ID do usuário"
            className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={mutEnviar.isPending}
            className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg active:scale-95 transition-all disabled:opacity-60"
          >
            {mutEnviar.isPending ? '...' : 'Enviar'}
          </button>
        </form>
        {addErro && <p className="text-xs text-red-500 mt-2">{addErro}</p>}
        {mutEnviar.isSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Solicitação enviada!
          </p>
        )}
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 dark:text-red-400 py-8">
          Erro ao carregar amizades.
        </p>
      )}

      {!isLoading && !isError && amizades?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Nenhum amigo ainda. Adicione pelo ID acima.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3">
          {amizades?.map((amizade) => (
            <AmigoCard
              key={amizade.id}
              amizade={amizade}
              usuarioAtual={usuario?.id}
              onAceitar={(id) => mutAceitar.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
