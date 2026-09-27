package exams

import (
	"math/rand"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) settingBool(key string, fallback bool) bool {
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return fallback
	}
	return s.Value == "true"
}

func (h *Handler) blockConfig() fiber.Map {
	return fiber.Map{
		"practiceEnabled": h.settingBool("exam_block_practice_enabled", true),
		"tryoutEnabled":   h.settingBool("exam_block_tryout_enabled", true),
		"examEnabled":     h.settingBool("exam_block_exam_enabled", true),
		"cermatEnabled":   h.settingBool("exam_block_cermat_enabled", true),
	}
}

func (h *Handler) enabledFor(typ string, ujian bool) bool {
	cfg := h.blockConfig()
	if ujian {
		v, _ := cfg["examEnabled"].(bool)
		return v
	}
	switch typ {
	case "PRACTICE":
		v, _ := cfg["practiceEnabled"].(bool)
		return v
	case "CERMAT":
		v, _ := cfg["cermatEnabled"].(bool)
		return v
	default:
		v, _ := cfg["tryoutEnabled"].(bool)
		return v
	}
}

func (h *Handler) EnsureBlock(userID, typ string, ujian bool) error {
	if !h.enabledFor(typ, ujian) {
		return nil
	}
	var blk models.ExamBlock
	if err := h.DB.Where(`"userId" = ? AND type = ? AND "resolvedAt" IS NULL`, userID, typ).Order(`"blockedAt" DESC`).First(&blk).Error; err == nil {
		return httpx.New(423, "Sesi diblokir. Masukkan kode buka blokir dari admin.", map[string]any{"code": blk.Code, "blockId": blk.ID})
	}
	return nil
}

func (h *Handler) Blocks(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var items []models.ExamBlock
	h.DB.Where(`"userId" = ? AND "resolvedAt" IS NULL`, uid).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) BlockConfig(c *fiber.Ctx) error {
	return httpx.Success(c, h.blockConfig())
}

func (h *Handler) CreateBlock(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var body struct {
		Type   string `json:"type"`
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&body)
	if body.Type != "TRYOUT" && body.Type != "PRACTICE" && body.Type != "CERMAT" {
		body.Type = "TRYOUT"
	}
	ujian := c.Path() != "" && contains(c.OriginalURL(), "/ujian/")
	if !h.enabledFor(body.Type, ujian) {
		return httpx.Success(c, fiber.Map{"skipped": true})
	}
	code := 100000 + rand.Intn(900000)
	now := time.Now()
	var existing models.ExamBlock
	if err := h.DB.Where(`"userId" = ? AND type = ? AND "resolvedAt" IS NULL`, uid, body.Type).First(&existing).Error; err == nil {
		h.DB.Model(&existing).Updates(map[string]any{"violationCount": existing.ViolationCount + 1, "updatedAt": now})
		return httpx.Success(c, existing)
	}
	blk := models.ExamBlock{
		ID: id.New(), UserID: uid, Type: body.Type, Reason: strPtr(body.Reason),
		Code: itoa(code), ViolationCount: 1, BlockedAt: now, CreatedAt: now, UpdatedAt: now,
	}
	h.DB.Create(&blk)
	return httpx.Success(c, blk)
}

func (h *Handler) Unlock(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var body struct {
		Code string `json:"code"`
		Type string `json:"type"`
	}
	_ = c.BodyParser(&body)
	q := h.DB.Where(`"userId" = ? AND code = ? AND "resolvedAt" IS NULL`, uid, body.Code)
	if body.Type != "" {
		q = q.Where("type = ?", body.Type)
	}
	var blk models.ExamBlock
	if err := q.First(&blk).Error; err != nil {
		return httpx.New(400, "Kode tidak valid")
	}
	now := time.Now()
	h.DB.Model(&blk).Updates(map[string]any{"resolvedAt": now, "updatedAt": now})
	return httpx.Success(c, fiber.Map{"ok": true})
}

func (h *Handler) assertExamControl(userID, kind string) error {
	var cfg models.ExamControlConfig
	if err := h.DB.First(&cfg).Error; err != nil || !cfg.Enabled {
		return httpx.New(403, "Kontrol ujian tidak aktif.")
	}
	now := time.Now()
	if cfg.StartAt != nil && now.Before(*cfg.StartAt) {
		return httpx.New(403, "Jendela ujian belum dibuka.")
	}
	if cfg.EndAt != nil && now.After(*cfg.EndAt) {
		return httpx.New(403, "Jendela ujian sudah ditutup.")
	}
	trx, _ := membership.GetActive(h.DB, userID)
	if !cfg.TargetAll {
		if trx == nil || !jsonutil.Contains(jsonutil.Strings(cfg.TargetPackageIDs), trx.PackageID) {
			return httpx.New(403, "Paket Anda tidak termasuk kontrol ujian.")
		}
	}
	var usage models.ExamQuotaUsage
	if err := h.DB.Where(`"userId" = ?`, userID).First(&usage).Error; err != nil {
		usage = models.ExamQuotaUsage{ID: id.New(), UserID: userID, CreatedAt: now, UpdatedAt: now}
		h.DB.Create(&usage)
	}
	if kind == "TRYOUT" && cfg.TryoutQuota > 0 && usage.TryoutsUsed >= cfg.TryoutQuota {
		return httpx.New(403, "Kuota ujian tryout habis.")
	}
	if kind == "EXAM" && cfg.ExamQuota > 0 && usage.ExamsUsed >= cfg.ExamQuota {
		return httpx.New(403, "Kuota ujian soal habis.")
	}
	if kind == "TRYOUT" && cfg.TryoutQuota > 0 {
		h.DB.Model(&usage).UpdateColumn("tryoutsUsed", usage.TryoutsUsed+1)
	}
	if kind == "EXAM" && cfg.ExamQuota > 0 {
		h.DB.Model(&usage).UpdateColumn("examsUsed", usage.ExamsUsed+1)
	}
	return nil
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || (len(s) > 0 && indexOf(s, sub) >= 0))
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
