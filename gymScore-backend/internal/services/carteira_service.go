package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"gymScore-backend/internal/models"
	"gymScore-backend/internal/repositories"
	"gymScore-backend/pkg/utils"
)

// Prazo para considerar um saque 'pending' SEM transferência no Asaas como perdido
// (ex.: o processo caiu entre o débito e a chamada ao Asaas) e reembolsá-lo.
const prazoSaqueOrfao = 5 * time.Minute

// CarteiraService expõe saldo, extrato e saques PIX do usuário do token.
type CarteiraService interface {
	Saldo(userID uint) (*models.SaldoResponse, error)
	Extrato(userID uint, pagina, limite int) (*models.ExtratoResponse, error)
	Sacar(userID uint, req *models.SaqueRequest) (*models.SaqueResponse, error)
	// ConsultarSaque faz o polling no Asaas; reembolsa automaticamente se falhou/cancelou.
	ConsultarSaque(userID, id uint) (*models.SaqueResponse, error)
}

type carteiraService struct {
	carteira *repositories.CarteiraRepository
	usuarios repositories.UsuarioRepository
	asaas    AsaasGateway
	notif    Notificador
	agora    func() time.Time
	// tarifaSaque é debitada junto de cada saque (0 = sem tarifa; PLATAFORMA_TAXA_MODO=inscricao_saque).
	tarifaSaque int64
}

// NovoCarteiraService cria o serviço de carteira.
func NovoCarteiraService(
	carteira *repositories.CarteiraRepository,
	usuarios repositories.UsuarioRepository,
	asaas AsaasGateway,
	notif Notificador,
	tarifaSaqueCentavos int64,
) CarteiraService {
	if tarifaSaqueCentavos < 0 {
		tarifaSaqueCentavos = 0
	}
	return &carteiraService{carteira: carteira, usuarios: usuarios, asaas: asaas, notif: notif, agora: time.Now,
		tarifaSaque: tarifaSaqueCentavos}
}

func (s *carteiraService) Saldo(userID uint) (*models.SaldoResponse, error) {
	v, err := s.carteira.Saldo(userID)
	if err != nil {
		return nil, err
	}
	return &models.SaldoResponse{SaldoCentavos: v, Saldo: utils.CentavosParaReais(v), TarifaSaqueCentavos: s.tarifaSaque}, nil
}

func (s *carteiraService) Extrato(userID uint, pagina, limite int) (*models.ExtratoResponse, error) {
	pagina, limite = normalizarPagina(pagina, limite)
	itens, total, err := s.carteira.Extrato(userID, pagina, limite)
	if err != nil {
		return nil, err
	}
	resp := &models.ExtratoResponse{Itens: make([]models.TransacaoResponse, 0, len(itens)), Total: total, Pagina: pagina, Limite: limite}
	for i := range itens {
		resp.Itens = append(resp.Itens, *paraResponse(&itens[i]))
	}
	return resp, nil
}

// saqueResponse monta o DTO do saque, com a tarifa efetivamente cobrada (0 se devolvida).
func (s *carteiraService) saqueResponse(t *models.Transacao) (*models.SaqueResponse, error) {
	r := paraSaqueResponse(t)
	tarifa, err := s.carteira.TarifaDoSaque(t.ID, t.IDUsuario)
	if err != nil {
		return nil, err
	}
	r.TarifaCentavos = tarifa
	return r, nil
}

func paraSaqueResponse(t *models.Transacao) *models.SaqueResponse {
	valor := -t.ValorCentavos
	r := &models.SaqueResponse{ID: t.ID, ValorCentavos: valor, Valor: utils.CentavosParaReais(valor),
		Status: t.Status, AsaasTransferID: t.AsaasTransferID, CriadoEm: t.CreatedAt}
	if t.Descricao != nil {
		r.Descricao = *t.Descricao
	}
	return r
}

