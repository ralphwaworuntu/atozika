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
	Title        string
	Subtitle     string
	Disclaimer   string
	Subject      string
	Intro        string
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
	title := strings.TrimSpace(data.Title)
	if title == "" {
		title = "Verifikasi Pendaftaran"
	}
	subtitle := strings.TrimSpace(data.Subtitle)
	if subtitle == "" {
		subtitle = "Terima kasih telah mendaftar. Gunakan kode OTP di bawah ini untuk menyelesaikan pendaftaran Anda."
	}
	disclaimer := strings.TrimSpace(data.Disclaimer)
	if disclaimer == "" {
		disclaimer = "Jika Anda tidak merasa mendaftar, abaikan email ini."
	}
	intro := strings.TrimSpace(data.Intro)
	if intro == "" {
		intro = "Terima kasih telah mendaftar. Kode OTP pendaftaran " + brand + " Anda:"
	}
	subject = strings.TrimSpace(data.Subject)
	if subject == "" {
		subject = "Kode OTP pendaftaran " + brand
	}
	year := time.Now().Format("2006")
	htmlBody = registrationOTPHTML
	htmlBody = strings.ReplaceAll(htmlBody, "{{brand}}", html.EscapeString(brand))
	htmlBody = strings.ReplaceAll(htmlBody, "{{otp_code}}", html.EscapeString(data.Code))
	htmlBody = strings.ReplaceAll(htmlBody, "{{verify_url}}", html.EscapeString(data.VerifyURL))
	htmlBody = strings.ReplaceAll(htmlBody, "{{support_email}}", html.EscapeString(support))
	htmlBody = strings.ReplaceAll(htmlBody, "{{logo_url}}", html.EscapeString(logo))
	htmlBody = strings.ReplaceAll(htmlBody, "{{email_title}}", html.EscapeString(title))
	htmlBody = strings.ReplaceAll(htmlBody, "{{email_subtitle}}", html.EscapeString(subtitle))
	htmlBody = strings.ReplaceAll(htmlBody, "{{email_disclaimer}}", html.EscapeString(disclaimer))
	htmlBody = strings.ReplaceAll(htmlBody, "{{year}}", year)

	text = strings.Join([]string{
		"Halo " + who + ",",
		"",
		intro,
		"",
		data.Code,
		"",
		"Kode ini berlaku 10 menit. Jangan berikan kode ini kepada siapa pun.",
		"Lanjutkan di: " + data.VerifyURL,
		"",
		disclaimer,
		"Butuh bantuan? Hubungi " + support,
	}, "\n")
	return subject, text, htmlBody
}

func RenderPasswordResetOTP(data OTPEmail) (subject, text, htmlBody string) {
	brand := strings.TrimSpace(data.Brand)
	if brand == "" {
		brand = "ATOZIKA"
	}
	data.Title = "Ganti Password"
	data.Subtitle = "Gunakan kode OTP di bawah ini untuk membuat password baru."
	data.Disclaimer = "Jika Anda tidak meminta penggantian password, abaikan email ini."
	data.Subject = "Kode OTP ganti password " + brand
	data.Intro = "Kode OTP untuk mengganti password " + brand + " Anda:"
	return RenderRegistrationOTP(data)
}
