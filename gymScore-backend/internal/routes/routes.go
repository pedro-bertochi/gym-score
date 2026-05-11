package routes

import (
	"github.com/gofiber/fiber/v2"
	"gynScore-backend/internal/config"
	"gynScore-backend/internal/controllers"
	"gynScore-backend/internal/middlewares"
)

// Setup registra todas as rotas da aplicação no servidor Fiber
// Mantém compatibilidade com as rotas originais do projeto Node.js
func Setup(
	app *fiber.App,
	cfg *config.Config,
	usuarioCtrl *controllers.UsuarioController,
	desafioCtrl *controllers.DesafioController,
	amizadeCtrl *controllers.AmizadeController,
	pixCtrl controllers.PIXController,
	webhookCtrl *controllers.WebhookController,
) {
	// Rota de health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "GymScore API",
			"version": "1.0.0",
		})
	})

	// Grupo de rotas da API
	api := app.Group("/api")

	// ─── Rotas públicas (sem autenticação) ───────────────────────────────────────

	// Autenticação
	api.Post("/login", usuarioCtrl.Login)

	// Cadastro de usuário
	api.Post("/usuarios", usuarioCtrl.CriarUsuario)

	// ─── Rotas protegidas (requerem JWT) ─────────────────────────────────────────
	protected := api.Group("", middlewares.AuthMiddleware(cfg))

	// Usuários
	protected.Get("/usuarios", usuarioCtrl.ListarUsuarios)
	protected.Get("/usuarios/:id", usuarioCtrl.BuscarUsuario)

	// Desafios — rotas específicas ANTES das rotas com parâmetro dinâmico
	protected.Get("/desafios/view", desafioCtrl.ListarDesafios)
	protected.Post("/desafios/aceitar_desafio", desafioCtrl.AceitarDesafio)
	protected.Post("/desafios/iniciar", desafioCtrl.IniciarDesafio)
	protected.Post("/desafios/encerrar", desafioCtrl.EncerrarDesafio)
	protected.Post("/desafios", desafioCtrl.CriarDesafio)
	protected.Get("/desafios/:id", desafioCtrl.ListarDesafiosPorUsuario)

	// Amigos — rotas específicas ANTES das rotas com parâmetro dinâmico
	protected.Post("/amigos/adicionar", amizadeCtrl.AdicionarAmigo)
	protected.Post("/amigos/aceitar", amizadeCtrl.AceitarAmizade)
	protected.Post("/amigos/remover", amizadeCtrl.RemoverAmigo)
	protected.Get("/amigos/:id", amizadeCtrl.ListarAmigos)

	// Pagamento PIX (Depósito de Saldo)
	protected.Post("/pagamento/pix", pixCtrl.GerarPagamento)

	// Webhook Asaas (rota pública — sem JWT)
	api.Post("/webhooks/asaas", webhookCtrl.ReceberWebhookAsaas)
}
