package auth

import (
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode"

	"atozika/internal/httpx"
	"atozika/internal/models"
)

var (
	genderOptions = map[string]bool{"L": true, "P": true}
	gradeOptions  = map[string]bool{"10": true, "11": true, "12": true}
	targetOptions = map[string]bool{
		"Akpol": true, "Akmil": true, "Bintara": true, "Tamtama": true, "Kedinasan": true,
	}
	eyeOptions = map[string]bool{
		"Normal": true, "Minus": true, "Plus": true, "Silinder": true, "Buta Warna": true,
	}
	incomeOptions = map[string]bool{
		"Di bawah Rp2 juta": true,
		"Rp2–5 juta":        true,
		"Rp5–10 juta":       true,
		"Di atas Rp10 juta": true,
	}
)

func profileUpdates(current models.User, body map[string]any) (map[string]any, error) {
	updates := map[string]any{"updatedAt": time.Now()}

	if err := applyPhone(body, updates, "phone", "phone"); err != nil {
		return nil, err
	}
	if err := applyPhone(body, updates, "parentPhone", "parentPhone"); err != nil {
		return nil, err
	}
	if err := applyNationalID(body, updates); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "gender", genderOptions, "Jenis kelamin tidak valid"); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "schoolGrade", gradeOptions, "Kelas harus 10, 11, atau 12"); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "primaryTarget", targetOptions, "Target utama tidak valid"); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "backupTarget", targetOptions, "Target cadangan tidak valid"); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "eyeCondition", eyeOptions, "Kondisi mata tidak valid"); err != nil {
		return nil, err
	}
	if err := applyChoice(body, updates, "parentIncome", incomeOptions, "Estimasi penghasilan tidak valid"); err != nil {
		return nil, err
	}
	if err := applyBirthDate(body, updates); err != nil {
		return nil, err
	}
	if err := applyMeasure(body, updates, "heightCm", 100, 250, "Tinggi badan"); err != nil {
		return nil, err
	}
	if err := applyMeasure(body, updates, "weightKg", 30, 200, "Berat badan"); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "name", "name", 3, 120); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "birthPlace", "birthPlace", 2, 80); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "schoolName", "schoolName", 2, 120); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "parentName", "parentName", 3, 120); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "parentOccupation", "parentOccupation", 2, 80); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "surgeryHistory", "surgeryHistory", 2, 500); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "bio", "bio", 0, 500); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "address", "address", 0, 300); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "parentAddress", "parentAddress", 0, 300); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "healthIssues", "healthIssues", 0, 500); err != nil {
		return nil, err
	}
	if err := applyText(body, updates, "avatarUrl", "avatarUrl", 0, 500); err != nil {
		return nil, err
	}
	if err := targetsDiffer(current, updates); err != nil {
		return nil, err
	}
	return updates, nil
}

func applyPhone(body map[string]any, updates map[string]any, key, column string) error {
	v, ok := body[key]
	if !ok {
		return nil
	}
	phone, err := NormalizePhone(asString(v))
	if err != nil {
		return httpx.New(400, err.Error())
	}
	updates[column] = phone
	return nil
}

func applyNationalID(body map[string]any, updates map[string]any) error {
	v, ok := body["nationalId"]
	if !ok {
		return nil
	}
	digits := digitsOnly(asString(v))
	if len(digits) != 16 {
		return httpx.New(400, "NIK harus 16 digit")
	}
	updates["nationalId"] = digits
	return nil
}

func applyChoice(body map[string]any, updates map[string]any, key string, allowed map[string]bool, message string) error {
	v, ok := body[key]
	if !ok {
		return nil
	}
	value := asString(v)
	if value == "" || !allowed[value] {
		return httpx.New(400, message)
	}
	updates[key] = value
	return nil
}

func applyBirthDate(body map[string]any, updates map[string]any) error {
	v, ok := body["birthDate"]
	if !ok {
		return nil
	}
	raw := asString(v)
	if len(raw) >= 10 {
		raw = raw[:10]
	}
	parsed, err := time.Parse("2006-01-02", raw)
	if err != nil || parsed.After(time.Now()) {
		return httpx.New(400, "Tanggal lahir tidak valid")
	}
	updates["birthDate"] = parsed
	return nil
}

func applyMeasure(body map[string]any, updates map[string]any, key string, min, max int, label string) error {
	v, ok := body[key]
	if !ok {
		return nil
	}
	n, ok := asInt(v)
	if !ok || n < min || n > max {
		return httpx.New(400, fmt.Sprintf("%s harus antara %d dan %d", label, min, max))
	}
	updates[key] = n
	return nil
}

func applyText(body map[string]any, updates map[string]any, key, column string, min, max int) error {
	v, ok := body[key]
	if !ok {
		return nil
	}
	value := asString(v)
	if value == "" {
		if min > 0 {
			return httpx.New(400, "Isian wajib diisi")
		}
		updates[column] = nil
		return nil
	}
	if min > 0 && len([]rune(value)) < min {
		return httpx.New(400, "Isian terlalu pendek")
	}
	if max > 0 && len([]rune(value)) > max {
		return httpx.New(400, "Isian terlalu panjang")
	}
	updates[column] = value
	return nil
}

func targetsDiffer(current models.User, updates map[string]any) error {
	primary := current.PrimaryTarget
	backup := current.BackupTarget
	if v, ok := updates["primaryTarget"].(string); ok {
		primary = &v
	}
	if v, ok := updates["backupTarget"].(string); ok {
		backup = &v
	}
	if primary != nil && backup != nil && *primary == *backup {
		return httpx.New(400, "Target cadangan harus berbeda dari target utama")
	}
	return nil
}

func asString(v any) string {
	if v == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprint(v))
}

func asInt(v any) (int, bool) {
	switch n := v.(type) {
	case float64:
		return int(n), true
	case int:
		return n, true
	case string:
		parsed, err := strconv.Atoi(strings.TrimSpace(n))
		return parsed, err == nil
	default:
		return 0, false
	}
}

func digitsOnly(value string) string {
	out := make([]rune, 0, len(value))
	for _, r := range value {
		if unicode.IsDigit(r) {
			out = append(out, r)
		}
	}
	return string(out)
}
