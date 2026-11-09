package auth

import (
	"testing"
	"time"
)

func TestNewOTPIsSixDigits(t *testing.T) {
	for i := 0; i < 20; i++ {
		code := newOTP()
		if len(code) != 6 {
			t.Fatalf("length %d for %s", len(code), code)
		}
		if normalizeOTP(code) != code {
			t.Fatalf("digits changed: %s", code)
		}
	}
}

func TestNormalizeOTP(t *testing.T) {
	if got := normalizeOTP(" 12 34-56 "); got != "123456" {
		t.Fatalf("got %s", got)
	}
}

func TestOTPFresh(t *testing.T) {
	now := time.Now()
	later := now.Add(time.Minute)
	past := now.Add(-time.Minute)
	if !otpFresh(&later, now) {
		t.Fatal("future code should be fresh")
	}
	if otpFresh(&past, now) || otpFresh(nil, now) {
		t.Fatal("expired or empty code should be rejected")
	}
}
