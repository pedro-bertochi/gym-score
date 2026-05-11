package utils

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/skip2/go-qrcode"
)

// GeneratePIXPayload gera o código PIX "Copia e Cola" válido (BRCode)
func GeneratePIXPayload(chave, nome, cidade, descricao string, valor float64) string {
	payload := "000201"

	// Merchant Account Information (ID 26)
	gui := "0014br.gov.bcb.pix"
	key := fmt.Sprintf("01%02d%s", len(chave), chave)

	merchantInfo := gui + key
	payload += fmt.Sprintf("26%02d%s", len(merchantInfo), merchantInfo)

	// Categoria
	payload += "52040000"

	// Moeda BRL
	payload += "5303986"

	// Valor
	strValor := fmt.Sprintf("%.2f", valor)
	payload += fmt.Sprintf("54%02d%s", len(strValor), strValor)

	// País
	payload += "5802BR"

	// Nome
	nome = sanitize(nome)
	if len(nome) > 25 {
		nome = nome[:25]
	}
	payload += fmt.Sprintf("59%02d%s", len(nome), nome)

	// Cidade
	cidade = sanitize(cidade)
	if len(cidade) > 15 {
		cidade = cidade[:15]
	}
	payload += fmt.Sprintf("60%02d%s", len(cidade), cidade)

	// TXID
	txid := "SEMID"
	if descricao != "" {
		txid = sanitize(descricao)
	}
	additional := fmt.Sprintf("05%02d%s", len(txid), txid)
	payload += fmt.Sprintf("62%02d%s", len(additional), additional)

	// CRC16
	payload += "6304"
	crc := calculateCRC16(payload)
	payload += crc

	return payload
}

// GenerateQRCodeBase64 gera QR Code em base64
func GenerateQRCodeBase64(content string) (string, error) {
	png, err := qrcode.Encode(content, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(png), nil
}

// Sanitização para padrão PIX
func sanitize(s string) string {
	s = strings.ToUpper(s)

	replacer := strings.NewReplacer(
		"Á", "A", "À", "A", "Ã", "A", "Â", "A",
		"É", "E", "Ê", "E",
		"Í", "I",
		"Ó", "O", "Õ", "O", "Ô", "O",
		"Ú", "U",
		"Ç", "C",
	)
	s = replacer.Replace(s)

	s = strings.TrimSpace(s)
	return s
}

// CRC16 padrão PIX
func calculateCRC16(payload string) string {
	crc := uint16(0xFFFF)
	polynomial := uint16(0x1021)

	for i := 0; i < len(payload); i++ {
		crc ^= uint16(payload[i]) << 8
		for j := 0; j < 8; j++ {
			if (crc & 0x8000) != 0 {
				crc = (crc << 1) ^ polynomial
			} else {
				crc <<= 1
			}
		}
	}

	return strings.ToUpper(fmt.Sprintf("%04X", crc))
}
