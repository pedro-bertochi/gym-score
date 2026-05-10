package services

import (
	"fmt"
	"gynScore-backend/internal/client"
	"gynScore-backend/internal/models"
	"gynScore-backend/internal/repositories"
	"gynScore-backend/pkg/utils"
)

type PIXService interface {
	GerarPagamento(req models.PIXRequest) (*models.PIXResponse, error)
}

type pixService struct {
	asaasClient   *client.AsaasClient
	usuarioRepo   repositories.UsuarioRepository
	transacaoRepo repositories.TransacaoRepository
}

func NovoPIXService(
	asaasClient *client.AsaasClient,
	usuarioRepo repositories.UsuarioRepository,
	transacaoRepo repositories.TransacaoRepository,
) PIXService {
	return &pixService{asaasClient, usuarioRepo, transacaoRepo}
}

func (s *pixService) GerarPagamento(req models.PIXRequest) (*models.PIXResponse, error) {
	if req.Valor <= 0 {
		return nil, fmt.Errorf("valor do depósito deve ser maior que zero")
	}
	if req.Valor < 5 {
		return nil, fmt.Errorf("valor mínimo para depósito PIX é R$ 5,00")
	}
	if !utils.ValidarCPF(req.CPF) {
		return nil, fmt.Errorf("CPF informado é inválido")
	}

	usuario, err := s.usuarioRepo.BuscarPorID(req.IDUsuario)
	if err != nil {
		return nil, fmt.Errorf("usuário não encontrado: %w", err)
	}

	descricao := fmt.Sprintf("Depósito GymScore - usuário %d", usuario.ID)

	payment, err := s.asaasClient.CriarCobrancaPix(
		fmt.Sprintf("%s %s", usuario.Nome, usuario.Sobrenome),
		req.CPF,
		req.Valor,
		descricao,
	)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar cobrança no Asaas: %w", err)
	}

	qrCode, err := s.asaasClient.BuscarPixQrCode(payment.ID)
	if err != nil {
		return nil, fmt.Errorf("falha ao obter QR Code PIX: %w", err)
	}

	transacao := &models.Transacao{
		IDUsuario:      usuario.ID,
		AsaasPaymentID: payment.ID,
		Valor:          req.Valor,
		Status:         "pending",
	}
	if err := s.transacaoRepo.Criar(transacao); err != nil {
		return nil, fmt.Errorf("falha ao salvar transação: %w", err)
	}

	return &models.PIXResponse{
		QRCodeBase64:   qrCode.EncodedImage,
		Payload:        qrCode.Payload,
		ExpirationDate: qrCode.ExpirationDate,
		AsaasPaymentID: payment.ID,
	}, nil
}
