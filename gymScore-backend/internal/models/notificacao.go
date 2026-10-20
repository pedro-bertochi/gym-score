package models

import "time"

// Tipos de notificação in-app.
const (
	NotifAmizadeRecebida = "amizade_recebida"
	NotifAmizadeAceita   = "amizade_aceita"
	NotifConviteDesafio  = "convite_desafio"
	NotifDesafioIniciado = "desafio_iniciado"
	NotifResultado       = "resultado_desafio"
	// Fluxo Academia -> Instrutor -> Atleta (Sprint 6)
	NotifInscricaoConfirmada = "inscricao_confirmada"
	NotifPresencaConfirmada  = "presenca_confirmada"
	NotifInstrutorDesignado  = "instrutor_designado"
	NotifInstrutorRemovido   = "instrutor_removido"
	NotifInstrutorVinculado  = "instrutor_vinculado"
	NotifDesafioCancel       = "desafio_cancelado"
	// Financeiro e vaga de instrutor (Sprint 6)
	NotifCandidaturaRecebida  = "candidatura_recebida"
	NotifCandidaturaEscolhida = "candidatura_escolhida"
	NotifCandidaturaRecusada  = "candidatura_recusada"
	NotifPagamentoInstrutor   = "pagamento_instrutor"
	NotifRepasseAcademia      = "repasse_academia"
	NotifDeposito             = "deposito_confirmado"
	NotifSaqueConcluido       = "saque_concluido"
	NotifSaqueFalhou          = "saque_falhou"
)

// Notificacao é um aviso in-app para um usuário.
type Notificacao struct {
	ID        uint       `gorm:"primaryKey;autoIncrement"`
	IDUsuario uint       `gorm:"column:id_usuario;not null"`
	Tipo      string     `gorm:"column:tipo;size:40;not null"`
	Titulo    string     `gorm:"column:titulo;size:150;not null"`
	Mensagem  string     `gorm:"column:mensagem;size:500;not null"`
	Link      *string    `gorm:"column:link;size:255"`
	LidaEm    *time.Time `gorm:"column:lida_em"`
	CriadoEm  time.Time  `gorm:"column:criado_em;autoCreateTime"`
}

func (Notificacao) TableName() string { return "notificacoes" }

// NotificacaoResponse é o DTO devolvido ao dono.
type NotificacaoResponse struct {
	ID       uint       `json:"id"`
	Tipo     string     `json:"tipo"`
	Titulo   string     `json:"titulo"`
	Mensagem string     `json:"mensagem"`
	Link     string     `json:"link,omitempty"`
	Lida     bool       `json:"lida"`
	LidaEm   *time.Time `json:"lida_em,omitempty"`
	CriadoEm time.Time  `json:"criado_em"`
}

// ListaNotificacoesResponse é uma página de notificações (não lidas primeiro).
type ListaNotificacoesResponse struct {
	Itens    []NotificacaoResponse `json:"itens"`
	Total    int64                 `json:"total"`
	NaoLidas int64                 `json:"nao_lidas"`
	Pagina   int                   `json:"pagina"`
	Limite   int                   `json:"limite"`
}
