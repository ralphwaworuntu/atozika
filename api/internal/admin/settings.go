package admin

import (
	"encoding/json"
	"os"
	"strconv"
	"time"

	"atozika/internal/examcsv"
	"atozika/internal/examdocx"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/models"
	"atozika/internal/upload"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) GetContactConfig(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"companyEmail":    h.setting("company_email"),
		"whatsappPrimary": h.setting("whatsapp_primary"),
		"whatsappConsult": h.setting("whatsapp_consult"),
		"companyAddress":  h.setting("company_address"),
	})
}

func (h *Handler) PutContactConfig(c *fiber.Ctx) error {
	var body map[string]string
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	keys := map[string]string{
		"companyEmail": "company_email", "whatsappPrimary": "whatsapp_primary",
		"whatsappConsult": "whatsapp_consult", "companyAddress": "company_address",
		"company_email": "company_email", "whatsapp_primary": "whatsapp_primary",
		"whatsapp_consult": "whatsapp_consult", "company_address": "company_address",
	}
	for k, settingKey := range keys {
		if v, ok := body[k]; ok {
			h.upsertSetting(settingKey, v)
		}
	}
	return h.GetContactConfig(c)
}

func (h *Handler) GetMemberBackground(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"enabled":  h.setting("member_area_background_enabled") == "true",
		"imageUrl": nilIfEmpty(h.setting("member_area_background_image")),
	})
}

func (h *Handler) PutMemberBackground(c *fiber.Ctx) error {
	if v := c.FormValue("enabled"); v != "" {
		h.upsertSetting("member_area_background_enabled", strconv.FormatBool(formBool(c, "enabled", false)))
	}
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	if img != "" {
		h.upsertSetting("member_area_background_image", img)
	}
	var body map[string]any
	_ = c.BodyParser(&body)
	if v, ok := body["enabled"].(bool); ok {
		h.upsertSetting("member_area_background_enabled", strconv.FormatBool(v))
	}
	return h.GetMemberBackground(c)
}

func (h *Handler) GetExamControl(c *fiber.Ctx) error {
	var cfg models.ExamControlConfig
	if err := h.DB.First(&cfg).Error; err != nil {
		cfg = models.ExamControlConfig{Enabled: false, TargetAll: true}
	}
	return httpx.Success(c, cfg)
}

func (h *Handler) PutExamControl(c *fiber.Ctx) error {
	var body models.ExamControlConfig
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var cfg models.ExamControlConfig
	now := time.Now()
	if err := h.DB.First(&cfg).Error; err != nil {
		body.ID = id.New()
		body.CreatedAt = now
		body.UpdatedAt = now
		h.DB.Create(&body)
		return httpx.Success(c, body)
	}
	h.DB.Model(&cfg).Updates(map[string]any{
		"enabled": body.Enabled, "targetAll": body.TargetAll, "targetPackageIds": body.TargetPackageIDs,
		"tryoutQuota": body.TryoutQuota, "examQuota": body.ExamQuota, "startAt": body.StartAt, "endAt": body.EndAt,
		"updatedAt": now,
	})
	h.DB.First(&cfg, "id = ?", cfg.ID)
	return httpx.Success(c, cfg)
}

func (h *Handler) GetExamBlockConfig(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"tryoutEnabled":   h.setting("exam_block_tryout_enabled") != "false",
		"practiceEnabled": h.setting("exam_block_practice_enabled") != "false",
		"cermatEnabled":   h.setting("exam_block_cermat_enabled") != "false",
		"ujianTryout":     h.setting("exam_block_ujian_tryout_enabled") != "false",
		"ujianPractice":   h.setting("exam_block_ujian_practice_enabled") != "false",
	})
}

func (h *Handler) PutExamBlockConfig(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	mapping := map[string]string{
		"tryoutEnabled": "exam_block_tryout_enabled", "practiceEnabled": "exam_block_practice_enabled",
		"cermatEnabled": "exam_block_cermat_enabled", "ujianTryout": "exam_block_ujian_tryout_enabled",
		"ujianPractice": "exam_block_ujian_practice_enabled",
	}
	for k, sk := range mapping {
		if v, ok := body[k]; ok {
			h.upsertSetting(sk, strconv.FormatBool(asBool(v)))
		}
	}
	return h.GetExamBlockConfig(c)
}

func (h *Handler) welcomeItems() []map[string]any {
	raw := h.setting("welcome_modal_items")
	if raw == "" {
		return []map[string]any{}
	}
	var items []map[string]any
	if err := json.Unmarshal([]byte(raw), &items); err != nil {
		return []map[string]any{}
	}
	return items
}

func (h *Handler) saveWelcome(items []map[string]any) {
	b, _ := json.Marshal(items)
	h.upsertSetting("welcome_modal_items", string(b))
}

