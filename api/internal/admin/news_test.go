package admin

import "testing"

func TestNormalizeNewsKind(t *testing.T) {
	got, err := normalizeNewsKind("")
	if err != nil || got != "EDUKASI" {
		t.Fatalf("empty: %s %v", got, err)
	}
	got, err = normalizeNewsKind("kuota")
	if err != nil || got != "KUOTA" {
		t.Fatalf("kuota: %s %v", got, err)
	}
	if _, err = normalizeNewsKind("random"); err == nil {
		t.Fatal("expected invalid kind")
	}
}
