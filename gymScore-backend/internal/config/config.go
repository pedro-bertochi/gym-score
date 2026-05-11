package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Config armazena todas as configurações da aplicação carregadas do .env
type Config struct {
	AppPort    string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	AppEnv     string
	PIXChave     string
	PIXNome      string
	PIXCidade    string
	AsaasAPIKey  string
	AsaasBaseURL string
}

// Load carrega as variáveis de ambiente do arquivo .env
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("[CONFIG] Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	return &Config{
		AppPort:    getEnv("APP_PORT", "3000"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "gymscore"),
			JWTSecret:  getEnv("JWT_SECRET", "gymscore_secret_key_change_in_production"),
			AppEnv:     getEnv("APP_ENV", "development"),
			PIXChave:     getEnv("PIX_CHAVE", "sua-chave-pix@email.com"),
			PIXNome:      getEnv("PIX_NOME_RECEBEDOR", "GYMSCORE SISTEMA"),
			PIXCidade:    getEnv("PIX_CIDADE_RECEBEDOR", "SAO PAULO"),
			AsaasAPIKey:  getEnv("ASAAS_API_KEY", ""),
			AsaasBaseURL: getEnv("ASAAS_BASE_URL", "https://sandbox.asaas.com/api"),
		}
	}

// ConnectDB inicializa a conexão com o banco de dados MySQL via GORM
func ConnectDB(cfg *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	logLevel := logger.Silent
	if cfg.AppEnv == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao banco de dados: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("falha ao obter instância do banco: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	log.Println("[CONFIG] Conexão com o banco de dados estabelecida com sucesso")
	return db, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