func (h *Handler) ListWelcome(c *fiber.Ctx) error {
	items := h.welcomeItems()
	if len(items) == 0 {
		img := h.setting("welcome_modal_image")
		if img != "" {
			items = []map[string]any{{
				"id": "legacy", "imageUrl": img, "linkUrl": nilIfEmpty(h.setting("welcome_modal_link")),
				"enabled": h.setting("welcome_modal_enabled") == "true", "createdAt": time.Now().Format(time.RFC3339),
			}}
		}
	}
	return httpx.Success(c, items)
}

func (h *Handler) CreateWelcome(c *fiber.Ctx) error {
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	if img == "" {
		return httpx.New(400, "Gambar welcome modal wajib diunggah")
	}
	item := map[string]any{
		"id": id.New(), "imageUrl": img, "linkUrl": nilIfEmpty(c.FormValue("linkUrl")),
		"enabled": formBool(c, "enabled", true), "createdAt": time.Now().Format(time.RFC3339),
	}
	h.saveWelcome(append([]map[string]any{item}, h.welcomeItems()...))
	return httpx.Created(c, item)
}

func (h *Handler) UpdateWelcome(c *fiber.Ctx) error {
	idStr := c.Params("id")
	items := h.welcomeItems()
	found := false
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	for i, item := range items {
		if item["id"] == idStr {
			if img != "" {
				item["imageUrl"] = img
			}
			if v := c.FormValue("linkUrl"); v != "" || c.FormValue("linkUrl") == "" {
				item["linkUrl"] = nilIfEmpty(v)
			}
			if v := c.FormValue("enabled"); v != "" {
				item["enabled"] = formBool(c, "enabled", true)
			}
			items[i] = item
			found = true
			break
		}
	}
	if !found {
		return httpx.New(404, "Welcome modal tidak ditemukan")
	}
	h.saveWelcome(items)
	return httpx.Success(c, items)
}

func (h *Handler) DeleteWelcome(c *fiber.Ctx) error {
	idStr := c.Params("id")
	items := h.welcomeItems()
	next := []map[string]any{}
	for _, item := range items {
		if item["id"] != idStr {
			next = append(next, item)
		}
	}
	h.saveWelcome(next)
	return noContent(c)
}

func (h *Handler) GetCermatConfig(c *fiber.Ctx) error {
	n := func(key string, fb int) int {
		v := h.setting(key)
		if v == "" {
			return fb
		}
		i, err := strconv.Atoi(v)
		if err != nil {
			return fb
		}
		return i
	}
	return httpx.Success(c, fiber.Map{
		"questionCount": n("cermat_question_count", 60), "durationSeconds": n("cermat_duration_seconds", 60),
		"totalSessions": n("cermat_total_sessions", 10), "breakSeconds": n("cermat_break_seconds", 5),
	})
}

func (h *Handler) PutCermatConfig(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	mapping := map[string]string{
		"questionCount": "cermat_question_count", "durationSeconds": "cermat_duration_seconds",
		"totalSessions": "cermat_total_sessions", "breakSeconds": "cermat_break_seconds",
	}
	for k, sk := range mapping {
		if v, ok := body[k]; ok {
			h.upsertSetting(sk, stringifyAny(v))
		}
	}
	return h.GetCermatConfig(c)
}

func (h *Handler) GetCermatModes(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"imageEnabled":  h.setting("cermat_mode_image_enabled") != "false",
		"letterEnabled": h.setting("cermat_mode_letter_enabled") != "false",
		"numberEnabled": h.setting("cermat_mode_number_enabled") != "false",
	})
}

