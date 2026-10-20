# Banco de dados — migrations

O schema é versionado com [goose](https://github.com/pressly/goose) (arquivos SQL em `migrations/`,
com `-- +goose Up` / `-- +goose Down`). O `AutoMigrate` do GORM não é mais usado. O antigo
`schema.sql` foi removido: a fonte da verdade são as migrations.

## Migrations

| Versão | Arquivo | O que faz |
|---|---|---|
| 1 | `00001_baseline.sql` | Schema que o AutoMigrate gerava (`CREATE TABLE IF NOT EXISTS`, idempotente: em bancos existentes não altera nada) |
| 2 | `00002_dinheiro_centavos.sql` | `usuarios.saldo_centavos` BIGINT + `CHECK >= 0`, convertido de `saldo` (a coluna `saldo` só é removida na 00003) |
| 3 | `00003_ledger.sql` | `transacoes` vira ledger (`tipo` incl. `ajuste`, `valor_centavos` assinado, `id_desafio`, `asaas_transfer_id`, `descricao`); cria linha de abertura `ajuste` por usuário com saldo; remove `usuarios.saldo` |
| 4 | `00004_desafios_v2.sql` | Modelo de desafio v2 (entrada em centavos, novos status, prêmio/vencedor em participantes) |
| 5 | `00005_checkins_votos.sql` | `desafio_checkins` e `desafio_votos` |
| 6 | `00006_notificacoes.sql` | `notificacoes` |
| 7 | `00007_reset_senha.sql` | `password_reset_tokens` |
| 8 | `00008_amizades_unicas.sql` | Remove duplicatas de amizade e impede par duplicado em qualquer direção |
| 9 | `00009_token_versao.sql` | `usuarios.token_versao` (revogação de JWT) |
| 10 | `00010_perfis_academia_instrutor.sql` | Perfis RBAC (`usuarios.perfil`/`username`/`elo`/`pontos`/`ultima_vez`), `cpf`/`data_nascimento`/`genero` nullable (conta "academia"), `desafio_participantes.presente` (check-in presencial), tabelas `academias`, `instrutores`, `podio_desafios`, `avaliacoes_desafios` |
| 11 | `00011_desafios_academia.sql` | Sprint 6 (Academia -> Instrutor -> Atleta): `desafios.id_academia`/`id_instrutor`/`data_evento`/`categoria`/`posicoes_podio`, status sem `em_votacao`, `desafio_participantes.codigo_ingresso` (QR) e `presente_em`, `podio_desafios.premio_centavos`; cancela e estorna desafios legados criados por não-academia |
| 12 | `00012_premiacao_financeiro.sql` | Sprint 6 (financeiro): em `desafios` prêmio fixo, pote (`dividir_pote`/`percentual_pote`), `taxa_plataforma_pct`, pagamento e seleção do instrutor (`designado`/`vaga_aberta` + teto), `reserva_academia_centavos`, todas com CHECK; tabelas `desafio_candidaturas_instrutor` e `plataforma_receitas`; novos tipos no ledger (`reserva_desafio`, `estorno_reserva`, `pagamento_instrutor`, `receita_academia`, `tarifa_saque`) |

Regras de conversão importantes:
- Saldos: `ROUND(saldo * 100)`, nunca negativo, `NULL` vira 0. Saldo legado negativo vira 0 e é registrado numa linha `ajuste` (descrição com o valor original).
- Ledger de abertura: para cada usuário com saldo > 0 (ou saldo legado negativo, ou ledger divergente) é criada uma linha `ajuste`/`received`, "Saldo migrado", com `valor_centavos = saldo_centavos - SUM(depósitos legados received)`, de modo que `saldo == SUM(ledger)` vale também para dados antigos.
- Transações antigas: viram `tipo='deposito'`, `valor_centavos = ROUND(valor*100)`, status preservado.
- Desafios antigos **não encerrados** (`pendente`, `aberto`, `em_andamento`) viram `cancelado` **sem movimentar saldo**
  (no modelo antigo não havia reserva). Encerrados continuam `encerrado`; o `id_vencedor` vira participante com `vencedor=1`
  e `premio_centavos = valor_entrada_centavos`.
- Desafios legados (00011) **não encerrados criados por quem não é academia** (`usuarios.perfil <> 'academia'`) viram `cancelado`
  **com estorno pelo ledger**: para cada (usuário, desafio) insere uma linha `estorno_desafio`/`concluido` com
  `-SUM(entrada_desafio + estorno_desafio efetivos)` (só se > 0; quem já saiu não é estornado de novo), soma ao
  `saldo_centavos` e cria uma notificação `desafio_cancelado`, tudo numa transação. Os de academia em `em_votacao` viram `em_andamento`.

