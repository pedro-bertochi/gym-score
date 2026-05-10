package models

import "time"

// StatusDesafio define os possíveis estados de um desafio
type StatusDesafio string

const (
	StatusPendente  StatusDesafio = "pendente"
	StatusAberto    StatusDesafio = "aberto"
	StatusEmAndamento StatusDesafio = "em_andamento"
	StatusEncerrado StatusDesafio = "encerrado"
)

// Desafio representa a entidade de desafio no sistema GymScore
type Desafio struct {
	ID         uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	Titulo     string        `gorm:"type:varchar(200);not null" json:"titulo"`
	Descricao  string        `gorm:"type:text" json:"descricao"`
	Valor      float64       `gorm:"type:decimal(10,2);not null" json:"valor"`
	Local      string        `gorm:"type:varchar(200)" json:"local"`
	Latitude   *float64      `gorm:"type:decimal(10,8)" json:"latitude,omitempty"`
	Longitude  *float64      `gorm:"type:decimal(11,8)" json:"longitude,omitempty"`
	Status     StatusDesafio `gorm:"type:enum('pendente','aberto','em_andamento','encerrado');default:'pendente'" json:"status"`
	IDCriador  uint          `gorm:"not null" json:"id_criador"`
	IDDesafiado *uint        `json:"id_desafiado,omitempty"`
	IDVencedor  *uint        `json:"id_vencedor,omitempty"`
	IDPerdedor  *uint        `json:"id_perdedor,omitempty"`
	CriadoEm   time.Time     `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm time.Time   `gorm:"autoUpdateTime" json:"atualizado_em"`

	// Relacionamentos
	Criador   *Usuario `gorm:"foreignKey:IDCriador" json:"criador,omitempty"`
	Desafiado *Usuario `gorm:"foreignKey:IDDesafiado" json:"desafiado,omitempty"`
	Vencedor  *Usuario `gorm:"foreignKey:IDVencedor" json:"vencedor,omitempty"`
}

// TableName define o nome da tabela no banco de dados
func (Desafio) TableName() string {
	return "desafios"
}

// CriarDesafioRequest é o DTO de entrada para criação de desafio
type CriarDesafioRequest struct {
	Titulo    string  `json:"titulo" validate:"required,min=3,max=200"`
	Descricao string  `json:"descricao"`
	Valor     float64 `json:"valor" validate:"required,gt=0"`
	Local     string   `json:"local"`
	Latitude  *float64 `json:"latitude,omitempty"`
	Longitude *float64 `json:"longitude,omitempty"`
	IDCriador uint     `json:"id_criador" validate:"required"`
}

// AceitarDesafioRequest é o DTO para aceitar um desafio
type AceitarDesafioRequest struct {
	IDDesafio uint `json:"id_desafio" validate:"required"`
	IDUsuario uint `json:"id_usuario" validate:"required"`
}

// IniciarDesafioRequest é o DTO para iniciar um desafio
type IniciarDesafioRequest struct {
	IDDesafio uint `json:"id_desafio" validate:"required"`
}

// EncerrarDesafioRequest é o DTO para encerrar um desafio
type EncerrarDesafioRequest struct {
	IDDesafio  uint `json:"id_desafio" validate:"required"`
	IDVencedor uint `json:"id_vencedor" validate:"required"`
	IDPerdedor uint `json:"id_perdedor" validate:"required"`
}
