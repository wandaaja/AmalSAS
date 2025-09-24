package services

import (
	"fmt"
	"os"
)

type WhatsAppService struct {
	APIKey     string
	APISecret  string
	FromNumber string
	BaseURL    string
}

func NewWhatsAppService() *WhatsAppService {
	return &WhatsAppService{
		APIKey:     os.Getenv("WHATSAPP_API_KEY"),
		APISecret:  os.Getenv("WHATSAPP_API_SECRET"),
		FromNumber: os.Getenv("WHATSAPP_FROM_NUMBER"),
		BaseURL:    os.Getenv("FRONTEND_URL"),
	}
}

func (ws *WhatsAppService) SendResetMessage(to, token string) error {
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", ws.BaseURL, token)
	message := fmt.Sprintf(
		"Halo! Untuk reset password Anda, silakan klik link berikut: %s\n\nLink berlaku 1 jam.",
		resetLink,
	)

	// Simulasi kirim WA
	fmt.Printf("=== WHATSAPP MESSAGE ===\n")
	fmt.Printf("Kepada: %s\n", to)
	fmt.Printf("Dari: %s\n", ws.FromNumber)
	fmt.Printf("Pesan: %s\n", message)
	fmt.Printf("========================\n")

	return nil
}
