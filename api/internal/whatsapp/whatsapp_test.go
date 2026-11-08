package whatsapp

import (
	"strings"
	"testing"
)

func TestNormalizePhone(t *testing.T) {
	got, ok := NormalizePhone("0812-3456-7890")
	if !ok || got != "6281234567890" {
		t.Fatalf("local format: %s %v", got, ok)
	}
	got, ok = NormalizePhone("+62 812 3456 7890")
	if !ok || got != "6281234567890" {
		t.Fatalf("plus format: %s %v", got, ok)
	}
	if _, ok = NormalizePhone("123"); ok {
		t.Fatal("short number should be rejected")
	}
}

func TestReportTextIncludesCode(t *testing.T) {
	text := ReportText("Yohanes", "Tryout", "TIU", 80, 8, 10, "ortu-yohanes", "https://atozika.id/orang-tua")
	for _, part := range []string{"Yohanes", "Tryout: TIU", "Skor: 80 (8/10 benar)", "ortu-yohanes", "https://atozika.id/orang-tua"} {
		if !strings.Contains(text, part) {
			t.Fatalf("missing %q in %s", part, text)
		}
	}
}
