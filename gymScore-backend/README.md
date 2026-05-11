# GymScore Backend (Go)

Este projeto é a reestruturação completa do backend do **GymScore** — originalmente desenvolvido em Node.js — agora migrado para **Go (Golang)**. A nova versão adota Clean Architecture, o framework Fiber para alta performance e o GORM para persistência no MySQL, oferecendo uma base robusta, limpa e escalável.

---

## 🚀 Tecnologias Utilizadas

* Linguagem: Go (Golang)
* Framework Web: Fiber v2
* Banco de Dados: MySQL 8+
* ORM: GORM
* Autenticação: JWT
* Segurança: Bcrypt, CORS
* Pagamentos: PIX (BRCode + QR Code)

---

## 💸 Sistema de Pagamento PIX (Novo)

O sistema agora possui um fluxo completo de pagamento via PIX baseado em arquitetura real de mercado.

### 🔥 Fluxo Implementado

1. Gerar PIX

   * Endpoint: POST /api/pagamento/pix
   * Retorna:

     * QR Code (Base64)
     * Código PIX (Copia e Cola)
     * TXID da transação

2. Salvar como PENDENTE

   * O pagamento é armazenado no banco com status: PENDENTE

3. Usuário realiza pagamento

   * Fora do sistema (app bancário)

4. Confirmação via Webhook (Simulado ou Real)

   * Endpoint: POST /api/pagamento/webhook

5. Atualização de saldo

   * Após confirmação:

     * Status → PAGO
     * Saldo do usuário é atualizado

---

## ⚠️ Importante sobre PIX

### 🔴 Modo Atual (Simulado)

Atualmente o sistema utiliza um webhook interno simulado, pois chaves PIX comuns não fornecem eventos de pagamento.

---

## 🧱 Estrutura PIX

pix_pagamentos

* id
* user_id
* valor
* status (PENDENTE | PAGO)
* txid
* criado_em

---

## 💳 Exemplo de Uso

### 1. Gerar PIX

POST /api/pagamento/pix

{
"valor": 100.00,
"cpf": "123.456.789-00"
}

Resposta:

{
"qrcode_base64": "...",
"payload": "...",
"txid": "DEP1"
}

---

### 2. Simular Pagamento (Webhook)

POST /api/pagamento/webhook

{
"txid": "DEP1"
}

---

### 3. Resultado

* Saldo atualizado
* Status da transação = PAGO

---

## ⚙️ Configuração do PIX (.env)

PIX_CHAVE=sua-chave-pix
PIX_NOME_RECEBEDOR=PEDRO BERTOCHI
PIX_CIDADE_RECEBEDOR=SAO PAULO

---

## 📁 Estrutura do Projeto

```
gym-score-go/
├── database/
│   └── schema.sql               # DDL completo do MySQL (Tabelas e Procedures)
├── internal/
│   ├── config/                  # Configurações e conexão com DB (.env)
│   ├── controllers/             # Manipuladores HTTP (Handlers)
│   ├── middlewares/             # Interceptadores (Auth, CORS, Logger)
│   ├── models/                  # Entidades de domínio e DTOs
│   ├── repositories/            # Camada de acesso a dados (GORM)
│   ├── routes/                  # Definição das rotas da API
│   └── services/                # Regras de negócio (Use Cases)
├── pkg/
│   └── utils/                   # Utilitários compartilhados (JWT, Respostas, Validações)
├── .env.example                 # Exemplo de variáveis de ambiente
├── go.mod / go.sum              # Gerenciamento de dependências
├── main.go                      # Ponto de entrada da aplicação
└── README.md                    # Documentação do projeto
```

---

## 🛠️ Como Rodar

```bash
go mod tidy
go run main.go
```

---

## 🔐 Autenticação

Authorization: Bearer SEU_TOKEN

---

## 🧪 Testes

```bash
go test ./... -v
```

---

## 🔄 Evolução do Sistema

Antes:

* PIX gerava saldo automaticamente (inseguro)

Agora:

* PIX → PENDENTE
* Webhook → confirma pagamento
* Saldo atualizado somente após confirmação

---

## 🚀 Próximos Passos (Produção)

* Integração com gateway de pagamento
* Webhook real
* Expiração de PIX
* Reconciliação automática

---

## 🧠 Observação Final

O sistema foi projetado para ser facilmente migrado de simulação para produção real, bastando trocar a origem do webhook.
