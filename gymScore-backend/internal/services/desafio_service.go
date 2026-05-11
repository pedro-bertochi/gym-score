package services

import (
	"errors"
	"fmt"

	"gynScore-backend/internal/models"
	"gynScore-backend/internal/repositories"
	"gynScore-backend/pkg/utils"
)

// DesafioService define as operações de negócio para desafios
type DesafioService interface {
	CriarDesafio(req *models.CriarDesafioRequest) (*models.Desafio, error)
	AceitarDesafio(req *models.AceitarDesafioRequest) (*models.Desafio, error)
	IniciarDesafio(req *models.IniciarDesafioRequest) (*models.Desafio, error)
	EncerrarDesafio(req *models.EncerrarDesafioRequest) (*models.Desafio, error)
	Listar() ([]models.Desafio, error)
	ListarPorUsuario(idUsuario uint) ([]models.Desafio, error)
	BuscarPorID(id uint) (*models.Desafio, error)
}

// desafioService é a implementação concreta da camada de serviço
type desafioService struct {
	desafioRepo repositories.DesafioRepository
	usuarioRepo repositories.UsuarioRepository
}

// NovoDesafioService cria uma nova instância do serviço de desafios
func NovoDesafioService(
	desafioRepo repositories.DesafioRepository,
	usuarioRepo repositories.UsuarioRepository,
) DesafioService {
	return &desafioService{
		desafioRepo: desafioRepo,
		usuarioRepo: usuarioRepo,
	}
}

// CriarDesafio valida e persiste um novo desafio
func (s *desafioService) CriarDesafio(req *models.CriarDesafioRequest) (*models.Desafio, error) {
	// Verificar se o criador existe
	criador, err := s.usuarioRepo.BuscarPorID(req.IDCriador)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar criador: %w", err)
	}
	if criador == nil {
		return nil, errors.New("usuário criador não encontrado")
	}

	// Verificar saldo suficiente (equivalente ao endpoint /validar-saldo do Java)
	if !utils.ValidarSaldo(criador.Saldo, req.Valor) {
		return nil, errors.New("saldo insuficiente para criar o desafio")
	}

	desafio := &models.Desafio{
		Titulo:    req.Titulo,
		Descricao: req.Descricao,
		Valor:     req.Valor,
		Local:     req.Local,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		IDCriador: req.IDCriador,
		Status:    models.StatusAberto,
	}

	if err := s.desafioRepo.Criar(desafio); err != nil {
		return nil, fmt.Errorf("erro ao criar desafio: %w", err)
	}

	return desafio, nil
}

// AceitarDesafio registra um usuário como desafiado e muda o status para pendente de início
func (s *desafioService) AceitarDesafio(req *models.AceitarDesafioRequest) (*models.Desafio, error) {
	desafio, err := s.desafioRepo.BuscarPorID(req.IDDesafio)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar desafio: %w", err)
	}
	if desafio == nil {
		return nil, errors.New("desafio não encontrado")
	}
	if desafio.Status != models.StatusAberto {
		return nil, errors.New("desafio não está disponível para aceite")
	}
	if desafio.IDCriador == req.IDUsuario {
		return nil, errors.New("o criador do desafio não pode aceitar o próprio desafio")
	}

	// Verificar saldo do desafiado
	desafiado, err := s.usuarioRepo.BuscarPorID(req.IDUsuario)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar desafiado: %w", err)
	}
	if desafiado == nil {
		return nil, errors.New("usuário desafiado não encontrado")
	}
	if !utils.ValidarSaldo(desafiado.Saldo, desafio.Valor) {
		return nil, errors.New("saldo insuficiente para aceitar o desafio")
	}

	desafio.IDDesafiado = &req.IDUsuario
	desafio.Status = models.StatusPendente

	if err := s.desafioRepo.Atualizar(desafio); err != nil {
		return nil, fmt.Errorf("erro ao aceitar desafio: %w", err)
	}

	return desafio, nil
}

// IniciarDesafio muda o status do desafio para "em andamento"
func (s *desafioService) IniciarDesafio(req *models.IniciarDesafioRequest) (*models.Desafio, error) {
	desafio, err := s.desafioRepo.BuscarPorID(req.IDDesafio)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar desafio: %w", err)
	}
	if desafio == nil {
		return nil, errors.New("desafio não encontrado")
	}
	if desafio.Status != models.StatusPendente {
		return nil, errors.New("desafio não está no estado correto para ser iniciado")
	}

	desafio.Status = models.StatusEmAndamento

	if err := s.desafioRepo.Atualizar(desafio); err != nil {
		return nil, fmt.Errorf("erro ao iniciar desafio: %w", err)
	}

	return desafio, nil
}

// EncerrarDesafio finaliza o desafio e atualiza os saldos dos participantes
// Equivalente à lógica combinada dos endpoints /finalizar-desafio e encerrar_desafio do projeto original
func (s *desafioService) EncerrarDesafio(req *models.EncerrarDesafioRequest) (*models.Desafio, error) {
	desafio, err := s.desafioRepo.BuscarPorID(req.IDDesafio)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar desafio: %w", err)
	}
	if desafio == nil {
		return nil, errors.New("desafio não encontrado")
	}
	if desafio.Status != models.StatusEmAndamento {
		return nil, errors.New("desafio não está em andamento")
	}

	// Buscar vencedor e perdedor
	vencedor, err := s.usuarioRepo.BuscarPorID(req.IDVencedor)
	if err != nil || vencedor == nil {
		return nil, errors.New("vencedor não encontrado")
	}
	perdedor, err := s.usuarioRepo.BuscarPorID(req.IDPerdedor)
	if err != nil || perdedor == nil {
		return nil, errors.New("perdedor não encontrado")
	}

	// Calcular novos saldos (equivalente ao endpoint /finalizar-desafio do Java)
	novoSaldoVencedor, novoSaldoPerdedor := utils.CalcularSaldosAposDesafio(
		vencedor.Saldo,
		perdedor.Saldo,
		desafio.Valor,
	)

	// Atualizar saldos
	vencedor.Saldo = novoSaldoVencedor
	perdedor.Saldo = novoSaldoPerdedor

	if err := s.usuarioRepo.Atualizar(vencedor); err != nil {
		return nil, fmt.Errorf("erro ao atualizar saldo do vencedor: %w", err)
	}
	if err := s.usuarioRepo.Atualizar(perdedor); err != nil {
		return nil, fmt.Errorf("erro ao atualizar saldo do perdedor: %w", err)
	}

	// Atualizar o desafio
	desafio.Status = models.StatusEncerrado
	desafio.IDVencedor = &req.IDVencedor
	desafio.IDPerdedor = &req.IDPerdedor

	if err := s.desafioRepo.Atualizar(desafio); err != nil {
		return nil, fmt.Errorf("erro ao encerrar desafio: %w", err)
	}

	return desafio, nil
}

// Listar retorna todos os desafios cadastrados
func (s *desafioService) Listar() ([]models.Desafio, error) {
	return s.desafioRepo.Listar()
}

// ListarPorUsuario retorna os desafios ativos de um usuário
func (s *desafioService) ListarPorUsuario(idUsuario uint) ([]models.Desafio, error) {
	return s.desafioRepo.ListarPorUsuario(idUsuario)
}

// BuscarPorID retorna um desafio pelo seu ID
func (s *desafioService) BuscarPorID(id uint) (*models.Desafio, error) {
	return s.desafioRepo.BuscarPorID(id)
}
