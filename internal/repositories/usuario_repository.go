package repositories

import (
	"errors"

	"gynScore-backend/internal/models"
	"gorm.io/gorm"
)

// UsuarioRepository define a interface de acesso a dados para usuários
type UsuarioRepository interface {
	Criar(usuario *models.Usuario) error
	BuscarPorID(id uint) (*models.Usuario, error)
	BuscarPorEmail(email string) (*models.Usuario, error)
	BuscarPorCPF(cpf string) (*models.Usuario, error)
	Atualizar(usuario *models.Usuario) error
	Deletar(id uint) error
	Listar() ([]models.Usuario, error)
}

// usuarioRepository é a implementação concreta usando GORM
type usuarioRepository struct {
	db *gorm.DB
}

// NovoUsuarioRepository cria uma nova instância do repositório de usuários
func NovoUsuarioRepository(db *gorm.DB) UsuarioRepository {
	return &usuarioRepository{db: db}
}

// Criar insere um novo usuário no banco de dados
func (r *usuarioRepository) Criar(usuario *models.Usuario) error {
	return r.db.Create(usuario).Error
}

// BuscarPorID retorna um usuário pelo seu ID
func (r *usuarioRepository) BuscarPorID(id uint) (*models.Usuario, error) {
	var usuario models.Usuario
	err := r.db.First(&usuario, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &usuario, nil
}

// BuscarPorEmail retorna um usuário pelo seu e-mail
func (r *usuarioRepository) BuscarPorEmail(email string) (*models.Usuario, error) {
	var usuario models.Usuario
	err := r.db.Where("email = ?", email).First(&usuario).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &usuario, nil
}

// BuscarPorCPF retorna um usuário pelo seu CPF
func (r *usuarioRepository) BuscarPorCPF(cpf string) (*models.Usuario, error) {
	var usuario models.Usuario
	err := r.db.Where("cpf = ?", cpf).First(&usuario).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &usuario, nil
}

// Atualizar salva as alterações de um usuário existente
func (r *usuarioRepository) Atualizar(usuario *models.Usuario) error {
	return r.db.Save(usuario).Error
}

// Deletar remove um usuário pelo seu ID
func (r *usuarioRepository) Deletar(id uint) error {
	return r.db.Delete(&models.Usuario{}, id).Error
}

// Listar retorna todos os usuários cadastrados
func (r *usuarioRepository) Listar() ([]models.Usuario, error) {
	var usuarios []models.Usuario
	err := r.db.Find(&usuarios).Error
	return usuarios, err
}
