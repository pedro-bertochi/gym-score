package controllers

import (
	"gynScore-backend/internal/models"
	"gynScore-backend/internal/services"
	"gynScore-backend/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type PIXController interface {
	GerarPagamento(c *fiber.Ctx) error
}

type pixController struct {
	pixService services.PIXService
}

func NovoPIXController(pixService services.PIXService) PIXController {
	return &pixController{pixService}
}

func (ctrl *pixController) GerarPagamento(c *fiber.Ctx) error {
	var req models.PIXRequest

	if err := c.BodyParser(&req); err != nil {
		return utils.Error(c, fiber.StatusBadRequest, "Corpo inválido")
	}

	if req.IDUsuario == 0 {
		if userID := c.Locals("user_id"); userID != nil {
			req.IDUsuario = userID.(uint)
		}
	}

	if req.IDUsuario == 0 {
		return utils.Error(c, fiber.StatusBadRequest, "ID do usuário obrigatório")
	}

	response, err := ctrl.pixService.GerarPagamento(req)
	if err != nil {
		return utils.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.Success(c, fiber.StatusOK, "PIX gerado com sucesso", response)
}
