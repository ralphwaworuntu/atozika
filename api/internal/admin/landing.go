package admin

import (
	"strconv"
	"strings"
	"time"

	"atozika/internal/examcsv"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) Landing(c *fiber.Ctx) error {
	var stats []models.LandingStat
	var testimonials []models.Testimonial
	var gallery []models.GalleryItem
	var videos []models.YoutubeVideo
	var announcements []models.Announcement
	var faqs []models.Faq
	var news []models.NewsArticle
	h.DB.Order("label ASC").Find(&stats)
	h.DB.Order("name ASC").Find(&testimonials)
	h.DB.Order("title ASC").Find(&gallery)
	h.DB.Order("title ASC").Find(&videos)
	h.DB.Order(`"publishedAt" DESC`).Find(&announcements)
	h.DB.Order(`"order" ASC`).Find(&faqs)
	h.DB.Order("published DESC").Find(&news)
	return httpx.Success(c, fiber.Map{
		"stats": stats, "testimonials": testimonials, "gallery": gallery, "videos": videos,
		"announcements": announcements, "faqs": faqs, "news": news,
	})
}

func (h *Handler) CreateStat(c *fiber.Ctx) error {
	var body models.LandingStat
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateStat(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.LandingStat
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteStat(c *fiber.Ctx) error {
	if err := h.DB.Delete(&models.LandingStat{}, "id = ?", c.Params("id")).Error; err != nil {
		return err
	}
	return noContent(c)
}

func (h *Handler) CreateTestimonial(c *fiber.Ctx) error {
	var body models.Testimonial
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateTestimonial(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.Testimonial
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteTestimonial(c *fiber.Ctx) error {
	h.DB.Delete(&models.Testimonial{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) CreateGallery(c *fiber.Ctx) error {
	var body models.GalleryItem
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateGallery(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.GalleryItem
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteGallery(c *fiber.Ctx) error {
	h.DB.Delete(&models.GalleryItem{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) CreateVideo(c *fiber.Ctx) error {
	var body models.YoutubeVideo
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateVideo(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.YoutubeVideo
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteVideo(c *fiber.Ctx) error {
	h.DB.Delete(&models.YoutubeVideo{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) CreateAnnouncement(c *fiber.Ctx) error {
	title := c.FormValue("title")
	body := c.FormValue("body")
	if title == "" {
		var payload models.Announcement
		if err := c.BodyParser(&payload); err == nil {
			title, body = payload.Title, payload.Body
		}
	}
	if title == "" {
		return httpx.New(400, "Judul wajib diisi")
	}
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	item := models.Announcement{
		ID: id.New(), Title: title, Body: body, PublishedAt: time.Now(), TargetAll: true,
		ImageURL: ptr(img), CreatedByID: nil,
	}
	if cur := middleware.Current(c); cur != nil {
		item.CreatedByID = &cur.ID
	}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdateAnnouncement(c *fiber.Ctx) error {
	var item models.Announcement
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{}
	if v := c.FormValue("title"); v != "" {
		updates["title"] = v
	}
	if v := c.FormValue("body"); v != "" {
		updates["body"] = v
	}
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	if img != "" {
		updates["imageUrl"] = img
	}
	if len(updates) == 0 {
		var body map[string]any
		_ = c.BodyParser(&body)
		updates = body
	}
	if len(updates) == 0 {
		return httpx.New(400, "No data provided")
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteAnnouncement(c *fiber.Ctx) error {
	h.DB.Delete(&models.Announcement{}, "id = ?", c.Params("id"))
	return noContent(c)
}
func (h *Handler) ExportAnnouncements(c *fiber.Ctx) error {
	var items []models.Announcement
	h.DB.Order(`"publishedAt" DESC`).Find(&items)
	rows := make([]map[string]any, 0, len(items))
	for _, it := range items {
		rows = append(rows, map[string]any{"id": it.ID, "title": it.Title, "body": it.Body, "publishedAt": it.PublishedAt.Format(time.RFC3339)})
	}
	return csvAttachment(c, "pengumuman.csv", examcsv.ToRows([]string{"id", "title", "body", "publishedAt"}, rows))
}

func (h *Handler) CreateFAQ(c *fiber.Ctx) error {
	var body models.Faq
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateFAQ(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.Faq
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteFAQ(c *fiber.Ctx) error {
	h.DB.Delete(&models.Faq{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) CreateNews(c *fiber.Ctx) error {
	title := c.FormValue("title")
	slug := c.FormValue("slug")
	excerpt := c.FormValue("excerpt")
	content := c.FormValue("content")
	kind := c.FormValue("kind")
	if title == "" {
		var payload models.NewsArticle
		if err := c.BodyParser(&payload); err == nil {
			title, slug, excerpt, content, kind = payload.Title, payload.Slug, payload.Excerpt, payload.Content, payload.Kind
		}
	}
	if title == "" || slug == "" {
		return httpx.New(400, "Judul dan slug wajib")
	}
	cover, err := h.saveImage(c, "coverImage", "content")
	if err != nil {
		return err
	}
	item := models.NewsArticle{
		ID: id.New(), Title: title, Slug: slug, Excerpt: excerpt, Content: content,
		CoverURL: ptr(cover), Published: time.Now(), Kind: kind,
	}
	if item.Kind == "" {
		item.Kind = "NEWS"
	}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdateNews(c *fiber.Ctx) error {
	var item models.NewsArticle
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{}
	for _, k := range []string{"title", "slug", "excerpt", "content", "kind"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	cover, err := h.saveImage(c, "coverImage", "content")
	if err != nil {
		return err
	}
	if cover != "" {
		updates["coverUrl"] = cover
	}
	if len(updates) == 0 {
		var body map[string]any
		_ = c.BodyParser(&body)
		updates = body
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteNews(c *fiber.Ctx) error {
	h.DB.Delete(&models.NewsArticle{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) Overview(c *fiber.Ctx) error {
	var users, tryouts, practiceSets, materials, transactions int64
	var amount int64
	h.DB.Model(&models.User{}).Count(&users)
	h.DB.Model(&models.Tryout{}).Count(&tryouts)
	h.DB.Model(&models.PracticeSet{}).Count(&practiceSets)
	h.DB.Model(&models.Material{}).Count(&materials)
	h.DB.Model(&models.Transaction{}).Count(&transactions)
	h.DB.Model(&models.Transaction{}).Where("status = ?", "PAID").Select("COALESCE(SUM(amount),0)").Scan(&amount)
	return httpx.Success(c, fiber.Map{
		"users": users, "tryouts": tryouts, "practiceSets": practiceSets, "materials": materials,
		"transactions": transactions, "transactionAmount": amount,
		"chartSeries": []fiber.Map{
			{"label": "Total Pengguna", "value": users},
			{"label": "Tryout Aktif", "value": tryouts},
			{"label": "Latihan & Tugas", "value": practiceSets},
			{"label": "Materi Belajar", "value": materials},
			{"label": "Transaksi", "value": transactions},
		},
	})
}

func (h *Handler) ReportingSummary(c *fiber.Ctx) error {
	var members, tryoutCategories, tryoutQuestions, practiceCategories, practiceQuestions int64
	mq := applyDates(h.DB.Model(&models.User{}).Where("role = ?", "MEMBER"), `"createdAt"`, c)
	mq.Count(&members)
	applyDates(h.DB.Model(&models.TryoutCategory{}), `"createdAt"`, c).Count(&tryoutCategories)
	applyDates(h.DB.Model(&models.TryoutQuestion{}), `"createdAt"`, c).Count(&tryoutQuestions)
	applyDates(h.DB.Model(&models.PracticeCategory{}), `"createdAt"`, c).Count(&practiceCategories)
	applyDates(h.DB.Model(&models.PracticeQuestion{}), `"createdAt"`, c).Count(&practiceQuestions)
	return httpx.Success(c, fiber.Map{
		"members": members, "tryoutCategories": tryoutCategories, "tryoutQuestions": tryoutQuestions,
		"practiceCategories": practiceCategories, "practiceQuestions": practiceQuestions,
	})
}

func (h *Handler) ReportingMembers(c *fiber.Ctx) error {
	sort := "DESC"
	if c.Query("sort") == "asc" {
		sort = "ASC"
	}
	var users []models.User
	applyDates(h.DB.Where("role = ?", "MEMBER"), `"createdAt"`, c).Order(`"createdAt" ` + sort).Find(&users)
	out := []fiber.Map{}
	for _, u := range users {
		var trx models.Transaction
		h.DB.Preload("Package").Where(`"userId" = ? AND type = ? AND status = ?`, u.ID, "MEMBERSHIP", "PAID").
			Order(`"activatedAt" DESC`).First(&trx)
		item := fiber.Map{"id": u.ID, "name": u.Name, "email": u.Email, "createdAt": u.CreatedAt}
		if trx.ID != "" {
			item["membership"] = fiber.Map{"packageName": trx.Package.Name, "activatedAt": trx.ActivatedAt, "expiresAt": trx.ExpiresAt}
		}
		out = append(out, item)
	}
	return httpx.Success(c, out)
}

func (h *Handler) ReportingUsers(c *fiber.Ctx) error {
	return h.ReportingMembers(c)
}

func (h *Handler) ReportingExport(c *fiber.Ctx) error {
	var users []models.User
	h.DB.Where("role = ?", "MEMBER").Where("email <> ?", hiddenAdminEmail).Order(`"createdAt" DESC`).Find(&users)
	rows := []map[string]any{}
	for _, u := range users {
		phone := ""
		if u.Phone != nil {
			phone = *u.Phone
		}
		rows = append(rows, map[string]any{"id": u.ID, "name": u.Name, "email": u.Email, "phone": phone, "createdAt": u.CreatedAt.Format(time.RFC3339)})
	}
	return csvAttachment(c, "laporan-member.csv", examcsv.ToRows([]string{"id", "name", "email", "phone", "createdAt"}, rows))
}

func (h *Handler) ListMaterials(c *fiber.Ctx) error {
	var items []models.Material
	h.DB.Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) ExportMaterials(c *fiber.Ctx) error {
	var items []models.Material
	h.DB.Order(`"createdAt" DESC`).Find(&items)
	rows := []map[string]any{}
	for _, it := range items {
		rows = append(rows, map[string]any{"id": it.ID, "title": it.Title, "category": it.Category, "type": it.Type, "fileUrl": it.FileURL})
	}
	return csvAttachment(c, "materi.csv", examcsv.ToRows([]string{"id", "title", "category", "type", "fileUrl"}, rows))
}
func (h *Handler) CreateMaterial(c *fiber.Ctx) error {
	var body models.Material
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	body.ID = id.New()
	body.CreatedAt = time.Now()
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
func (h *Handler) UpdateMaterial(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil || len(body) == 0 {
		return httpx.New(400, "No data provided")
	}
	var item models.Material
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Materi tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteMaterial(c *fiber.Ctx) error {
	h.DB.Delete(&models.Material{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ContactMessages(c *fiber.Ctx) error {
	var items []models.ContactMessage
	h.DB.Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) ExportCalculators(c *fiber.Ctx) error {
	var items []models.PsychCalculatorTemplate
	h.DB.Order("title ASC").Find(&items)
	rows := []map[string]any{}
	for _, it := range items {
		rows = append(rows, map[string]any{"id": it.ID, "title": it.Title, "slug": it.Slug, "category": it.Category, "type": it.Type})
	}
	return csvAttachment(c, "kalkulator.csv", examcsv.ToRows([]string{"id", "title", "slug", "category", "type"}, rows))
}

func optionCSVFields(opts []models.TryoutOption) map[string]any {
	letters := []string{"a", "b", "c", "d", "e"}
	fields := map[string]any{}
	for i, letter := range letters {
		if i < len(opts) {
			o := opts[i]
			img := ""
			if o.ImageURL != nil {
				img = *o.ImageURL
			}
			fields["option_"+letter] = o.Label
			fields["option_"+letter+"_image"] = img
			fields["option_"+letter+"_correct"] = strings.ToUpper(strconv.FormatBool(o.IsCorrect))
		} else {
			fields["option_"+letter] = ""
			fields["option_"+letter+"_image"] = ""
			fields["option_"+letter+"_correct"] = ""
		}
	}
	return fields
}

func optionCSVFieldsPractice(opts []models.PracticeOption) map[string]any {
	converted := make([]models.TryoutOption, len(opts))
	for i, o := range opts {
		converted[i] = models.TryoutOption{Label: o.Label, ImageURL: o.ImageURL, IsCorrect: o.IsCorrect}
	}
	return optionCSVFields(converted)
}
