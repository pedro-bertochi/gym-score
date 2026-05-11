package middlewares

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORSMiddleware configura o middleware de CORS para permitir comunicação com o frontend
func CORSMiddleware() fiber.Handler {
	return cors.New(cors.Config{
		// Em produção, substitua "*" pelo domínio real do frontend
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		ExposeHeaders:    "Content-Length",
		AllowCredentials: false,
		MaxAge:           86400, // 24 horas de cache para preflight
	})
}