func (h *Handler) PutCermatModes(c *fiber.Ctx) error {
	var body struct {
		ImageEnabled  *bool `json:"imageEnabled"`
		LetterEnabled *bool `json:"letterEnabled"`
		NumberEnabled *bool `json:"numberEnabled"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	boolStr := func(v bool) string {
		if v {
			return "true"
		}
		return "false"
	}
	if body.ImageEnabled != nil {
		h.upsertSetting("cermat_mode_image_enabled", boolStr(*body.ImageEnabled))
	}
	if body.LetterEnabled != nil {
		h.upsertSetting("cermat_mode_letter_enabled", boolStr(*body.LetterEnabled))
	}
	if body.NumberEnabled != nil {
		h.upsertSetting("cermat_mode_number_enabled", boolStr(*body.NumberEnabled))
	}
	imageOn := h.setting("cermat_mode_image_enabled") != "false"
	letterOn := h.setting("cermat_mode_letter_enabled") != "false"
	numberOn := h.setting("cermat_mode_number_enabled") != "false"
	if !imageOn && !letterOn && !numberOn {
		return httpx.New(400, "Minimal satu varian tes kecermatan harus aktif.")
	}
	return h.GetCermatModes(c)
}

func (h *Handler) GetPsikoConfig(c *fiber.Ctx) error {
	breakSec := 5
	if v := h.setting("psiko_tryout_break_seconds"); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			breakSec = i
		}
	}
	mode := h.setting("psiko_tryout_cermat_mode")
	if mode == "" {
		mode = "NUMBER"
	}
	return httpx.Success(c, fiber.Map{
		"breakSeconds": breakSec,
		"cermatMode":   mode,
	})
}

func (h *Handler) PutPsikoConfig(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if v, ok := body["breakSeconds"]; ok {
		h.upsertSetting("psiko_tryout_break_seconds", stringifyAny(v))
	}
	if v, ok := body["cermatMode"]; ok {
		h.upsertSetting("psiko_tryout_cermat_mode", stringifyAny(v))
	}
	return h.GetPsikoConfig(c)
}

func (h *Handler) GetHeroImage(c *fiber.Ctx) error {
	url := h.setting("hero_image")
	return httpx.Success(c, fiber.Map{"imageUrl": nilIfEmpty(url)})
}

func (h *Handler) PutHeroImage(c *fiber.Ctx) error {
	img, err := h.saveImage(c, "hero", "hero")
	if err != nil {
		return err
	}
	if img == "" {
		return httpx.New(400, "File hero wajib diunggah")
	}
	h.upsertSetting("hero_image", img)
	return httpx.Success(c, fiber.Map{"imageUrl": h.withOrigin(c, img)})
}

func (h *Handler) ListHeroSlides(c *fiber.Ctx) error {
	var items []models.HeroSlide
	h.DB.Order(`"order" ASC, "createdAt" ASC`).Find(&items)
	out := []fiber.Map{}
	for _, s := range items {
		out = append(out, fiber.Map{"id": s.ID, "imageUrl": h.withOrigin(c, s.ImageURL), "order": s.Order, "createdAt": s.CreatedAt})
	}
	return httpx.Success(c, out)
}

func (h *Handler) CreateHeroSlide(c *fiber.Ctx) error {
	img, err := h.saveImage(c, "slide", "hero")
	if err != nil {
		return err
	}
	if img == "" {
		return httpx.New(400, "File slide wajib diunggah")
	}
	var n int64
	h.DB.Model(&models.HeroSlide{}).Count(&n)
	item := models.HeroSlide{ID: id.New(), ImageURL: img, Order: int(n), CreatedAt: time.Now()}
	h.DB.Create(&item)
	return httpx.Created(c, fiber.Map{"id": item.ID, "imageUrl": h.withOrigin(c, item.ImageURL), "order": item.Order, "createdAt": item.CreatedAt})
}

func (h *Handler) DeleteHeroSlide(c *fiber.Ctx) error {
	h.DB.Delete(&models.HeroSlide{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListMemberSlides(c *fiber.Ctx) error {
	var items []models.MemberOverviewSlide
	h.DB.Order(`"order" ASC, "createdAt" ASC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) CreateMemberSlide(c *fiber.Ctx) error {
	var body models.MemberOverviewSlide
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	body.CreatedAt = time.Now()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}

func (h *Handler) UpdateMemberSlide(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "No data provided")
	}
	var item models.MemberOverviewSlide
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}

func (h *Handler) DeleteMemberSlide(c *fiber.Ctx) error {
	h.DB.Delete(&models.MemberOverviewSlide{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ConvertWord(c *fiber.Ctx) error {
	saved, err := upload.Save(c, "wordFile", os.TempDir(), "tmp", 20<<20, upload.Word)
	if err != nil {
		return err
	}
	if saved == nil {
		return httpx.New(400, "File Word (.docx atau .doc) wajib diunggah.")
	}
	defer os.Remove(saved.Path)
	parsed, err := examdocx.ParseFile(saved.Path)
	if err != nil {
		return err
	}
	return httpx.Success(c, fiber.Map{
		"questions": parsed.Questions, "warnings": parsed.Warnings,
		"extractedImages": parsed.ExtractedImages, "embeddedImageCount": parsed.EmbeddedImageCount,
		"csvContent": examcsv.Serialize(parsed.Questions), "questionCount": len(parsed.Questions),
	})
}

func (h *Handler) QuestionsToCSV(c *fiber.Ctx) error {
	var body struct {
		Questions []examcsv.Question `json:"questions"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Questions) == 0 {
		return httpx.New(400, "Daftar soal tidak valid atau kosong.")
	}
	return httpx.Success(c, fiber.Map{
		"questions": body.Questions, "warnings": examcsv.Validate(body.Questions),
		"csvContent": examcsv.Serialize(body.Questions), "questionCount": len(body.Questions),
	})
}

func asBool(v any) bool {
	switch t := v.(type) {
	case bool:
		return t
	case string:
		return t == "true" || t == "1"
	default:
		return false
	}
}

func stringifyAny(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case int:
		return strconv.Itoa(t)
	case bool:
		return strconv.FormatBool(t)
	default:
		return ""
	}
}

func nilIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
