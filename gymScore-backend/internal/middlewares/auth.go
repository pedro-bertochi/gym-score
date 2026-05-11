package middlewares

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"gynScore-backend/internal/config"
	"gynScore-backend/pkg/utils"
)

// AuthMiddleware valida o token JWT presente no cabeçalho Authorization ou em um Cookie
func AuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var token string

		// 1. Tentar obter o token do cabeçalho Authorization
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				token = parts[1]
			}
		}

		// 2. Se não houver token no header, tentar obter do Cookie "jwt"
		if token == "" {
			token = c.Cookies("jwt")
		}

		if token == "" {
			return utils.Error(c, fiber.StatusUnauthorized, "Token de autenticação não fornecido")
		}

		// 3. Validar o token encontrado
		claims, err := utils.ValidarToken(token, cfg.JWTSecret)
		if err != nil {
			return utils.Error(c, fiber.StatusUnauthorized, "Token inválido ou expirado")
		}

		// Armazena os dados do usuário autenticado no contexto da requisição
		c.Locals("user_id", claims.UserID)
		c.Locals("user_email", claims.Email)

		return c.Next()
	}
}
