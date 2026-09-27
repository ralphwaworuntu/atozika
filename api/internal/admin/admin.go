package admin

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"atozika/internal/calculators"
	"atozika/internal/config"
	"atozika/internal/examcsv"
	"atozika/internal/id"
	"atozika/internal/models"
	"atozika/internal/upload"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

const hiddenAdminEmail = "developer@atozika.id"

type Handler struct {
	DB     *gorm.DB
	Cfg    config.Config
	Upload string
	Calc   *calculators.Handler
}

func Register(r fiber.Router, h *Handler) {
	r.Get("/overview", h.Overview)
	r.Get("/reporting/summary", h.ReportingSummary)
	r.Get("/reporting/members", h.ReportingMembers)
	r.Get("/reporting/users", h.ReportingUsers)
	r.Get("/reporting/export", h.ReportingExport)
	r.Get("/ranking", h.Ranking)
	r.Get("/ranking/export", h.RankingExport)
	r.Get("/landing", h.Landing)

	r.Post("/landing/stats", h.CreateStat)
	r.Put("/landing/stats/:id", h.UpdateStat)
	r.Delete("/landing/stats/:id", h.DeleteStat)
	r.Post("/landing/testimonials", h.CreateTestimonial)
	r.Put("/landing/testimonials/:id", h.UpdateTestimonial)
	r.Delete("/landing/testimonials/:id", h.DeleteTestimonial)
	r.Post("/landing/gallery", h.CreateGallery)
	r.Put("/landing/gallery/:id", h.UpdateGallery)
	r.Delete("/landing/gallery/:id", h.DeleteGallery)
	r.Post("/landing/videos", h.CreateVideo)
	r.Put("/landing/videos/:id", h.UpdateVideo)
	r.Delete("/landing/videos/:id", h.DeleteVideo)
	r.Post("/landing/announcements", h.CreateAnnouncement)
	r.Put("/landing/announcements/:id", h.UpdateAnnouncement)
	r.Delete("/landing/announcements/:id", h.DeleteAnnouncement)
	r.Get("/announcements/export", h.ExportAnnouncements)
	r.Post("/landing/faq", h.CreateFAQ)
	r.Put("/landing/faq/:id", h.UpdateFAQ)
	r.Delete("/landing/faq/:id", h.DeleteFAQ)
	r.Post("/landing/news", h.CreateNews)
	r.Put("/landing/news/:id", h.UpdateNews)
	r.Delete("/landing/news/:id", h.DeleteNews)

	r.Get("/tryouts/categories", h.ListTryoutCats)
	r.Post("/tryouts/categories", h.CreateTryoutCat)
	r.Put("/tryouts/categories/:id", h.UpdateTryoutCat)
	r.Delete("/tryouts/categories/:id", h.DeleteTryoutCat)
	r.Get("/tryouts/sub-categories", h.ListTryoutSubs)
	r.Post("/tryouts/sub-categories", h.CreateTryoutSub)
	r.Put("/tryouts/sub-categories/:id", h.UpdateTryoutSub)
	r.Delete("/tryouts/sub-categories/:id", h.DeleteTryoutSub)
	r.Get("/tryouts", h.ListTryouts)
	r.Get("/tryouts/psiko-config", h.GetPsikoConfig)
	r.Put("/tryouts/psiko-config", h.PutPsikoConfig)
	r.Get("/tryouts/export", h.ExportTryouts)
	r.Get("/tryouts/questions/export", h.ExportTryoutQuestions)
	r.Post("/tryouts", h.CreateTryout)
	r.Put("/tryouts/:id", h.UpdateTryout)
	r.Patch("/tryouts/:id/free", h.PatchTryoutFree)
	r.Delete("/tryouts/:id", h.DeleteTryout)

	r.Get("/practice/categories", h.ListPracticeCats)
	r.Post("/practice/categories", h.CreatePracticeCat)
	r.Put("/practice/categories/:id", h.UpdatePracticeCat)
	r.Delete("/practice/categories/:id", h.DeletePracticeCat)
	r.Get("/practice/sub-categories", h.ListPracticeSubs)
	r.Post("/practice/sub-categories", h.CreatePracticeSub)
	r.Put("/practice/sub-categories/:id", h.UpdatePracticeSub)
	r.Delete("/practice/sub-categories/:id", h.DeletePracticeSub)
	r.Get("/practice/sub-sub-categories", h.ListPracticeSubSubs)
	r.Post("/practice/sub-sub-categories", h.CreatePracticeSubSub)
	r.Put("/practice/sub-sub-categories/:id", h.UpdatePracticeSubSub)
	r.Delete("/practice/sub-sub-categories/:id", h.DeletePracticeSubSub)
	r.Get("/practice/sets", h.ListPracticeSets)
	r.Post("/practice/sets", h.CreatePracticeSet)
	r.Put("/practice/sets/:id", h.UpdatePracticeSet)
	r.Patch("/practice/sets/:id/free", h.PatchPracticeFree)
	r.Delete("/practice/sets/:id", h.DeletePracticeSet)
	r.Get("/practice/export", h.ExportPractice)
	r.Get("/practice/questions/export", h.ExportPracticeQuestions)

	r.Get("/materials", h.ListMaterials)
	r.Get("/materials/export", h.ExportMaterials)
	r.Post("/materials", h.CreateMaterial)
	r.Put("/materials/:id", h.UpdateMaterial)
	r.Delete("/materials/:id", h.DeleteMaterial)

	r.Get("/packages", h.ListPackages)
	r.Post("/packages", h.CreatePackage)
	r.Put("/packages/:id", h.UpdatePackage)
	r.Delete("/packages/:id", h.DeletePackage)
	r.Get("/addons", h.ListAddons)
	r.Post("/addons", h.CreateAddon)
	r.Put("/addons/:id", h.UpdateAddon)
	r.Delete("/addons/:id", h.DeleteAddon)

	r.Get("/payment-setting", h.GetPayment)
	r.Put("/payment-setting", h.PutPayment)
	r.Get("/site/contact-config", h.GetContactConfig)
	r.Put("/site/contact-config", h.PutContactConfig)
	r.Get("/site/member-background", h.GetMemberBackground)
	r.Put("/site/member-background", h.PutMemberBackground)
	r.Get("/site/exam-control", h.GetExamControl)
	r.Put("/site/exam-control", h.PutExamControl)
	r.Get("/site/exam-block-config", h.GetExamBlockConfig)
	r.Put("/site/exam-block-config", h.PutExamBlockConfig)
	r.Get("/site/welcome-modal", h.ListWelcome)
	r.Post("/site/welcome-modal", h.CreateWelcome)
	r.Put("/site/welcome-modal/:id", h.UpdateWelcome)
	r.Delete("/site/welcome-modal/:id", h.DeleteWelcome)
	r.Get("/exams/cermat-config", h.GetCermatConfig)
	r.Put("/exams/cermat-config", h.PutCermatConfig)
	r.Get("/site/hero-image", h.GetHeroImage)
	r.Post("/site/hero-image", h.PutHeroImage)
	r.Get("/site/hero-slides", h.ListHeroSlides)
	r.Post("/site/hero-slides", h.CreateHeroSlide)
	r.Delete("/site/hero-slides/:id", h.DeleteHeroSlide)
	r.Get("/dashboard/slides", h.ListMemberSlides)
	r.Post("/dashboard/slides", h.CreateMemberSlide)
	r.Put("/dashboard/slides/:id", h.UpdateMemberSlide)
	r.Delete("/dashboard/slides/:id", h.DeleteMemberSlide)

	r.Get("/monitoring/users", h.MonitoringUsers)
	r.Get("/monitoring/users/:id", h.MonitoringUser)
	r.Get("/monitoring/system-metrics", h.SystemMetrics)
	r.Get("/exams/blocks", h.ListBlocks)
	r.Post("/exams/blocks/:id/regenerate", h.RegenBlock)
	r.Post("/exams/blocks/:id/resolve", h.ResolveBlock)
	r.Post("/membership/grant-tryout", h.GrantTryout)
	r.Get("/contacts/messages", h.ContactMessages)
	r.Get("/calculators", h.Calc.AdminList)
	r.Get("/calculators/export", h.ExportCalculators)
	r.Put("/calculators/:id", h.Calc.AdminUpdate)

	r.Get("/transactions", h.ListTransactions)
	r.Patch("/transactions/:id/status", h.PatchTransaction)

	r.Get("/users", h.Users)
	r.Get("/users/export", h.UsersExport)
	r.Patch("/users/:id/role", h.PatchRole)
	r.Patch("/users/:id/status", h.PatchStatus)
	r.Post("/users/:id/reset-password", h.ResetPassword)
	r.Post("/users/:id/impersonate", h.Impersonate)

	r.Post("/tools/convert-word-to-csv", h.ConvertWord)
	r.Post("/tools/questions-to-csv", h.QuestionsToCSV)
}

