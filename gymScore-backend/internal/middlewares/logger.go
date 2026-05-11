package middlewares

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// LoggerMiddleware configura o middleware de log estruturado das requisições HTTP
func LoggerMiddleware() fiber.Handler {
	return logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${latency} | ${method} ${path} | IP: ${ip}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "America/Sao_Paulo",
	})
}
