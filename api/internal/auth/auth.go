package auth

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"atozika/internal/config"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"
	"atozika/internal/upload"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	DB     *gorm.DB
	Cfg    config.Config
	Upload string
}

type registerBody struct {
	Name            string `json:"name"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
	Phone           string `json:"phone"`
	ReferralCode    string `json:"referralCode"`
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var body registerBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if len(body.Name) < 3 || !strings.Contains(body.Email, "@") {
		return httpx.New(400, "Data registrasi tidak valid")
	}
	phone, err := NormalizePhone(body.Phone)
	if err != nil {
		return httpx.New(400, err.Error())
	}
	body.Phone = phone
	if err := ValidatePassword(body.Password); err != nil {
		return httpx.New(400, err.Error())
	}
	if body.ConfirmPassword != body.Password {
		return httpx.New(400, "Konfirmasi password tidak sama")
	}
	var exists int64
	h.DB.Model(&models.User{}).Where("email = ?", strings.ToLower(body.Email)).Count(&exists)
	if exists > 0 {
		return httpx.New(409, "Email already registered")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		return err
	}
	token := randomToken(40)
	now := time.Now()
	user := models.User{
		ID:                     id.New(),
		Name:                   body.Name,
		Email:                  strings.ToLower(body.Email),
		PasswordHash:           string(hash),
		Role:                   "MEMBER",
		Phone:                  strPtr(body.Phone),
		ReferralCode:           h.uniqueReferral(),
		EmailVerificationToken: &token,
		CreatedAt:              now,
		UpdatedAt:              now,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		return err
	}
	h.ensureMemberArea(user.ID)
	if body.ReferralCode != "" {
		var referrer models.User
		if err := h.DB.Where(`"referralCode" = ?`, body.ReferralCode).First(&referrer).Error; err == nil {
			h.DB.Create(&models.Referral{
				ID:             id.New(),
				ReferrerID:     referrer.ID,
				ReferredUserID: user.ID,
				Status:         "REGISTERED",
				CreatedAt:      now,
			})
		}
	}
	return httpx.Created(c, fiber.Map{
		"email":             user.Email,
		"verificationToken": token,
		"message":           "Registrasi berhasil. Silakan verifikasi email Anda terlebih dahulu.",
	})
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var user models.User
	if err := h.DB.Where("email = ?", strings.ToLower(body.Email)).First(&user).Error; err != nil {
		return httpx.New(401, "Invalid credentials")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)) != nil {
		return httpx.New(401, "Invalid credentials")
	}
	if !user.IsActive {
		return httpx.New(403, "Akun Anda dinonaktifkan oleh admin.", map[string]any{"code": "ACCOUNT_DISABLED"})
	}
	if !user.IsEmailVerified {
		return httpx.New(403, "Email belum diverifikasi. Silakan cek inbox Anda.", map[string]any{"code": "EMAIL_NOT_VERIFIED", "email": user.Email})
	}
	h.ensureMemberArea(user.ID)
	session, err := h.createSession(user.ID, false)
	if err != nil {
		return err
	}
	return httpx.Success(c, session)
}

func (h *Handler) VerifyEmail(c *fiber.Ctx) error {
	var body struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Token) < 10 {
		return httpx.New(400, "Token tidak valid")
	}
	var user models.User
	if err := h.DB.Where(`"emailVerificationToken" = ?`, body.Token).First(&user).Error; err != nil {
		return httpx.New(400, "Token verifikasi tidak valid")
	}
	now := time.Now()
	h.DB.Model(&user).Updates(map[string]any{
		"isEmailVerified":        true,
		"emailVerifiedAt":        now,
		"emailVerificationToken": nil,
		"updatedAt":              now,
	})
	session, err := h.createSession(user.ID, true)
	if err != nil {
		return err
	}
	return httpx.Success(c, session)
}

func (h *Handler) Resend(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var user models.User
	if err := h.DB.Where("email = ?", strings.ToLower(body.Email)).First(&user).Error; err != nil {
		return httpx.New(404, "User not found")
	}
	if user.IsEmailVerified {
		return httpx.New(400, "Email sudah diverifikasi")
	}
	token := randomToken(40)
	h.DB.Model(&user).Updates(map[string]any{"emailVerificationToken": token, "updatedAt": time.Now()})
	return httpx.Success(c, fiber.Map{"email": user.Email, "verificationToken": token})
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	claims := &middleware.Claims{}
	token, err := jwt.ParseWithClaims(body.RefreshToken, claims, func(t *jwt.Token) (any, error) {
		return []byte(h.Cfg.JWTRefreshSecret), nil
	})
	if err != nil || !token.Valid {
		return httpx.New(401, "Invalid refresh token")
	}
	var tokens []models.RefreshToken
	h.DB.Where(`"userId" = ?`, claims.Subject).Find(&tokens)
	var matched *models.RefreshToken
	for i := range tokens {
		if bcrypt.CompareHashAndPassword([]byte(tokens[i].TokenHash), []byte(body.RefreshToken)) == nil {
			matched = &tokens[i]
			break
		}
	}
	if matched == nil {
		return httpx.New(401, "Invalid refresh token")
	}
	if matched.ExpiresAt.Before(time.Now()) {
		h.DB.Delete(&models.RefreshToken{}, "id = ?", matched.ID)
		return httpx.New(401, "Invalid refresh token")
	}
	h.DB.Delete(&models.RefreshToken{}, "id = ?", matched.ID)
	session, err := h.createSession(claims.Subject, false)
	if err != nil {
		return err
	}
	return httpx.Success(c, session)
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	u := middleware.Current(c)
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	_ = c.BodyParser(&body)
	if body.RefreshToken != "" && u != nil {
		var tokens []models.RefreshToken
		h.DB.Where(`"userId" = ?`, u.ID).Find(&tokens)
		for _, t := range tokens {
			if bcrypt.CompareHashAndPassword([]byte(t.TokenHash), []byte(body.RefreshToken)) == nil {
				h.DB.Delete(&models.RefreshToken{}, "id = ?", t.ID)
			}
		}
	}
	return httpx.Message(c, "Logged out")
}

func (h *Handler) Me(c *fiber.Ctx) error {
	u := middleware.Current(c)
	profile, err := h.buildProfile(u.ID)
	if err != nil {
		return err
	}
	return httpx.Success(c, profile)
}

func (h *Handler) UpdateMe(c *fiber.Ctx) error {
	u := middleware.Current(c)
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var current models.User
	if err := h.DB.First(&current, "id = ?", u.ID).Error; err != nil {
		return httpx.New(404, "User not found")
	}
	updates, err := profileUpdates(current, body)
	if err != nil {
		return err
	}
	h.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(updates)
	profile, err := h.buildProfile(u.ID)
	if err != nil {
		return err
	}
	return httpx.Success(c, profile)
}

func (h *Handler) Password(c *fiber.Ctx) error {
	u := middleware.Current(c)
	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if err := ValidatePassword(body.NewPassword); err != nil {
		return httpx.New(400, err.Error())
	}
	var user models.User
	if err := h.DB.First(&user, "id = ?", u.ID).Error; err != nil {
		return httpx.New(404, "User not found")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.CurrentPassword)) != nil {
		return httpx.New(400, "Password lama tidak sesuai")
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(body.NewPassword), 10)
	h.DB.Model(&user).Updates(map[string]any{
		"passwordHash":   string(hash),
		"sessionVersion": gorm.Expr(`"sessionVersion" + 1`),
		"updatedAt":      time.Now(),
	})
	h.DB.Where(`"userId" = ?`, u.ID).Delete(&models.RefreshToken{})
	return httpx.Success(c, fiber.Map{"ok": true})
}

func (h *Handler) Avatar(c *fiber.Ctx) error {
	u := middleware.Current(c)
	saved, err := upload.Save(c, "avatar", h.Upload+"/avatars", "uploads/avatars", 10<<20, upload.Images)
	if err != nil {
		return err
	}
	if saved == nil {
		return httpx.New(400, "File avatar wajib diunggah")
	}
	h.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(map[string]any{
		"avatarUrl": saved.PublicURL,
		"updatedAt": time.Now(),
	})
	var user models.User
	h.DB.Select("id, name, email, \"avatarUrl\", phone").First(&user, "id = ?", u.ID)
	return httpx.Success(c, fiber.Map{
		"id": user.ID, "name": user.Name, "email": user.Email, "avatarUrl": user.AvatarURL, "phone": user.Phone,
	})
}

func (h *Handler) FullBody(c *fiber.Ctx) error {
	u := middleware.Current(c)
	saved, err := upload.Save(c, "photo", h.Upload+"/full-body", "uploads/full-body", 10<<20, upload.Images)
	if err != nil {
		return err
	}
	if saved == nil {
		return httpx.New(400, "Foto full body wajib diunggah")
	}
	h.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(map[string]any{
		"fullBodyUrl": saved.PublicURL,
		"updatedAt":   time.Now(),
	})
	return httpx.Success(c, fiber.Map{"fullBodyUrl": saved.PublicURL})
}

func (h *Handler) createSession(userID string, bump bool) (fiber.Map, error) {
	profile, err := h.buildProfile(userID)
	if err != nil {
		return nil, err
	}
	var user models.User
	h.DB.Select(`id, email, role, name, "referralCode", "isEmailVerified", "sessionVersion"`).First(&user, "id = ?", userID)
	sv := user.SessionVersion
	if bump {
		h.DB.Model(&user).UpdateColumn("sessionVersion", gorm.Expr(`"sessionVersion" + 1`))
		sv++
	}
	access, refresh, err := h.issueTokens(user, sv)
	if err != nil {
		return nil, err
	}
	return fiber.Map{"user": profile, "accessToken": access, "refreshToken": refresh}, nil
}

func (h *Handler) issueTokens(user models.User, sessionVersion int) (string, string, error) {
	access := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID, "email": user.Email, "role": user.Role, "name": user.Name,
		"referralCode": user.ReferralCode, "isEmailVerified": user.IsEmailVerified,
		"sessionVersion": sessionVersion,
		"iat":            time.Now().Unix(),
		"exp":            time.Now().Add(time.Duration(h.Cfg.AccessTTLMinutes) * time.Minute).Unix(),
	})
	accessStr, err := access.SignedString([]byte(h.Cfg.JWTAccessSecret))
	if err != nil {
		return "", "", err
	}
	refresh := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID, "email": user.Email, "role": user.Role, "sessionVersion": sessionVersion,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(time.Duration(h.Cfg.RefreshTTLDays) * 24 * time.Hour).Unix(),
	})
	refreshStr, err := refresh.SignedString([]byte(h.Cfg.JWTRefreshSecret))
	if err != nil {
		return "", "", err
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(refreshStr), 10)
	h.DB.Where(`"userId" = ? AND "expiresAt" < ?`, user.ID, time.Now()).Delete(&models.RefreshToken{})
	h.DB.Create(&models.RefreshToken{
		ID:        id.New(),
		TokenHash: string(hash),
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(time.Duration(h.Cfg.RefreshTTLDays) * 24 * time.Hour),
		CreatedAt: time.Now(),
	})
	return accessStr, refreshStr, nil
}

func (h *Handler) buildProfile(userID string) (fiber.Map, error) {
	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, httpx.New(404, "User not found")
	}
	var area models.MemberArea
	memberArea := any(nil)
	if err := h.DB.Where(`"userId" = ?`, userID).First(&area).Error; err == nil {
		memberArea = fiber.Map{"slug": area.Slug}
	}
	membershipData := fiber.Map{"isActive": false}
	if trx, err := membership.GetActive(h.DB, userID); err == nil && trx != nil {
		membershipData = fiber.Map{
			"isActive":        true,
			"expiresAt":       trx.ExpiresAt,
			"packageName":     trx.Package.Name,
			"transactionCode": trx.Code,
		}
	}
	return fiber.Map{
		"id": user.ID, "name": user.Name, "email": user.Email, "role": user.Role,
		"isActive": user.IsActive, "referralCode": user.ReferralCode,
		"isEmailVerified": user.IsEmailVerified, "avatarUrl": user.AvatarURL,
		"phone": user.Phone, "bio": user.Bio, "address": user.Address,
		"nationalId": user.NationalID, "birthPlace": user.BirthPlace, "birthDate": user.BirthDate,
		"gender": user.Gender, "schoolName": user.SchoolName, "schoolGrade": user.SchoolGrade,
		"heightCm": user.HeightCm, "weightKg": user.WeightKg,
		"parentName": user.ParentName, "parentPhone": user.ParentPhone,
		"parentOccupation": user.ParentOccupation, "parentIncome": user.ParentIncome,
		"parentAddress": user.ParentAddress, "healthIssues": user.HealthIssues,
		"primaryTarget": user.PrimaryTarget, "backupTarget": user.BackupTarget,
		"surgeryHistory": user.SurgeryHistory, "eyeCondition": user.EyeCondition,
		"fullBodyUrl": user.FullBodyURL,
		"memberArea":  memberArea, "membership": membershipData,
	}, nil
}

func (h *Handler) ensureMemberArea(userID string) {
	var n int64
	h.DB.Model(&models.MemberArea{}).Where(`"userId" = ?`, userID).Count(&n)
	if n > 0 {
		return
	}
	h.DB.Create(&models.MemberArea{
		ID: id.New(), UserID: userID, Slug: "workspace-" + strings.ToLower(randomToken(10)),
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})
}

func (h *Handler) uniqueReferral() string {
	for {
		code := "ATOZ" + strings.ToUpper(randomToken(6))
		var n int64
		h.DB.Model(&models.User{}).Where(`"referralCode" = ?`, code).Count(&n)
		if n == 0 {
			return code
		}
	}
}

func randomToken(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	s := hex.EncodeToString(b)
	if len(s) > n {
		return s[:n]
	}
	return s
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func intPtr(n int) *int {
	if n == 0 {
		return nil
	}
	return &n
}

func IssueImpersonation(db *gorm.DB, cfg config.Config, userID string) (fiber.Map, error) {
	h := &Handler{DB: db, Cfg: cfg}
	return h.createSession(userID, false)
}

func HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(b), err
}

func RandomPassword() string {
	return "Aa1!" + strings.ToUpper(randomToken(8))
}