func noContent(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusNoContent) }

func (h *Handler) saveImage(c *fiber.Ctx, field, sub string) (string, error) {
	saved, err := upload.Save(c, field, h.Upload+"/"+sub, "uploads/"+sub, 8<<20, upload.Images)
	if err != nil {
		return "", err
	}
	if saved == nil {
		return "", nil
	}
	return saved.PublicURL, nil
}

func (h *Handler) withOrigin(c *fiber.Ctx, path string) string {
	if path == "" || strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	origin := c.Protocol() + "://" + c.Hostname()
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return origin + path
}

func (h *Handler) setting(key string) string {
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return ""
	}
	return s.Value
}

func (h *Handler) upsertSetting(key, value string) {
	now := time.Now()
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		h.DB.Create(&models.SiteSetting{ID: id.New(), Key: key, Value: value, CreatedAt: now, UpdatedAt: now})
		return
	}
	h.DB.Model(&s).Updates(map[string]any{"value": value, "updatedAt": now})
}

func formBool(c *fiber.Ctx, key string, fallback bool) bool {
	v := strings.TrimSpace(c.FormValue(key))
	if v == "" {
		return fallback
	}
	v = strings.ToLower(v)
	return v == "true" || v == "1" || v == "on" || v == "yes"
}

func formInt(c *fiber.Ctx, key string, fallback int) int {
	v := strings.TrimSpace(c.FormValue(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func formTime(c *fiber.Ctx, key string) *time.Time {
	v := strings.TrimSpace(c.FormValue(key))
	if v == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		t, err = time.Parse("2006-01-02", v)
		if err != nil {
			return nil
		}
	}
	return &t
}

func ptr(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func isProtected(user models.User) bool {
	return user.Name == "Super Admin" || user.Email == hiddenAdminEmail
}

func isPolriPsiko(sub models.TryoutSubCategory) bool {
	cat := strings.ToLower(sub.Category.Name + " " + sub.Category.Slug)
	subn := strings.ToLower(sub.Name + " " + sub.Slug)
	return strings.Contains(cat, "polri") && strings.Contains(subn, "psiko")
}

func csvAttachment(c *fiber.Ctx, filename, body string) error {
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	return c.SendString(body)
}

func multipleCorrect(opts []examcsv.Option) bool {
	n := 0
	for _, o := range opts {
		if o.IsCorrect {
			n++
		}
	}
	return n > 1
}

func dateFilter(c *fiber.Ctx) (from, to *time.Time) {
	if s := c.Query("startDate"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			from = &t
		} else if t, err := time.Parse("2006-01-02", s); err == nil {
			from = &t
		}
	}
	if s := c.Query("endDate"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			to = &t
		} else if t, err := time.Parse("2006-01-02", s); err == nil {
			end := t.Add(24 * time.Hour)
			to = &end
		}
	}
	return
}

func applyDates(q *gorm.DB, col string, c *fiber.Ctx) *gorm.DB {
	from, to := dateFilter(c)
	if from != nil {
		q = q.Where(col+" >= ?", *from)
	}
	if to != nil {
		q = q.Where(col+" <= ?", *to)
	}
	return q
}
