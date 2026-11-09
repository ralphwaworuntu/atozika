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
		SupportEmail: "hallo@atozika.id",
		Brand:        "ATOZIKA",
	})
	if subject != "Kode OTP ATOZIKA" {
		t.Fatalf("subject %q", subject)
	}
	if !strings.Contains(text, "482931") || !strings.Contains(text, "Budi") {
		t.Fatalf("plain text missing code or name: %s", text)
	}
	if !strings.Contains(htmlBody, "482931") || !strings.Contains(htmlBody, "hallo@atozika.id") {
		t.Fatalf("html missing code or support email")
	}
	if !strings.Contains(text, "https://atozika.id/auth/verify") {
		t.Fatalf("plain text missing verify link")
	}
	if strings.Contains(htmlBody, "{{") || strings.Contains(htmlBody, "Your Company") {
		t.Fatal("template placeholders were not filled")
	}
}
