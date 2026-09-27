package auth

import (
	"fmt"
	"unicode"
)

const (
	phoneMinDigits = 10
	phoneMaxDigits = 15
)

func NormalizePhone(phone string) (string, error) {
	digits := make([]rune, 0, len(phone))
	for _, r := range phone {
		if unicode.IsDigit(r) {
			digits = append(digits, r)
		}
	}
	normalized := string(digits)
	if len(normalized) < phoneMinDigits {
		return "", fmt.Errorf("Nomor Tlp/WA harus berupa angka, minimal %d digit", phoneMinDigits)
	}
	if len(normalized) > phoneMaxDigits {
		return "", fmt.Errorf("Nomor Tlp/WA maksimal %d digit", phoneMaxDigits)
	}
	return normalized, nil
}
