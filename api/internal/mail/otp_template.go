package mail

import (
	_ "embed"
	"html"
	"strings"
	"time"
)

//go:embed registration_otp.html
var registrationOTPHTML string

type OTPEmail struct {
	Name         string
	Code         string
	VerifyURL    string
	SupportEmail string
	Brand        string
}

func RenderRegistrationOTP(data OTPEmail) (subject, text, htmlBody string) {
	brand := strings.TrimSpace(data.Brand)
	if brand == "" {
		brand = "ATOZIKA"
	}
	support := strings.TrimSpace(data.SupportEmail)
	if support == "" {
		support = "support@atozika.id"
	}
	logo := "https://atozika.id/logo-green.png"
	who := strings.TrimSpace(data.Name)
	if who == "" {
		who = "Sahabat " + brand
	}
	year := time.Now().Format("2006")
	htmlBody = registrationOTPHTML
	htmlBody = strings.ReplaceAll(htmlBody, "{{brand}}", html.EscapeString(brand))
	htmlBody = strings.ReplaceAll(htmlBody, "{{otp_code}}", html.EscapeString(data.Code))
	htmlBody = strings.ReplaceAll(htmlBody, "{{verify_url}}", html.EscapeString(data.VerifyURL))
	htmlBody = strings.ReplaceAll(htmlBody, "{{support_email}}", html.EscapeString(support))
	htmlBody = strings.ReplaceAll(htmlBody, "{{logo_url}}", html.EscapeString(logo))
	htmlBody = strings.ReplaceAll(htmlBody, "{{year}}", year)

	subject = "Kode OTP pendaftaran " + brand
	text = strings.Join([]string{
		"Halo " + who + ",",
		"",
		"Terima kasih telah mendaftar. Kode OTP pendaftaran " + brand + " Anda:",
		"",
		data.Code,
		"",
		"Kode ini berlaku 10 menit. Jangan berikan kode ini kepada siapa pun.",
		"Verifikasi akun: " + data.VerifyURL,
		"",
		"Jika Anda tidak merasa mendaftar, abaikan email ini.",
		"Butuh bantuan? Hubungi " + support,
	}, "\n")
	return subject, text, htmlBody
}
