package auth

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"strings"
	"time"
)

const otpTTL = 10 * time.Minute

func newOTP() string {
	var buf [4]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "000000"
	}
	n := binary.BigEndian.Uint32(buf[:]) % 1000000
	return fmt.Sprintf("%06d", n)
}

func normalizeOTP(raw string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func otpFresh(expires *time.Time, now time.Time) bool {
	return expires != nil && expires.After(now)
}