// Sacar debita ANTES de chamar o Asaas (o dinheiro nunca fica disponível em dobro) e
// reembolsa automaticamente se a criação da transferência falhar. Com tarifa de saque, o débito é
// valor + tarifa (o Asaas recebe só o valor pedido); se o PIX falhar, valor e tarifa voltam e a
// receita da plataforma é revertida.
func (s *carteiraService) Sacar(userID uint, req *models.SaqueRequest) (*models.SaqueResponse, error) {
	chave := strings.TrimSpace(req.ChavePix)
	if len(chave) < 3 {
		return nil, erroRequisicao("Chave PIX inválida")
	}
	t, err := s.carteira.IniciarSaqueComTarifa(userID, req.ValorCentavos, s.tarifaSaque, "Saque PIX ("+req.TipoChave+")")
	if err != nil {
		if errors.Is(err, repositories.ErrSaldoInsuficiente) {
			if s.tarifaSaque > 0 {
				return nil, erro(ErroSaldoInsuficiente.Status, fmt.Sprintf("Saldo insuficiente: o saque de %s mais a tarifa de %s exige %s",
					reaisBR(req.ValorCentavos), reaisBR(s.tarifaSaque), reaisBR(req.ValorCentavos+s.tarifaSaque)))
			}
			return nil, ErroSaldoInsuficiente
		}
		return nil, err
	}

	tr, err := s.asaas.CriarTransferenciaPix(utils.CentavosParaReais(req.ValorCentavos), chave, req.TipoChave,
		fmt.Sprintf("Saque GymScore #%d", t.ID))
	if err != nil {
		log.Printf("[SAQUE] Asaas recusou a transferência do saque %d: %v", t.ID, err)
		s.falhar(t.ID, userID, req.ValorCentavos, "A transferência foi recusada pelo banco/Asaas")
		return nil, erro(502, "Não foi possível processar o saque agora. O valor foi devolvido ao seu saldo")
	}
	if err := s.carteira.MarcarTransferencia(t.ID, tr.ID); err != nil {
		// A transferência existe no Asaas; o polling (que usa o ID) não conseguirá achá-la.
		// Mantemos pending e logamos para reconciliação manual: NÃO reembolsar, evita pagar duas vezes.
		log.Printf("[SAQUE] ERRO: saque %d criado no Asaas (%s) mas o ID não foi gravado: %v", t.ID, tr.ID, err)
	}
	t.AsaasTransferID = &tr.ID
	return s.aplicarStatus(userID, t, tr.Status)
}

// falhar reembolsa (idempotente) e notifica uma única vez.
func (s *carteiraService) falhar(id, userID uint, valor int64, motivo string) {
	reembolsou, err := s.carteira.FalharSaque(id)
	if err != nil {
		log.Printf("[SAQUE] ERRO ao reembolsar saque %d: %v", id, err)
		return
	}
	if reembolsou {
		s.notif.Notificar(userID, models.NotifSaqueFalhou, "Saque não concluído",
			fmt.Sprintf("Seu saque de %s falhou e o valor (e a tarifa, se houve) voltou ao saldo. %s", reaisBR(valor), motivo), "/carteira")
	}
}

// aplicarStatus traduz o status do Asaas: DONE conclui; FAILED/CANCELLED reembolsa.
func (s *carteiraService) aplicarStatus(userID uint, t *models.Transacao, statusAsaas string) (*models.SaqueResponse, error) {
	valor := -t.ValorCentavos
	switch strings.ToUpper(statusAsaas) {
	case "DONE":
		concluiu, err := s.carteira.ConcluirSaque(t.ID)
		if err != nil {
			return nil, err
		}
		if concluiu {
			s.notif.Notificar(userID, models.NotifSaqueConcluido, "Saque concluído",
				fmt.Sprintf("Seu saque PIX de %s foi concluído.", reaisBR(valor)), "/carteira")
		}
	case "FAILED", "CANCELLED":
		s.falhar(t.ID, userID, valor, "Status do Asaas: "+strings.ToLower(statusAsaas)+".")
	}
	atual, err := s.carteira.BuscarSaque(t.ID, userID)
	if err != nil {
		return nil, err
	}
	return s.saqueResponse(atual)
}

func (s *carteiraService) ConsultarSaque(userID, id uint) (*models.SaqueResponse, error) {
	t, err := s.carteira.BuscarSaque(id, userID)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, erroNaoEncontrado("Saque não encontrado")
	}
	if t.Status != models.TransacaoPending {
		return s.saqueResponse(t)
	}
	if t.AsaasTransferID == nil {
		// Débito feito, mas a transferência nunca foi criada: após o prazo, reembolsa.
		if s.agora().Sub(t.CreatedAt) > prazoSaqueOrfao {
			s.falhar(t.ID, userID, -t.ValorCentavos, "A transferência não chegou a ser criada.")
			t, err = s.carteira.BuscarSaque(id, userID)
			if err != nil {
				return nil, err
			}
		}
		return s.saqueResponse(t)
	}
	tr, err := s.asaas.BuscarTransferencia(*t.AsaasTransferID)
	if err != nil {
		// Mantém pending; tenta de novo no próximo ciclo de polling
		log.Printf("[SAQUE] falha ao consultar transferência %s: %v", *t.AsaasTransferID, err)
		return s.saqueResponse(t)
	}
	return s.aplicarStatus(userID, t, tr.Status)
}
