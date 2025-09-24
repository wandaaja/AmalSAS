package services

import (
	"fmt"
	"net/smtp"
	"os"
)

type EmailService struct {
	SMTPHost  string
	SMTPPort  string
	Username  string
	Password  string
	FromEmail string
	BaseURL   string
}

func NewEmailService() *EmailService {
	return &EmailService{
		SMTPHost:  os.Getenv("SMTP_HOST"),
		SMTPPort:  os.Getenv("SMTP_PORT"),
		Username:  os.Getenv("EMAIL_SYSTEM"),
		Password:  os.Getenv("PASSWORD_SYSTEM"),
		FromEmail: os.Getenv("EMAIL_SYSTEM"),
		BaseURL:   os.Getenv("FRONTEND_URL"),
	}
}

func (es *EmailService) SendResetEmail(to, token string) error {
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", es.BaseURL, token)

	subject := "Reset Password Request"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Reset Password</h2>
			<p>Klik link berikut untuk reset password Anda:</p>
			<p><a href="%s">%s</a></p>
			<p>Link ini berlaku selama 1 jam.</p>
			<p>Jika Anda tidak meminta reset, abaikan email ini.</p>
		</body>
		</html>
	`, resetLink, resetLink)

	auth := smtp.PlainAuth("", es.Username, es.Password, es.SMTPHost)
	toList := []string{to}

	msg := []byte(fmt.Sprintf(
		"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		to, subject, body,
	))

	return smtp.SendMail(
		fmt.Sprintf("%s:%s", es.SMTPHost, es.SMTPPort),
		auth,
		es.FromEmail,
		toList,
		msg,
	)
}