Verificação da invariante saldo == ledger (deve retornar 0 linhas, antes e depois de qualquer migration):

```sql
SELECT u.id, u.saldo_centavos,
       COALESCE((SELECT SUM(t.valor_centavos) FROM transacoes t
                  WHERE t.id_usuario = u.id
                    AND (t.status IN ('received','concluido') OR (t.tipo = 'saque' AND t.status = 'pending'))), 0) AS soma_ledger
FROM usuarios u
HAVING saldo_centavos <> soma_ledger;
```
Receita da plataforma (taxa de inscrição + tarifa de saque; a plataforma não tem carteira de usuário):

```sql
-- Total por origem
SELECT origem, COUNT(*) AS qtd, SUM(valor_centavos) AS total_centavos
FROM plataforma_receitas GROUP BY origem;

-- Por mês e origem
SELECT DATE_FORMAT(criado_em, '%Y-%m') AS mes, origem, SUM(valor_centavos) AS total_centavos
FROM plataforma_receitas GROUP BY mes, origem ORDER BY mes, origem;
```

Invariantes financeiras por desafio (cada consulta deve retornar 0 linhas). `reserva_academia_centavos` guarda a reserva
vigente e **não é zerada** ao encerrar nem ao cancelar: quem diz se ela foi consumida ou devolvida é o status do desafio e as
linhas `reserva_desafio`/`estorno_reserva` do ledger. As entradas são **líquidas** (`entrada_desafio` + `estorno_desafio`,
já que atleta que sai do desafio aberto é reembolsado).

```sql
-- 1) Encerrado: entradas líquidas + reserva = prêmios + instrutor + academia + taxa (ao centavo).
--    Créditos do ledger: premio_desafio, pagamento_instrutor, receita_academia; taxa de plataforma_receitas.
SELECT d.id,
       COALESCE(e.entradas, 0) AS entradas, d.reserva_academia_centavos AS reserva,
       COALESCE(s.premios, 0) AS premios, COALESCE(s.instrutor, 0) AS instrutor,
       COALESCE(s.academia, 0) AS academia, COALESCE(r.taxa, 0) AS taxa
FROM desafios d
LEFT JOIN (SELECT id_desafio, -SUM(valor_centavos) AS entradas FROM transacoes
            WHERE tipo IN ('entrada_desafio', 'estorno_desafio') AND status IN ('received','concluido') GROUP BY id_desafio) e ON e.id_desafio = d.id
LEFT JOIN (SELECT id_desafio,
                  SUM(CASE WHEN tipo = 'premio_desafio' THEN valor_centavos END) AS premios,
                  SUM(CASE WHEN tipo = 'pagamento_instrutor' THEN valor_centavos END) AS instrutor,
                  SUM(CASE WHEN tipo = 'receita_academia' THEN valor_centavos END) AS academia
             FROM transacoes WHERE status IN ('received','concluido') GROUP BY id_desafio) s ON s.id_desafio = d.id
LEFT JOIN (SELECT id_desafio, SUM(valor_centavos) AS taxa FROM plataforma_receitas
            WHERE origem = 'taxa_inscricao' GROUP BY id_desafio) r ON r.id_desafio = d.id
WHERE d.status = 'encerrado'
  AND COALESCE(e.entradas, 0) + d.reserva_academia_centavos
      <> COALESCE(s.premios, 0) + COALESCE(s.instrutor, 0) + COALESCE(s.academia, 0) + COALESCE(r.taxa, 0);

-- 2) Desafio não cancelado: a reserva vigente da coluna é o que o ledger tem líquido (reserva_desafio - estorno_reserva).
SELECT d.id, d.reserva_academia_centavos AS reserva_coluna, -COALESCE(SUM(t.valor_centavos), 0) AS reserva_ledger
FROM desafios d
LEFT JOIN transacoes t ON t.id_desafio = d.id AND t.tipo IN ('reserva_desafio', 'estorno_reserva') AND t.status IN ('received','concluido')
WHERE d.status <> 'cancelado'
GROUP BY d.id, d.reserva_academia_centavos
HAVING reserva_coluna <> reserva_ledger;

-- 3) Cancelado: tudo voltou (entradas, reserva) e não há taxa -> o ledger do desafio soma zero.
SELECT d.id, SUM(t.valor_centavos) AS liquido
FROM desafios d JOIN transacoes t ON t.id_desafio = d.id AND t.status IN ('received','concluido')
WHERE d.status = 'cancelado'
GROUP BY d.id HAVING liquido <> 0;
```

