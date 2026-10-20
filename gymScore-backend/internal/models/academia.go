package models

import "time"

// Academia representa os dados de pessoa jurídica de uma conta com perfil "academia".
// Vincula-se 1:1 a um Usuario (via IDUsuario) que carrega os dados de acesso (email/senha).
type Academia struct {
	ID        uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	IDUsuario uint     `gorm:"uniqueIndex;not null" json:"id_usuario"`
	Usuario   *Usuario `gorm:"foreignKey:IDUsuario" json:"usuario,omitempty"`
	// RazaoSocial é a denominação legal da empresa perante a Receita Federal
	RazaoSocial string `gorm:"type:varchar(150);not null" json:"razao_social"`
	// NomeFantasia é o nome comercial exibido no app
	NomeFantasia string `gorm:"type:varchar(150);not null" json:"nome_fantasia"`
	// CNPJ é armazenado formatado ("00.000.000/0000-00")
	CNPJ         string    `gorm:"type:varchar(18);uniqueIndex;not null" json:"cnpj"`
	Endereco     string    `gorm:"type:varchar(255)" json:"endereco,omitempty"`
	Telefone     string    `gorm:"type:varchar(20)" json:"telefone,omitempty"`
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
}

// TableName define o nome da tabela no banco de dados
func (Academia) TableName() string {
	return "academias"
}

// CriarAcademiaRequest é o DTO de entrada para o cadastro público de conta de academia
// (fluxo próprio, sem sessão prévia — diferente do upgrade de perfil de instrutor)
type CriarAcademiaRequest struct {
	Nome         string `json:"nome" validate:"required,min=2,max=100"`
	Sobrenome    string `json:"sobrenome" validate:"omitempty,max=100"`
	Email        string `json:"email" validate:"required,email"`
	Senha        string `json:"senha" validate:"required,min=6"`
	RazaoSocial  string `json:"razao_social" validate:"required,min=2,max=150"`
	NomeFantasia string `json:"nome_fantasia" validate:"required,min=2,max=150"`
	CNPJ         string `json:"cnpj" validate:"required"` // Aceita com ou sem pontuação
	Endereco     string `json:"endereco"`
	Telefone     string `json:"telefone"`
}

// DashboardAcademiaResponse são os indicadores da PRÓPRIA academia logada (GET /api/academia/dashboard).
type DashboardAcademiaResponse struct {
	Academia AcademiaResumo `json:"academia"`
	// TotalDesafios soma todos os status; DesafiosPorStatus sempre traz as 4 chaves (0 quando vazio).
	TotalDesafios     int64                   `json:"total_desafios"`
	DesafiosPorStatus map[StatusDesafio]int64 `json:"desafios_por_status"`
	// InscritosMes: inscrições feitas no mês corrente em desafios não cancelados da academia.
	InscritosMes int64 `json:"inscritos_mes"`
	// PoteEmJogo: soma das entradas dos inscritos em desafios abertos ou em andamento.
	PoteEmJogoCentavos int64   `json:"pote_em_jogo_centavos"`
	PoteEmJogo         float64 `json:"pote_em_jogo"`
	// TaxaPresenca é o percentual (0 a 100, uma casa) de inscritos presentes nos desafios em andamento
	// e encerrados; 0 quando não há base.
	TaxaPresenca float64 `json:"taxa_presenca"`
	// AvaliacaoMedia (0 a 5, duas casas) considera só avaliações dos desafios desta academia.
	AvaliacaoMedia        float64 `json:"avaliacao_media"`
	AvaliacoesTotal       int64   `json:"avaliacoes_total"`
	InstrutoresVinculados int64   `json:"instrutores_vinculados"`
	// ProximosEventos: até 5 desafios abertos com data_evento futura, do mais próximo ao mais distante.
	ProximosEventos []DesafioResponse `json:"proximos_eventos"`
}
