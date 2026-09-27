package auth

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

const (
	passwordMinLength = 8
	passwordMaxLength = 72
)

var (
	passwordLower   = regexp.MustCompile(`[a-z]`)
	passwordUpper   = regexp.MustCompile(`[A-Z]`)
	passwordDigit   = regexp.MustCompile(`[0-9]`)
	passwordSpecial = regexp.MustCompile(`[^A-Za-z0-9]`)
)

func ValidatePassword(password string) error {
	if strings.TrimSpace(password) == "" {
		return errors.New("Password wajib diisi")
	}
	if len(password) < passwordMinLength {
		return fmt.Errorf("Password minimal %d karakter", passwordMinLength)
	}
	if len(password) > passwordMaxLength {
		return fmt.Errorf("Password maksimal %d karakter", passwordMaxLength)
	}

	var missing []string
	if !passwordLower.MatchString(password) {
		missing = append(missing, "huruf kecil")
	}
	if !passwordUpper.MatchString(password) {
		missing = append(missing, "huruf besar")
	}
	if !passwordDigit.MatchString(password) {
		missing = append(missing, "angka")
	}
	if !passwordSpecial.MatchString(password) {
		missing = append(missing, "simbol")
	}
	if len(missing) > 0 {
		return fmt.Errorf("Password harus berisi %s", strings.Join(missing, ", "))
	}

	for _, r := range password {
		if unicode.IsSpace(r) {
			return errors.New("Password tidak boleh mengandung spasi")
		}
	}
	return nil
}