A invariante saldo == ledger (acima) continua valendo com os tipos novos. A tarifa de saque (`tarifa_saque`) entra no
ledger como débito `concluido` e fica `failed` (fora do ledger efetivo, com a linha de `plataforma_receitas` removida) se o
PIX do saque falhar.
- Amizades duplicadas (inclusive em direções opostas): mantém uma linha por par, prioridade `aceita > pendente > recusada`, depois menor `id`.
  Autoamizades são removidas.

## Como rodar com a CLI do goose

```bash
# DSN: usuario:senha@tcp(host:porta)/banco?parseTime=true
export DSN='usuario:senha@tcp(127.0.0.1:3306)/gymscore?parseTime=true'
cd gymScore-backend/database/migrations   # (ou use -dir)

go run github.com/pressly/goose/v3/cmd/goose@latest mysql "$DSN" status
go run github.com/pressly/goose/v3/cmd/goose@latest mysql "$DSN" up
go run github.com/pressly/goose/v3/cmd/goose@latest mysql "$DSN" down        # desfaz a última
go run github.com/pressly/goose/v3/cmd/goose@latest mysql "$DSN" down-to 0   # CUIDADO: apaga tudo
```

No boot do backend as migrations embutidas rodam automaticamente quando `MIGRATE_ON_BOOT=true` (padrão).

## Testando localmente (MySQL descartável)

```bash
docker run -d --name gymscore-mysql-test -e MYSQL_ROOT_PASSWORD=test -e MYSQL_DATABASE=gymscore -p 3307:3306 mysql:8
DSN='root:test@tcp(127.0.0.1:3307)/gymscore?parseTime=true'
# ... goose up / down-to 0 / up
docker rm -f gymscore-mysql-test
```

## Observações

- MySQL não tem DDL transacional: se uma migration falhar no meio, ela fica parcialmente aplicada. **Faça backup
  (`mysqldump`) antes de aplicar em bancos com dados.**
- O `Down` da 11 **não desfaz** os cancelamentos/estornos dos legados (o dinheiro já voltou; desfazer quebraria a invariante) e perde dono/instrutor/data/categoria/pódio configurado, ingressos e prêmios do pódio.
- Os `Down` de 2, 3, 4 e 10 são reversões com perda de informação (ex.: desafios cancelados voltam como `encerrado`,
  vencedores múltiplos viram um só; o `Down` da 10 falha se já existir conta "academia" sem cpf/data_nascimento/genero,
  pois o `MODIFY COLUMN` final exige `NOT NULL`). O `Down` da 1 apaga todas as tabelas.
- A coluna `amizades.par` é gerada (STORED); os models Go não devem mapeá-la para escrita (usar `<-:false` ou omitir).
- A 00010 lida com um banco de dev que já teve `academias`/`instrutores`/`podio_desafios`/`avaliacoes_desafios` e as
  colunas de perfil/gamificação criadas por um `AutoMigrate` legado (antes de existir migration SQL para elas), em
  nulidade/tipos mais soltos que o schema final. Por isso ela usa duas stored procedures temporárias (criadas e
  removidas dentro do próprio Up/Down) para fazer `ADD COLUMN`/`ADD INDEX` condicionais via `information_schema` +
  `PREPARE`/`EXECUTE` — o MySQL não tem `ADD COLUMN IF NOT EXISTS` (diferente do MariaDB) — e depois normaliza
  nulidade/tipo/default com `UPDATE` + `MODIFY COLUMN` incondicional (idempotente por natureza). As tabelas novas
  usam `CREATE TABLE IF NOT EXISTS`, mesmo padrão da 00001.
- A 00011 usa duas procedures temporárias (`_goose_00011_add`/`_drop`, removidas no fim) para ADD/DROP condicional de coluna, índice, FK e CHECK (também tolera colunas pré-criadas por AutoMigrate legado); o estorno roda dentro da procedure `_goose_00011_estornar_legados` (transação atômica).
- A 00012 usa as procedures temporárias `_goose_00012_add`/`_drop`. Os CHECKs `chk_desafios_soma_pct` (`percentual_pote` + `taxa_plataforma_pct` + `instrutor_pct` <= 100) valem sempre, mesmo com `dividir_pote = 0` (nesse caso grave `percentual_pote = 0`). O `Down` da 12 apaga configuração financeira, candidaturas e receitas, e converte as linhas de ledger com tipos novos em `ajuste` (mesmo valor), preservando saldo == ledger; o dinheiro movimentado não é desfeito.
- Para criar nova migration: `goose create nome sql -dir migrations` (numeração sequencial `0000N_nome.sql`).
