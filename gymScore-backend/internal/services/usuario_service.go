package services

import (
	"errors"
	"fmt"
	"regexp"

	"golang.org/x/crypto/bcrypt"
	"gynScore-backend/internal/models"
	"gynScore-backend/internal/repositories"
	"gynScore-backend/pkg/utils"
)

// UsuarioService define as operações de negócio para usuários
type UsuarioService interface {
	CriarUsuario(req *models.CriarUsuarioRequest) (*models.UsuarioResponse, error)
	Login(req *models.LoginRequest, jwtSecret string) (*models.LoginResponse, error)
	BuscarPorID(id uint) (*models.UsuarioResponse, error)
	Listar() ([]models.UsuarioResponse, error)
}

// usuarioService é a implementação concreta da camada de serviço
type usuarioService struct {
	repo repositories.UsuarioRepository
}

// NovoUsuarioService cria uma nova instância do serviço de usuários
func NovoUsuarioService(repo repositories.UsuarioRepository) UsuarioService {
	return &usuarioService{repo: repo}
}

// CriarUsuario valida os dados e persiste um novo usuário no banco
func (s *usuarioService) CriarUsuario(req *models.CriarUsuarioRequest) (*models.UsuarioResponse, error) {
	// 1. Validação de e-mail via regex
	if !utils.ValidarEmail(req.Email) {
		return nil, errors.New("e-mail inválido")
	}

	// 2. Validação RIGOROSA de CPF conforme a request (14 caracteres: 000.000.000-00)
	if len(req.CPF) != 14 {
		return nil, errors.New("CPF deve estar no formato 000.000.000-00 (14 caracteres)")
	}

	// Limpar apenas para validar o algoritmo, mas salvar o original da request
	re := regexp.MustCompile(`[^0-9]`)
	cpfLimpo := re.ReplaceAllString(req.CPF, "")
	if len(cpfLimpo) != 11 {
		return nil, errors.New("CPF informado contém caracteres inválidos ou quantidade de dígitos incorreta")
	}
	
	if !utils.ValidarCPF(cpfLimpo) {
		return nil, errors.New("CPF informado é inválido")
	}

	// 3. Verificar duplicidade de e-mail e CPF (usando o valor exato da request)
	existenteEmail, _ := s.repo.BuscarPorEmail(req.Email)
	if existenteEmail != nil {
		return nil, errors.New("e-mail já cadastrado")
	}

	existenteCPF, _ := s.repo.BuscarPorCPF(req.CPF)
	if existenteCPF != nil {
		return nil, errors.New("CPF já cadastrado")
	}

	// 4. Hash da senha com bcrypt
	hashSenha, err := bcrypt.GenerateFromPassword([]byte(req.Senha), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("erro ao processar senha: %w", err)
	}

	// 5. Criar entidade e salvar exatamente como enviado
	usuario := &models.Usuario{
		Nome:           req.Nome,
		Sobrenome:      req.Sobrenome,
		Email:          req.Email,
		CPF:            req.CPF, // Mantém o valor exato da request
		Senha:          string(hashSenha),
		DataNascimento: req.DataNascimento,
		Genero:         req.Genero,
		Saldo:          0.00,
	}

	if err := s.repo.Criar(usuario); err != nil {
		return nil, fmt.Errorf("erro ao criar usuário: %w", err)
	}

	return toUsuarioResponse(usuario), nil
}

// Login autentica o usuário e retorna um token JWT
func (s *usuarioService) Login(req *models.LoginRequest, jwtSecret string) (*models.LoginResponse, error) {
	usuario, err := s.repo.BuscarPorEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar usuário: %w", err)
	}
	if usuario == nil {
		return nil, errors.New("usuário ou senha inválidos")
	}

	// Comparar senha com o hash armazenado
	if err := bcrypt.CompareHashAndPassword([]byte(usuario.Senha), []byte(req.Senha)); err != nil {
		return nil, errors.New("usuário ou senha inválidos")
	}

	// Gerar token JWT
	token, err := utils.GerarToken(usuario.ID, usuario.Email, jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar token: %w", err)
	}

	return &models.LoginResponse{
		Token:   token,
		Usuario: *toUsuarioResponse(usuario),
	}, nil
}

// BuscarPorID retorna os dados públicos de um usuário pelo ID
func (s *usuarioService) BuscarPorID(id uint) (*models.UsuarioResponse, error) {
	usuario, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar usuário: %w", err)
	}
	if usuario == nil {
		return nil, nil
	}
	return toUsuarioResponse(usuario), nil
}

// Listar retorna todos os usuários cadastrados
func (s *usuarioService) Listar() ([]models.UsuarioResponse, error) {
	usuarios, err := s.repo.Listar()
	if err != nil {
		return nil, fmt.Errorf("erro ao listar usuários: %w", err)
	}

	var respostas []models.UsuarioResponse
	for _, u := range usuarios {
		respostas = append(respostas, *toUsuarioResponse(&u))
	}
	return respostas, nil
}

// toUsuarioResponse converte o model para o DTO de resposta pública
func toUsuarioResponse(u *models.Usuario) *models.UsuarioResponse {
	return &models.UsuarioResponse{
		ID:             u.ID,
		Nome:           u.Nome,
		Sobrenome:      u.Sobrenome,
		Email:          u.Email,
		CPF:            u.CPF,
		DataNascimento: u.DataNascimento,
		Genero:         u.Genero,
		Saldo:          u.Saldo,
		CriadoEm:       u.CriadoEm,
	}
}
