package mail

import (
	"strings"
	"testing"
)

func TestRenderRegistrationOTP(t *testing.T) {
	subject, text, htmlBody := RenderRegistrationOTP(OTPEmail{
		Name:         "Budi",
		Code:         "482931",
		VerifyURL:    "https://atozika.id/auth/verify",
		SupportEmail: "support@atozika.id",
		Brand:        "ATOZIKA",
	})
	if subject != "Kode OTP pendaftaran ATOZIKA" {
		t.Fatalf("subject %q", subject)
	}
	if !strings.Contains(text, "482931") || !strings.Contains(text, "Budi") {
		t.Fatalf("plain text missing code or name: %s", text)
	}
	if !strings.Contains(htmlBody, "482931") || !strings.Contains(htmlBody, "support@atozika.id") {
		t.Fatalf("html missing code or support email")
	}
	if !strings.Contains(htmlBody, "https://atozika.id/logo-atozika.png") || !strings.Contains(htmlBody, "Verifikasi Pendaftaran") {
		t.Fatalf("html missing logo or Indonesian copy")
	}
	if strings.Contains(htmlBody, "icon-circle") || strings.Contains(htmlBody, "Verify Your Registration") {
		t.Fatal("old English illustration is still in the template")
	}
	if !strings.Contains(text, "https://atozika.id/auth/verify") {
		t.Fatalf("plain text missing verify link")
	}
	if strings.Contains(htmlBody, "{{") || strings.Contains(htmlBody, "Your Company") {
		t.Fatal("template placeholders were not filled")
	}
}
