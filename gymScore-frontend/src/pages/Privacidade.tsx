import { Link } from 'react-router-dom'

export function Privacidade() {
  return (
    <div className="px-4 pt-6 pb-10 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Voltar"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 flex flex-col gap-6">
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Dados coletados
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1 text-sm">
            <li>Nome e sobrenome</li>
            <li>Endereço de e-mail</li>
            <li>CPF (para processamento de pagamentos)</li>
            <li>Data de nascimento e gênero</li>
            <li>Saldo e histórico de transações</li>
            <li>Desafios criados e participados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Finalidade</h2>
          <p className="text-sm">
            Os dados são utilizados exclusivamente para operação da plataforma GymScore:
            gerenciamento de conta, processamento de pagamentos via PIX, administração de
            desafios entre usuários e comunicação de resultados.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Compartilhamento
          </h2>
          <p className="text-sm">
            O CPF é compartilhado com o processador de pagamentos (Asaas) exclusivamente para
            fins de geração de cobranças PIX. Nenhum outro dado é vendido ou compartilhado com
            terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Seus direitos (LGPD)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1 text-sm">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar exclusão da conta e dados</li>
            <li>Revogar consentimento a qualquer momento</li>
          </ul>
          <p className="text-sm mt-2">
            Para exercer seus direitos, entre em contato pelo e-mail da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Segurança</h2>
          <p className="text-sm">
            Utilizamos autenticação via JWT e criptografia de senhas. Os dados são armazenados
            em servidores seguros com acesso restrito.
          </p>
        </section>

        <p className="text-xs text-gray-400 dark:text-slate-500">
          Última atualização: maio de 2026
        </p>
      </div>
    </div>
  )
}
