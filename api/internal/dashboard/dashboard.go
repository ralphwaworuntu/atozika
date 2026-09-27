package dashboard

import (
	"encoding/json"

	"atozika/internal/httpx"
	"atozika/internal/jsonutil"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func (h *Handler) Overview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	trx, _ := membership.GetActive(h.DB, uid)
	premium := membership.IsPremium(h.DB, uid)
	activePkg := ""
	if trx != nil {
		activePkg = trx.PackageID
	}
	type trxRow struct {
		ID        string `json:"id"`
		Code      string `json:"code"`
		Amount    int    `json:"amount"`
		Status    string `json:"status"`
		Method    string `json:"method"`
		CreatedAt any    `json:"createdAt"`
		Type      string `json:"type"`
		PkgName   string `json:"-"`
		AddonName string `json:"-"`
	}
	var transactions []models.Transaction
	h.DB.Preload("Package").Preload("Addon").Where(`"userId" = ?`, uid).Order(`"createdAt" DESC`).Limit(5).Find(&transactions)
	trxOut := []fiber.Map{}
	for _, t := range transactions {
		pkgName := t.Package.Name
		addonName := any(nil)
		if t.Addon != nil {
			addonName = t.Addon.Name
		}
		trxOut = append(trxOut, fiber.Map{
			"id": t.ID, "code": t.Code, "amount": t.Amount, "status": t.Status, "method": t.Method,
			"createdAt": t.CreatedAt, "type": t.Type,
			"package": fiber.Map{"name": pkgName}, "addon": fiber.Map{"name": addonName},
		})
	}
	var anns []models.Announcement
	h.DB.Order(`"publishedAt" DESC`).Limit(50).Find(&anns)
	filtered := []models.Announcement{}
	for _, a := range anns {
		if a.TargetAll || premium {
			filtered = append(filtered, a)
			continue
		}
		if activePkg != "" && jsonutil.Contains(jsonutil.Strings(a.TargetPackageIDs), activePkg) {
			filtered = append(filtered, a)
		}
	}
	if len(filtered) > 5 {
		filtered = filtered[:5]
	}
	var results []models.TryoutResult
	h.DB.Preload("Tryout").Preload("Tryout.SubCategory").Preload("Tryout.SubCategory.Category").
		Where(`"userId" = ?`, uid).Order(`"createdAt" DESC`).Limit(40).Find(&results)
	var slides []models.MemberOverviewSlide
	h.DB.Order(`"order" ASC, "createdAt" ASC`).Find(&slides)
	var tryoutCount int64
	h.DB.Model(&models.TryoutResult{}).Where(`"userId" = ?`, uid).Count(&tryoutCount)
	var materialCount int64
	h.DB.Model(&models.Material{}).Count(&materialCount)
	var pending int64
	h.DB.Model(&models.Transaction{}).Where(`"userId" = ? AND status = ?`, uid, "PENDING").Count(&pending)
	return httpx.Success(c, fiber.Map{
		"transactions":  trxOut,
		"announcements": filtered,
		"tryoutResults": results,
		"slides":        slides,
		"summary":       fiber.Map{"tryouts": tryoutCount, "materials": materialCount, "pendingPayments": pending},
	})
}

func (h *Handler) Announcements(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	trx, _ := membership.GetActive(h.DB, uid)
	premium := membership.IsPremium(h.DB, uid)
	activePkg := ""
	if trx != nil {
		activePkg = trx.PackageID
	}
	var items []models.Announcement
	h.DB.Order(`"publishedAt" DESC`).Limit(200).Find(&items)
	out := []models.Announcement{}
	for _, a := range items {
		if a.TargetAll || premium || (activePkg != "" && jsonutil.Contains(jsonutil.Strings(a.TargetPackageIDs), activePkg)) {
			out = append(out, a)
		}
	}
	return httpx.Success(c, out)
}

func (h *Handler) FAQ(c *fiber.Ctx) error {
	var items []models.Faq
	h.DB.Order(`"order" ASC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) News(c *fiber.Ctx) error {
	var items []models.NewsArticle
	h.DB.Order(`published DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) WelcomeModal(c *fiber.Ctx) error {
	raw := h.setting("welcome_modal_items")
	if raw != "" {
		var items []map[string]any
		if err := json.Unmarshal([]byte(raw), &items); err == nil {
			for _, item := range items {
				if enabled, _ := item["enabled"].(bool); enabled == false {
					continue
				}
				if _, ok := item["id"]; !ok {
					continue
				}
				if _, ok := item["imageUrl"]; !ok {
					continue
				}
				link := item["linkUrl"]
				return httpx.Success(c, fiber.Map{"enabled": true, "imageUrl": item["imageUrl"], "linkUrl": link, "link": link})
			}
		}
	}
	enabled := h.setting("welcome_modal_enabled") == "true"
	image := h.setting("welcome_modal_image")
	link := h.setting("welcome_modal_link")
	return httpx.Success(c, fiber.Map{"enabled": enabled, "imageUrl": nilIfEmpty(image), "linkUrl": nilIfEmpty(link), "link": nilIfEmpty(link)})
}

func (h *Handler) MemberBackground(c *fiber.Ctx) error {
	enabled := h.setting("member_area_background_enabled") == "true"
	image := h.setting("member_area_background_image")
	return httpx.Success(c, fiber.Map{"enabled": enabled, "imageUrl": nilIfEmpty(image)})
}

func (h *Handler) ExamControl(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var cfg models.ExamControlConfig
	if err := h.DB.First(&cfg).Error; err != nil {
		cfg = models.ExamControlConfig{Enabled: false, TargetAll: true}
	}
	trx, _ := membership.GetActive(h.DB, uid)
	allowed := false
	if cfg.Enabled {
		if cfg.TargetAll {
			allowed = trx != nil || membership.IsPremium(h.DB, uid)
		} else if trx != nil {
			allowed = jsonutil.Contains(jsonutil.Strings(cfg.TargetPackageIDs), trx.PackageID)
		}
	}
	var usage models.ExamQuotaUsage
	h.DB.Where(`"userId" = ?`, uid).First(&usage)
	return httpx.Success(c, fiber.Map{
		"enabled": cfg.Enabled, "allowed": allowed, "targetAll": cfg.TargetAll,
		"targetPackageIds": jsonutil.Strings(cfg.TargetPackageIDs),
		"tryoutQuota":      cfg.TryoutQuota, "examQuota": cfg.ExamQuota,
		"tryoutsUsed": usage.TryoutsUsed, "examsUsed": usage.ExamsUsed,
		"startAt": cfg.StartAt, "endAt": cfg.EndAt,
	})
}

func (h *Handler) CalculatorLegacy(c *fiber.Ctx) error {
	return httpx.New(400, "Gunakan endpoint /calculators/:slug/compute")
}

func (h *Handler) setting(key string) string {
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return ""
	}
	return s.Value
}

func nilIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func init() { _ = json.Marshal }
