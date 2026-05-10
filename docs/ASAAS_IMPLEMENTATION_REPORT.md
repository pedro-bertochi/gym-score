# Relatório de Implementação — Integração Asaas PIX

---

## 1. RESUMO GERAL

### O que foi implementado

Substituição completa da implementação fake de PIX por integração real com a API do Asaas (sandbox/produção), incluindo:

- Client HTTP para a API Asaas com busca/criação de customer por CPF
- Persistência de transações no banco de dados
- Fluxo assíncrono: QR Code gerado na criação, saldo creditado apenas após confirmação via webhook
- Endpoint público de webhook com idempotência e GORM transaction para atomicidade

### Arquivos criados

| Arquivo | Descrição |
|---|---|
| `internal/models/transacao.go` | Model Transacao + structs Asaas (request/response/webhook) |
| `internal/repositories/transacao_repository.go` | Interface e implementação GORM para CRUD de transações |
| `internal/client/asaas_client.go` | Client HTTP Asaas com timeout 15s, busca/criação de customer e cobrança PIX |
| `internal/controllers/webhook_controller.go` | Controller do webhook Asaas com idempotência e tx GORM |

### Arquivos modificados

| Arquivo | O que mudou |
|---|---|
| `internal/models/pix.go` | Removido `NovoSaldo`; adicionado `ExpirationDate` e `AsaasPaymentID` |
| `internal/services/pix_service.go` | Fluxo real: chama Asaas, salva transação, não credita saldo |
| `internal/config/config.go` | Adicionado `AsaasAPIKey` e `AsaasBaseURL` |
| `internal/routes/routes.go` | Adicionado parâmetro `webhookCtrl` e rota `POST /api/webhooks/asaas` |
| `main.go` | Instancia `AsaasClient`, `TransacaoRepository`, `WebhookController`; injeta nas deps; AutoMigrate inclui `Transacao` |
| `database/schema.sql` | Adicionada tabela `transacoes` |
| `.env.example` | Adicionado `ASAAS_API_KEY` e `ASAAS_BASE_URL` |

### Fluxo completo do pagamento

```
1. App → POST /api/pagamento/pix
2. PIXService busca/cria customer no Asaas pelo CPF
3. PIXService cria cobrança PIX (POST /v3/payments) → retorna paymentID
4. PIXService busca QR Code (GET /v3/payments/{id}/pixQrCode)
5. PIXService salva Transacao(status=pending) no banco
6. App recebe { qrcode_base64, payload, expiration_date, asaas_payment_id }

7. Usuário paga o PIX no banco
8. Asaas → POST /api/webhooks/asaas (event=PAYMENT_RECEIVED)
9. WebhookController busca Transacao pelo asaasPaymentID
10. Se status != received: GORM tx credita saldo + atualiza status=received
11. Retorna 200 (Asaas para os retries)
```

---

## 2. DETALHAMENTO POR ARQUIVO

### `internal/models/transacao.go` (criado)
Define `Transacao` (tabela `transacoes`), `AsaasCreatePaymentRequest`, `AsaasPaymentResponse`, `AsaasPixQrCodeResponse` e `AsaasWebhookPayload`. Centraliza todos os tipos relacionados ao Asaas.
**Tokens estimados:** ~200

### `internal/repositories/transacao_repository.go` (criado)
Interface `TransacaoRepository` com `Criar`, `BuscarPorAsaasID` e `AtualizarStatus`. Implementação via GORM.
**Tokens estimados:** ~150

### `internal/client/asaas_client.go` (criado)
`AsaasClient` com `httpClient` de 15s timeout. Método privado `buscarOuCriarCustomer` (GET + POST `/v3/customers`). Métodos públicos `CriarCobrancaPix` e `BuscarPixQrCode`. Autenticação via header `access_token`.
**Tokens estimados:** ~350

### `internal/controllers/webhook_controller.go` (criado)
`ReceberWebhookAsaas` parseia o payload, roteia por `payload.Event`. `handlePaymentReceived` implementa idempotência e usa `db.Transaction` para garantir atomicidade entre creditar saldo e atualizar status.
**Tokens estimados:** ~250

### `internal/models/pix.go` (modificado)
`PIXResponse` atualizado: removido `NovoSaldo`, adicionado `ExpirationDate` e `AsaasPaymentID`.
**Tokens estimados:** ~60

### `internal/services/pix_service.go` (modificado)
Novo fluxo com `AsaasClient` e `TransacaoRepository` injetados. Sem crédito de saldo imediato.
**Tokens estimados:** ~200

### `internal/config/config.go` (modificado)
Dois novos campos: `AsaasAPIKey` (env `ASAAS_API_KEY`) e `AsaasBaseURL` (env `ASAAS_BASE_URL`, default sandbox).
**Tokens estimados:** ~40

### `internal/routes/routes.go` (modificado)
Assinatura de `Setup` recebe `*controllers.WebhookController`. Rota `POST /api/webhooks/asaas` registrada fora do grupo protegido.
**Tokens estimados:** ~40

### `main.go` (modificado)
Import do pacote `client`, instanciação de `transacaoRepo`, `asaasClient` e `webhookCtrl`, AutoMigrate inclui `Transacao`, `routes.Setup` recebe `webhookCtrl`.
**Tokens estimados:** ~80

### `database/schema.sql` (modificado)
Tabela `transacoes` com FK para `usuarios`, ENUM de status e UNIQUE em `asaas_payment_id`.
**Tokens estimados:** ~80

### `.env.example` (modificado)
Adicionadas vars `ASAAS_API_KEY` e `ASAAS_BASE_URL`.
**Tokens estimados:** ~20

---

## 3. TABELA DE TOKENS

| Arquivo | Tipo | Tokens estimados |
|---|---|---|
| `internal/models/transacao.go` | criado | 200 |
| `internal/repositories/transacao_repository.go` | criado | 150 |
| `internal/client/asaas_client.go` | criado | 350 |
| `internal/controllers/webhook_controller.go` | criado | 250 |
| `internal/models/pix.go` | modificado | 60 |
| `internal/services/pix_service.go` | modificado | 200 |
| `internal/config/config.go` | modificado | 40 |
| `internal/routes/routes.go` | modificado | 40 |
| `main.go` | modificado | 80 |
| `database/schema.sql` | modificado | 80 |
| `.env.example` | modificado | 20 |
| **TOTAL** | | **~1470** |

---

## 4. PONTOS DE ATENÇÃO

### Configuração manual obrigatória

- Definir `ASAAS_API_KEY` no `.env` com o token da conta Asaas (sandbox ou produção)
- Para produção: alterar `ASAAS_BASE_URL=https://www.asaas.com/api`
- Configurar a URL do webhook no painel Asaas: `POST https://<seu-domínio>/api/webhooks/asaas`
- Eventos a ativar no painel Asaas: `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`

### Limitações conhecidas

- O webhook não valida assinatura HMAC — qualquer POST na rota é aceito (risco em produção)
- O CPF é enviado ao Asaas sem formatação validada além do `ValidarCPF` existente
- Sem retry interno: se o Asaas retornar erro ao criar QR Code após criar a cobrança, a cobrança fica órfã no Asaas (sem transação no banco)

### Sugestões de melhoria futura

- Adicionar validação de assinatura HMAC do webhook (`asaas-signature` header)
- Implementar compensação: se `BuscarPixQrCode` falhar, cancelar a cobrança criada no Asaas
- Adicionar expiração de cobranças pendentes via job/cron
- Expor endpoint `GET /api/pagamento/pix/:asaas_payment_id/status` para polling do frontend
