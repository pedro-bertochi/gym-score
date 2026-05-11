import { useState } from 'react'
import { Link } from 'react-router-dom'

export function LgpdBanner() {
  const [accepted, setAccepted] = useState(() => !!localStorage.getItem('lgpd-consent'))
  if (accepted) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 dark:bg-slate-950 text-white p-4 shadow-lg">
      <p className="text-sm mb-3">
        Usamos seus dados para gerenciar desafios e pagamentos.{' '}
        <Link to="/privacidade" className="underline text-orange-400">
          Política de Privacidade
        </Link>
      </p>
      <button
        onClick={() => {
          localStorage.setItem('lgpd-consent', '1')
          setAccepted(true)
        }}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg"
      >
        Aceitar
      </button>
    </div>
  )
}
