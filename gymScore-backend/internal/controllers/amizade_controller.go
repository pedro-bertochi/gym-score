package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gynScore-backend/internal/models"
	"gynScore-backend/internal/services"
	"gynScore-backend/pkg/utils"
)

// AmizadeController gerencia as requisições HTTP relacionadas a amizades
type AmizadeController struct {
	service services.AmizadeService
}

// NovoAmizadeController cria uma nova instância do controller de amizades
func NovoAmizadeController(service services.AmizadeService) *AmizadeController {
	return &AmizadeController{service: service}
}

// ListarAmigos godoc
// @Summary     Listar amigos de um usuário
// @Description Retorna a lista de amigos aceitos de um usuário
// @Tags        amigos
// @Produce     json
// @Param       id path int true "ID do usuário"
// @Success     200 {object} utils.APIResponse
// @Router      /api/amigos/{id} [get]
func (ctrl *AmizadeController) ListarAmigos(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return utils.ValidationError(c, "ID inválido")
	}

	amigos, err := ctrl.service.ListarAmigos(uint(id))
	if err != nil {
		return utils.Error(c, fiber.StatusInternalServerError, "Erro ao listar amigos: "+err.Error())
	}

	return utils.Success(c, fiber.StatusOK, "Amigos listados com sucesso", amigos)
}

// AdicionarAmigo godoc
// @Summary     Adicionar amigo
// @Description Envia uma solicitação de amizade para outro usuário
// @Tags        amigos
// @Accept      json
// @Produce     json
// @Param       body body models.AdicionarAmigoRequest true "IDs dos usuários"
// @Success     200 {object} utils.APIResponse
// @Failure     400 {object} utils.APIResponse
// @Router      /api/amigos/adicionar [post]
func (ctrl *AmizadeController) AdicionarAmigo(c *fiber.Ctx) error {
	var req models.AdicionarAmigoRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Corpo da requisição inválido")
	}

	if req.IDUsuario == 0 || req.IDAmigo == 0 {
		return utils.ValidationError(c, "Campos obrigatórios: id_usuario, id_amigo")
	}

	if err := ctrl.service.AdicionarAmigo(&req); err != nil {
		return utils.Error(c, fiber.StatusBadRequest, "Erro ao adicionar amigo: "+err.Error())
	}

	return utils.Success(c, fiber.StatusOK, "Solicitação de amizade enviada com sucesso", fiber.Map{
		"id_usuario": req.IDUsuario,
		"id_amigo":   req.IDAmigo,
	})
}

// AceitarAmizade godoc
// @Summary     Aceitar solicitação de amizade
// @Description Aceita uma solicitação de amizade pendente
// @Tags        amigos
// @Accept      json
// @Produce     json
// @Param       body body models.AceitarAmizadeRequest true "IDs dos usuários"
// @Success     200 {object} utils.APIResponse
// @Failure     400 {object} utils.APIResponse
// @Router      /api/amigos/aceitar [post]
func (ctrl *AmizadeController) AceitarAmizade(c *fiber.Ctx) error {
	var req models.AceitarAmizadeRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Corpo da requisição inválido")
	}

	if req.IDUsuario == 0 || req.IDAmigo == 0 {
		return utils.ValidationError(c, "Campos obrigatórios: id_usuario, id_amigo")
	}

	if err := ctrl.service.AceitarAmizade(&req); err != nil {
		return utils.Error(c, fiber.StatusBadRequest, "Erro ao aceitar amizade: "+err.Error())
	}

	return utils.Success(c, fiber.StatusOK, "Amizade aceita com sucesso", fiber.Map{
		"id_usuario": req.IDUsuario,
		"id_amigo":   req.IDAmigo,
	})
}

// RemoverAmigo godoc
// @Summary     Remover amigo
// @Description Remove o vínculo de amizade entre dois usuários
// @Tags        amigos
// @Accept      json
// @Produce     json
// @Param       body body models.RemoverAmigoRequest true "IDs dos usuários"
// @Success     200 {object} utils.APIResponse
// @Failure     400 {object} utils.APIResponse
// @Router      /api/amigos/remover [post]
func (ctrl *AmizadeController) RemoverAmigo(c *fiber.Ctx) error {
	var req models.RemoverAmigoRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Corpo da requisição inválido")
	}

	if req.IDUsuario == 0 || req.IDAmigo == 0 {
		return utils.ValidationError(c, "Campos obrigatórios: id_usuario, id_amigo")
	}

	if err := ctrl.service.RemoverAmigo(&req); err != nil {
		return utils.Error(c, fiber.StatusBadRequest, "Erro ao remover amigo: "+err.Error())
	}

	return utils.Success(c, fiber.StatusOK, "Amigo removido com sucesso", fiber.Map{
		"id_usuario": req.IDUsuario,
		"id_amigo":   req.IDAmigo,
	})
}
