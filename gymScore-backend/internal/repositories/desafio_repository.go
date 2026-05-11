package repositories

import (
	"errors"

	"gynScore-backend/internal/models"
	"gorm.io/gorm"
)

// DesafioRepository define a interface de acesso a dados para desafios
type DesafioRepository interface {
	Criar(desafio *models.Desafio) error
	BuscarPorID(id uint) (*models.Desafio, error)
	Listar() ([]models.Desafio, error)
	ListarPorUsuario(idUsuario uint) ([]models.Desafio, error)
	Atualizar(desafio *models.Desafio) error
	Deletar(id uint) error
}

// desafioRepository é a implementação concreta usando GORM
type desafioRepository struct {
	db *gorm.DB
}

// NovoDesafioRepository cria uma nova instância do repositório de desafios
func NovoDesafioRepository(db *gorm.DB) DesafioRepository {
	return &desafioRepository{db: db}
}

// Criar insere um novo desafio no banco de dados
func (r *desafioRepository) Criar(desafio *models.Desafio) error {
	return r.db.Create(desafio).Error
}

// BuscarPorID retorna um desafio pelo seu ID com os relacionamentos carregados
func (r *desafioRepository) BuscarPorID(id uint) (*models.Desafio, error) {
	var desafio models.Desafio
	err := r.db.Preload("Criador").Preload("Desafiado").First(&desafio, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &desafio, nil
}

// Listar retorna todos os desafios cadastrados
func (r *desafioRepository) Listar() ([]models.Desafio, error) {
	var desafios []models.Desafio
	err := r.db.Preload("Criador").Find(&desafios).Error
	return desafios, err
}

// ListarPorUsuario retorna os desafios abertos ou em andamento de um usuário específico
func (r *desafioRepository) ListarPorUsuario(idUsuario uint) ([]models.Desafio, error) {
	var desafios []models.Desafio
	err := r.db.Preload("Criador").Preload("Desafiado").
		Where("(id_criador = ? OR id_desafiado = ?) AND status IN ?",
			idUsuario, idUsuario,
			[]models.StatusDesafio{models.StatusAberto, models.StatusEmAndamento}).
		Find(&desafios).Error
	return desafios, err
}

// Atualizar salva as alterações de um desafio existente
func (r *desafioRepository) Atualizar(desafio *models.Desafio) error {
	return r.db.Save(desafio).Error
}

// Deletar remove um desafio pelo seu ID
func (r *desafioRepository) Deletar(id uint) error {
	return r.db.Delete(&models.Desafio{}, id).Error
}
