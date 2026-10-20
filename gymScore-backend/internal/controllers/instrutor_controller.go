package controllers

import (
	"gymScore-backend/internal/models"
	"gymScore-backend/internal/services"
	"gymScore-backend/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

// InstrutorController gerencia as requisições HTTP relacionadas a instrutores
type InstrutorController struct {
	service services.InstrutorService
}

// NovoInstrutorController cria uma nova instância do controller de instrutores
func NovoInstrutorController(service services.InstrutorService) *InstrutorController {
	return &InstrutorController{service: service}
}

// CriarInstrutor godoc
// @Summary     Tornar-se instrutor
// @Description O usuário LOGADO (JWT) ativa o próprio perfil de instrutor (autônomo). Não aceita id_usuario nem id_academia: o vínculo com a academia é feito por ela em POST /api/academia/instrutores. Só contas de atleta, sem inscrição em desafio aberto/em andamento. O perfil muda na hora (não precisa novo login).
// @Tags        instrutores
// @Accept      json
// @Produce     json
// @Param       body body models.CriarInstrutorRequest true "CREF e especialidade"
// @Success     201 {object} utils.APIResponse{data=models.InstrutorResponse}
// @Failure     400 {object} utils.APIResponse
// @Failure     401 {object} utils.APIResponse
// @Failure     403 {object} utils.APIResponse
// @Failure     409 {object} utils.APIResponse
// @Security    BearerAuth
// @Router      /api/instrutores [post]
func (ctrl *InstrutorController) CriarInstrutor(c *fiber.Ctx) error {
	userID, ok := exigirUsuario(c)
	if !ok {
		return nil
	}
	var req models.CriarInstrutorRequest
	if !lerCorpo(c, &req) {
		return nil
	}
	i, err := ctrl.service.Criar(userID, &req)
	if err != nil {
		return responderErro(c, err)
	}
	return utils.Success(c, fiber.StatusCreated, "Perfil de instrutor ativado com sucesso", i)
}

// Listar godoc
// @Summary     Diretório de instrutores
// @Description Lista os instrutores cadastrados (nome, CREF, especialidade e se são autônomos). Exige login; não expõe e-mail nem CPF. Para os instrutores da sua academia use GET /api/academia/instrutores.
// @Tags        instrutores
// @Produce     json
// @Success     200 {object} utils.APIResponse{data=[]models.InstrutorResponse}
// @Security    BearerAuth
// @Router      /api/instrutores [get]
func (ctrl *InstrutorController) Listar(c *fiber.Ctx) error {
	lista, err := ctrl.service.Listar()
	if err != nil {
		return responderErro(c, err)
	}
	return utils.Success(c, fiber.StatusOK, "ok", lista)
}

// Agenda godoc
// @Summary     Agenda do instrutor
// @Description Desafios em que o instrutor logado é o instrutor designado (DesafioResponse), paginados. Sem status: abertos e em andamento por data_evento crescente. Exige perfil instrutor.
// @Tags        instrutores
// @Produce     json
// @Param       status query string false "aberto | em_andamento | encerrado | cancelado"
// @Param       pagina query int false "Página (1..)"
// @Param       limite query int false "Itens por página (padrão 20, máx. 100)"
// @Success     200 {object} utils.APIResponse{data=models.ListaDesafiosResponse}
// @Failure     400 {object} utils.APIResponse
// @Failure     403 {object} utils.APIResponse
// @Security    BearerAuth
// @Router      /api/instrutor/agenda [get]
func (ctrl *InstrutorController) Agenda(c *fiber.Ctx) error {
	userID, ok := exigirUsuario(c)
	if !ok {
		return nil
	}
	resp, err := ctrl.service.Agenda(userID, models.StatusDesafio(c.Query("status")),
		c.QueryInt("pagina", 1), c.QueryInt("limite", 20))
	if err != nil {
		return responderErro(c, err)
	}
	return utils.Success(c, fiber.StatusOK, "ok", resp)
}
