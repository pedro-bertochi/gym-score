package utils_test

import (
	"testing"

	"gynScore-backend/pkg/utils"
)

// ─── Testes de ValidarEmail ───────────────────────────────────────────────────

func TestValidarEmail_Validos(t *testing.T) {
	emails := []string{
		"usuario@example.com",
		"nome.sobrenome@empresa.com.br",
		"user+tag@domain.org",
		"test123@test.io",
	}

	for _, email := range emails {
		if !utils.ValidarEmail(email) {
			t.Errorf("esperava e-mail válido para: %s", email)
		}
	}
}

func TestValidarEmail_Invalidos(t *testing.T) {
	emails := []string{
		"email-sem-arroba",
		"@dominio.com",
		"usuario@",
		"usuario@.com",
		"",
		"usuario@dominio",
	}

	for _, email := range emails {
		if utils.ValidarEmail(email) {
			t.Errorf("esperava e-mail inválido para: %s", email)
		}
	}
}

// ─── Testes de ValidarSaldo ───────────────────────────────────────────────────

func TestValidarSaldo_Suficiente(t *testing.T) {
	if !utils.ValidarSaldo(100.00, 50.00) {
		t.Error("saldo 100 deve ser suficiente para desafio de 50")
	}
	if !utils.ValidarSaldo(50.00, 50.00) {
		t.Error("saldo igual ao valor deve ser suficiente")
	}
}

func TestValidarSaldo_Insuficiente(t *testing.T) {
	if utils.ValidarSaldo(30.00, 50.00) {
		t.Error("saldo 30 não deve ser suficiente para desafio de 50")
	}
	if utils.ValidarSaldo(0.00, 10.00) {
		t.Error("saldo zero não deve ser suficiente")
	}
}

// ─── Testes de CalcularSaldosAposDesafio ─────────────────────────────────────

func TestCalcularSaldosAposDesafio(t *testing.T) {
	// Vencedor com saldo 200, perdedor com saldo 150, valor apostado 100
	novoVencedor, novoPerdedor := utils.CalcularSaldosAposDesafio(200.00, 150.00, 100.00)

	if novoVencedor != 300.00 {
		t.Errorf("esperava saldo do vencedor 300.00, obteve %.2f", novoVencedor)
	}
	if novoPerdedor != 100.00 {
		t.Errorf("esperava saldo do perdedor 100.00, obteve %.2f", novoPerdedor)
	}
}
