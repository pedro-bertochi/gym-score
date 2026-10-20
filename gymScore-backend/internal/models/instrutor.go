package models

import "time"

// Instrutor representa um profissional de educação física cadastrado no sistema
type Instrutor struct {
	ID        uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	IDUsuario uint     `gorm:"uniqueIndex;not null" json:"id_usuario"`
	Usuario   *Usuario `gorm:"foreignKey:IDUsuario" json:"usuario,omitempty"`
	// CREF é o registro profissional obrigatório (ex: 001234-G/SP)
	CREF          string `gorm:"type:varchar(20);not null" json:"cref"`
	Especialidade string `gorm:"type:varchar(100)" json:"especialidade"`
	// IDAcademia vínculo opcional com academia — null se autônomo
	IDAcademia   *uint     `gorm:"default:null" json:"id_academia,omitempty"`
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
}

// TableName define o nome da tabela no banco de dados
func (Instrutor) TableName() string {
	return "instrutores"
}

// CriarInstrutorRequest é o DTO do POST /api/instrutores: o usuário LOGADO (JWT) ativa o próprio
// perfil de instrutor. Não aceita id_usuario nem id_academia: quem vincula é a academia
// (POST /api/academia/instrutores).
type CriarInstrutorRequest struct {
	CREF          string `json:"cref" validate:"required,min=4,max=20"`
	Especialidade string `json:"especialidade" validate:"omitempty,max=100"`
}

// VincularInstrutorRequest é o corpo do POST /api/academia/instrutores (e-mail de uma conta com perfil instrutor).
type VincularInstrutorRequest struct {
	Email string `json:"email" validate:"required,email,max=150"`
}

// InstrutorResponse é o item do diretório de instrutores (GET /api/instrutores): sem e-mail, CPF nem id de usuário.
type InstrutorResponse struct {
	ID            uint   `json:"id"`
	Nome          string `json:"nome"`
	Sobrenome     string `json:"sobrenome"`
	CREF          string `json:"cref"`
	Especialidade string `json:"especialidade"`
	Autonomo      bool   `json:"autonomo"` // true = sem vínculo com academia
}

// InstrutorVinculadoResponse é um instrutor vinculado à academia logada (visão da própria academia).
type InstrutorVinculadoResponse struct {
	ID             uint   `json:"id"`
	IDUsuario      uint   `json:"id_usuario"`
	Nome           string `json:"nome"`
	Sobrenome      string `json:"sobrenome"`
	Email          string `json:"email"`
	CREF           string `json:"cref"`
	Especialidade  string `json:"especialidade"`
	DesafiosAtivos int    `json:"desafios_ativos"` // desafios abertos ou em andamento em que ele é o instrutor
}

// ListaInstrutoresVinculadosResponse é a página de instrutores vinculados.
type ListaInstrutoresVinculadosResponse struct {
	Itens  []InstrutorVinculadoResponse `json:"itens"`
	Total  int64                        `json:"total"`
	Pagina int                          `json:"pagina"`
	Limite int                          `json:"limite"`
}
