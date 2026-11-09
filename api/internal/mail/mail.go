package mail

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/smtp"
	"strings"

	"atozika/internal/config"
)

var ErrNotConfigured = errors.New("smtp belum dikonfigurasi")

func Send(cfg config.Config, to, subject, body string) error {
	return SendHTML(cfg, to, subject, body, "")
}

func SendHTML(cfg config.Config, to, subject, textBody, htmlBody string) error {
	host := strings.TrimSpace(cfg.SMTPHost)
	from := strings.TrimSpace(cfg.SMTPFromEmail)
	to = strings.TrimSpace(to)
	if host == "" || from == "" {
		return ErrNotConfigured
	}
	if strings.ContainsAny(to, "\r\n") || strings.ContainsAny(subject, "\r\n") || !strings.Contains(to, "@") {
		return errors.New("alamat email tidak valid")
	}
	port := cfg.SMTPPort
	if port == 0 {
		port = 587
	}
	addr := fmt.Sprintf("%s:%d", host, port)
	var auth smtp.Auth
	if strings.TrimSpace(cfg.SMTPUser) != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, host)
	}
	msg := buildMessage(formatFrom(cfg.SMTPFromName, from), to, subject, textBody, htmlBody)
	if port == 465 {
		return sendImplicitTLS(addr, host, auth, from, to, msg)
	}
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}

func buildMessage(from, to, subject, textBody, htmlBody string) []byte {
	subject = strings.NewReplacer("\r", "", "\n", "").Replace(subject)
	if strings.TrimSpace(htmlBody) == "" {
		return []byte(strings.Join([]string{
			"From: " + from,
			"To: " + to,
			"Subject: " + subject,
			"MIME-Version: 1.0",
			"Content-Type: text/plain; charset=UTF-8",
			"Content-Transfer-Encoding: 8bit",
			"",
			strings.ReplaceAll(textBody, "\n", "\r\n"),
		}, "\r\n"))
	}
	boundary := "atozika-" + randomBoundary()
	parts := []string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		`Content-Type: multipart/alternative; boundary="` + boundary + `"`,
		"",
		"--" + boundary,
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
		"",
		encodeBase64(strings.ReplaceAll(textBody, "\n", "\r\n")),
		"--" + boundary,
		"Content-Type: text/html; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
		"",
		encodeBase64(htmlBody),
		"--" + boundary + "--",
		"",
	}
	return []byte(strings.Join(parts, "\r\n"))
}

func encodeBase64(body string) string {
	raw := base64.StdEncoding.EncodeToString([]byte(body))
	var buf strings.Builder
	for i := 0; i < len(raw); i += 76 {
		end := i + 76
		if end > len(raw) {
			end = len(raw)
		}
		buf.WriteString(raw[i:end])
		buf.WriteString("\r\n")
	}
	return buf.String()
}

func randomBoundary() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "boundary"
	}
	return hex.EncodeToString(b[:])
}

func formatFrom(name, email string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return email
	}
	return fmt.Sprintf("%s <%s>", name, email)
}

func sendImplicitTLS(addr, host string, auth smtp.Auth, from, to string, msg []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
	if err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}
	if err := client.Mail(from); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(msg); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return client.Quit()
}
