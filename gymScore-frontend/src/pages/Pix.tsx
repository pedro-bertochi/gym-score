import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { gerarPix } from '../api/pix'
import type { PixResponse } from '../types'

function formatarDataExpiracao(dataIso: string): string {
  if (!dataIso) return '—'
  try {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dataIso
  }
}

export function Pix() {
  const [valor, setValor] = useState('')
  const [resultado, setResultado] = useState<PixResponse | null>(null)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)

  const mutacao = useMutation({
    mutationFn: () => gerarPix({ valor: Number(valor) }),
    onSuccess: (data) => {
      setResultado(data)
      setErro('')
    },
    onError: (err) => {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message
      setErro(msg ?? 'Erro ao gerar QR Code. Tente novamente.')
      setResultado(null)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valor || Number(valor) < 5) {
      setErro('Valor mínimo para depósito é R$ 5,00')
      return
    }
    setErro('')
    mutacao.mutate()
  }

  async function handleCopiar() {
    if (!resultado?.payload) return
    try {
      await navigator.clipboard.writeText(resultado.payload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // silencioso — clipboard pode ser bloqueado em HTTP
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Depositar via PIX</h1>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
        Gere um QR Code para adicionar saldo à sua conta.
      </p>

      {!resultado ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="valor"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              Valor do depósito (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 dark:text-slate-400 text-sm font-medium">
                R$
              </span>
              <input
                id="valor"
                type="number"
                min={5}
                step={0.01}
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
                placeholder="5,00"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Valor mínimo: R$ 5,00
            </p>
          </div>
          {erro && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 text-center">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={mutacao.isPending}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold active:scale-95 transition-all disabled:opacity-60"
          >
            {mutacao.isPending ? 'Gerando QR Code...' : 'Gerar QR Code'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 w-full flex flex-col items-center gap-4">
            <p className="text-gray-600 dark:text-slate-300 text-sm font-medium">
              Escaneie o QR Code abaixo
            </p>
            {resultado.qrcode_base64 ? (
              <img
                src={`data:image/png;base64,${resultado.qrcode_base64}`}
                alt="QR Code PIX"
                className="w-56 h-56 rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 text-sm">QR Code não disponível</p>
              </div>
            )}
            {resultado.expiration_date && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400">Válido até</p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {formatarDataExpiracao(resultado.expiration_date)}
                </p>
              </div>
            )}
            {resultado.payload && (
              <div className="w-full">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">
                  PIX Copia e Cola
                </p>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 flex items-center gap-2">
                  <p className="text-xs text-gray-700 dark:text-slate-300 break-all flex-1 leading-relaxed">
                    {resultado.payload}
                  </p>
                  <button
                    onClick={handleCopiar}
                    className="shrink-0 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors active:scale-95"
                  >
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setResultado(null)
              setValor('')
              setErro('')
              setCopiado(false)
            }}
            className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-95 transition-all"
          >
            Nova transação
          </button>
        </div>
      )}
    </div>
  )
}
