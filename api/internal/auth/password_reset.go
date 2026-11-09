package auth

import (
	"crypto/subtle"
	"log"
	"strings"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/mail"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func (h *Handler) ForgotPassword(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Email tidak valid")
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	message := "Jika email terdaftar, kode OTP ganti password akan dikirim. Kode berlaku 10 menit."
	if !strings.Contains(email, "@") {
		return httpx.New(400, "Masukkan email yang valid")
	}
	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil || !user.IsActive {
		return httpx.Success(c, fiber.Map{"message": message})
	}
	code := newOTP()
	expires := time.Now().Add(otpTTL)
	if err := h.DB.Model(&user).Updates(map[string]any{
		"passwordResetCode":      code,
		"passwordResetExpiresAt": expires,
		"updatedAt":              time.Now(),
	}).Error; err != nil {
		return err
	}
	payload := fiber.Map{"email": user.Email, "message": message}
	if !h.deliverPasswordOTP(user.Email, user.Name, code) && h.Cfg.NodeEnv != "production" {
		payload["otp"] = code
	}
	return httpx.Success(c, payload)
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Code     string `json:"code"`
		OTP      string `json:"otp"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data tidak valid")
	}
	code := normalizeOTP(body.Code)
	if code == "" {
		code = normalizeOTP(body.OTP)
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if len(code) != 6 || !strings.Contains(email, "@") {
		return httpx.New(400, "Masukkan email dan 6 digit OTP")
	}
	if err := ValidatePassword(body.Password); err != nil {
		return httpx.New(400, err.Error())
	}
	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil || !user.IsActive {
		return httpx.New(400, "Kode OTP tidak valid")
	}
	stored := ""
	if user.PasswordResetCode != nil {
		stored = *user.PasswordResetCode
	}
	if len(stored) != 6 || subtle.ConstantTimeCompare([]byte(stored), []byte(code)) != 1 {
		return httpx.New(400, "Kode OTP tidak valid")
	}
	if !otpFresh(user.PasswordResetExpiresAt, time.Now()) {
		return httpx.New(400, "Kode OTP kedaluwarsa. Kirim ulang kode baru.")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		return err
	}
	now := time.Now()
	updates := map[string]any{
		"passwordHash":           string(hash),
		"passwordResetCode":      gorm.Expr("NULL"),
		"passwordResetExpiresAt": gorm.Expr("NULL"),
		"sessionVersion":         gorm.Expr(`"sessionVersion" + 1`),
		"updatedAt":              now,
	}
	if !user.IsEmailVerified {
		updates["isEmailVerified"] = true
		updates["emailVerifiedAt"] = now
	}
	if err := h.DB.Model(&user).Updates(updates).Error; err != nil {
		return err
	}
	h.DB.Where(`"userId" = ?`, user.ID).Delete(&models.RefreshToken{})
	return httpx.Success(c, fiber.Map{"message": "Password berhasil diganti. Silakan masuk dengan password baru."})
}

func (h *Handler) deliverPasswordOTP(email, name, code string) bool {
	base := strings.TrimRight(firstPublicURL(h.Cfg.AppURL, h.Cfg.FrontendURL), "/")
	subject, text, htmlBody := mail.RenderPasswordResetOTP(mail.OTPEmail{
		Name:         name,
		Code:         code,
		VerifyURL:    base + "/auth/reset-password",
		SupportEmail: "support@atozika.id",
		Brand:        "ATOZIKA",
	})
	if err := mail.SendHTML(h.Cfg, email, subject, text, htmlBody); err != nil {
		if err != mail.ErrNotConfigured {
			log.Printf("password reset email: %v", err)
		}
		return false
	}
	return true
}
