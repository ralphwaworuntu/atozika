package admin

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"atozika/internal/examcsv"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/materials"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
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

// announcementInput reads announcement fields from multipart or JSON bodies,
// reporting only the fields the client actually sent.
func announcementInput(c *fiber.Ctx) (map[string]any, error) {
	out := map[string]any{}
	if strings.HasPrefix(string(c.Request().Header.ContentType()), "multipart/") {
		form, err := c.MultipartForm()
		if err != nil {
			return nil, httpx.New(400, "Invalid body")
		}
		get := func(k string) (string, bool) {
			v, ok := form.Value[k]
			if !ok || len(v) == 0 {
				return "", false
			}
			return v[0], true
		}
		if v, ok := get("title"); ok {
			out["title"] = strings.TrimSpace(v)
		}
		if v, ok := get("body"); ok {
			out["body"] = v
		}
		if v, ok := get("targetAll"); ok {
			out["targetAll"] = asBool(strings.ToLower(strings.TrimSpace(v)))
		}
		if v, ok := get("targetPackageIds"); ok {
			ids, err := parseIDList(v)
			if err != nil {
				return nil, err
			}
			out["targetPackageIds"] = ids
		}
		return out, nil
	}
	var body struct {
		Title            *string  `json:"title"`
		Body             *string  `json:"body"`
		TargetAll        *bool    `json:"targetAll"`
		TargetPackageIDs []string `json:"targetPackageIds"`
	}
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&body); err != nil {
			return nil, httpx.New(400, "Invalid body")
		}
	}
	if body.Title != nil {
		out["title"] = strings.TrimSpace(*body.Title)
	}
	if body.Body != nil {
		out["body"] = *body.Body
	}
	if body.TargetAll != nil {
		out["targetAll"] = *body.TargetAll
	}
	if body.TargetPackageIDs != nil {
		out["targetPackageIds"] = body.TargetPackageIDs
	}
	return out, nil
}

func parseIDList(raw string) ([]string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []string{}, nil
	}
	var ids []string
	if err := json.Unmarshal([]byte(raw), &ids); err != nil {
		return nil, httpx.New(400, "Daftar paket tidak valid")
	}
	return ids, nil
}

func (h *Handler) announcementTargets(in map[string]any, item *models.Announcement) error {
	if v, ok := in["targetAll"].(bool); ok {
		item.TargetAll = v
	}
	if ids, ok := in["targetPackageIds"].([]string); ok {
		if len(ids) > 0 {
			var n int64
			h.DB.Model(&models.MembershipPackage{}).Where("id IN ?", ids).Count(&n)
			if int(n) != len(ids) {
				return httpx.New(400, "Paket target tidak ditemukan")
			}
		}
		b, _ := json.Marshal(ids)
		item.TargetPackageIDs = datatypes.JSON(b)
	}
	if !item.TargetAll {
		var ids []string
		_ = json.Unmarshal(item.TargetPackageIDs, &ids)
		if len(ids) == 0 {
			return httpx.New(400, "Pilih minimal satu paket target atau kirim ke semua member")
		}
	}
	return nil
}

func (h *Handler) CreateAnnouncement(c *fiber.Ctx) error {
	in, err := announcementInput(c)
	if err != nil {
		return err
	}
	title, _ := in["title"].(string)
	if title == "" {
		return httpx.New(400, "Judul wajib diisi")
	}
	body, _ := in["body"].(string)
	item := models.Announcement{
		ID: id.New(), Title: title, Body: body, PublishedAt: time.Now(), TargetAll: true,
		TargetPackageIDs: datatypes.JSON("[]"),
	}
	if err := h.announcementTargets(in, &item); err != nil {
		return err
	}
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	item.ImageURL = ptr(img)
	if cur := middleware.Current(c); cur != nil {
		item.CreatedByID = &cur.ID
	}
	if err := h.DB.Create(&item).Error; err != nil {
		return err
	}
	return httpx.Created(c, item)
}
func (h *Handler) UpdateAnnouncement(c *fiber.Ctx) error {
	var item models.Announcement
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	in, err := announcementInput(c)
	if err != nil {
		return err
	}
	if v, ok := in["title"].(string); ok {
		if v == "" {
			return httpx.New(400, "Judul wajib diisi")
		}
		item.Title = v
	}
	if v, ok := in["body"].(string); ok {
		item.Body = v
	}
	if err := h.announcementTargets(in, &item); err != nil {
		return err
	}
	img, err := h.saveImage(c, "image", "content")
	if err != nil {
		return err
	}
	if img != "" {
		item.ImageURL = &img
	}
	if err := h.DB.Model(&item).Select("title", "body", "targetAll", "targetPackageIds", "imageUrl").Updates(&item).Error; err != nil {
		return err
	}
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
	normalized, err := normalizeNewsKind(kind)
	if err != nil {
		return err
	}
	item := models.NewsArticle{
		ID: id.New(), Title: title, Slug: slug, Excerpt: excerpt, Content: content,
		CoverURL: ptr(cover), Published: time.Now(), Kind: normalized,
	}
	if err := h.DB.Create(&item).Error; err != nil {
		return err
	}
	return httpx.Created(c, item)
}
func (h *Handler) UpdateNews(c *fiber.Ctx) error {
	var item models.NewsArticle
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{}
	if form, err := c.MultipartForm(); err == nil && form != nil {
		for _, k := range []string{"title", "slug", "excerpt", "content", "kind"} {
			if v, ok := form.Value[k]; ok && len(v) > 0 {
				updates[k] = v[0]
			}
		}
	} else {
		for _, k := range []string{"title", "slug", "excerpt", "content", "kind"} {
			if v := c.FormValue(k); v != "" {
				updates[k] = v
			}
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
	if raw, ok := updates["kind"].(string); ok {
		normalized, err := normalizeNewsKind(raw)
		if err != nil {
			return err
		}
		updates["kind"] = normalized
	}
	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		return err
	}
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

func reportingSort(c *fiber.Ctx) string {
	if c.Query("sort") == "asc" {
		return "ASC"
	}
	return "DESC"
}

func (h *Handler) reportingUsers(c *fiber.Ctx, membersOnly bool) []models.User {
	q := h.DB.Where("email <> ?", hiddenAdminEmail)
	if membersOnly {
		q = q.Where("role = ?", "MEMBER")
	}
	var users []models.User
	applyDates(q, `"createdAt"`, c).Order(`"createdAt" ` + reportingSort(c)).Find(&users)
	return users
}

func (h *Handler) memberActivity(u models.User) fiber.Map {
	item := fiber.Map{
		"id": u.ID, "name": u.Name, "email": u.Email, "joinedAt": u.CreatedAt, "createdAt": u.CreatedAt,
		"membership": nil, "latestTryout": nil, "latestPractice": nil, "latestCermat": nil,
	}
	var trx models.Transaction
	if h.DB.Preload("Package").Where(`"userId" = ? AND type = ? AND status = ?`, u.ID, "MEMBERSHIP", "PAID").
		Order(`"activatedAt" DESC NULLS LAST`).Limit(1).Find(&trx).RowsAffected > 0 {
		item["membership"] = fiber.Map{"packageName": trx.Package.Name, "activatedAt": trx.ActivatedAt, "expiresAt": trx.ExpiresAt}
	}
	var tr models.TryoutResult
	if h.DB.Where(`"userId" = ? AND "completedAt" IS NOT NULL`, u.ID).Order(`"completedAt" DESC`).Limit(1).Find(&tr).RowsAffected > 0 {
		item["latestTryout"] = fiber.Map{"score": tr.Score, "createdAt": tr.CompletedAt}
	}
	var pr models.PracticeResult
	if h.DB.Where(`"userId" = ? AND "completedAt" IS NOT NULL`, u.ID).Order(`"completedAt" DESC`).Limit(1).Find(&pr).RowsAffected > 0 {
		item["latestPractice"] = fiber.Map{"score": pr.Score, "createdAt": pr.CompletedAt}
	}
	var cs models.CermatSession
	if h.DB.Where(`"userId" = ? AND "finishedAt" IS NOT NULL`, u.ID).Order(`"finishedAt" DESC`).Limit(1).Find(&cs).RowsAffected > 0 {
		item["latestCermat"] = fiber.Map{"correctCount": cs.CorrectCount, "totalQuestions": cs.TotalQuestions, "createdAt": cs.FinishedAt}
	}
	return item
}

func (h *Handler) userRow(u models.User) fiber.Map {
	var area models.MemberArea
	var memberArea any
	if h.DB.Where(`"userId" = ?`, u.ID).Limit(1).Find(&area).RowsAffected > 0 {
		memberArea = fiber.Map{"slug": area.Slug}
	}
	return fiber.Map{
		"id": u.ID, "name": u.Name, "email": u.Email, "role": u.Role, "isActive": u.IsActive,
		"createdAt": u.CreatedAt, "phone": u.Phone, "memberArea": memberArea,
	}
}

func (h *Handler) ReportingMembers(c *fiber.Ctx) error {
	out := []fiber.Map{}
	for _, u := range h.reportingUsers(c, true) {
		out = append(out, h.memberActivity(u))
	}
	return httpx.Success(c, out)
}

func (h *Handler) ReportingUsers(c *fiber.Ctx) error {
	out := []fiber.Map{}
	for _, u := range h.reportingUsers(c, false) {
		out = append(out, h.userRow(u))
	}
	return httpx.Success(c, out)
}

func formatOptTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(time.RFC3339)
}

func formatOptScore(v any) string {
	switch s := v.(type) {
	case *float64:
		if s == nil {
			return ""
		}
		return strconv.FormatFloat(*s, 'f', 2, 64)
	case int:
		return strconv.Itoa(s)
	}
	return ""
}

func (h *Handler) ReportingExport(c *fiber.Ctx) error {
	rows := []map[string]any{}
	if c.Query("type") == "users" {
		for _, u := range h.reportingUsers(c, false) {
			r := h.userRow(u)
			phone, area := "", ""
			if u.Phone != nil {
				phone = *u.Phone
			}
			if m, ok := r["memberArea"].(fiber.Map); ok {
				area, _ = m["slug"].(string)
			}
			rows = append(rows, map[string]any{
				"id": u.ID, "name": u.Name, "email": u.Email, "role": u.Role,
				"status": map[bool]string{true: "AKTIF", false: "NONAKTIF"}[u.IsActive],
				"phone":  phone, "memberArea": area, "createdAt": u.CreatedAt.Format(time.RFC3339),
			})
		}
		return csvAttachment(c, "laporan-user.csv", examcsv.ToRows(
			[]string{"id", "name", "email", "role", "status", "phone", "memberArea", "createdAt"}, rows))
	}
	for _, u := range h.reportingUsers(c, true) {
		a := h.memberActivity(u)
		row := map[string]any{
			"id": u.ID, "name": u.Name, "email": u.Email, "joinedAt": u.CreatedAt.Format(time.RFC3339),
			"package": "", "expiresAt": "", "latestTryoutScore": "", "latestPracticeScore": "", "latestCermat": "",
		}
		if m, ok := a["membership"].(fiber.Map); ok {
			row["package"] = m["packageName"]
			if exp, ok := m["expiresAt"].(*time.Time); ok {
				row["expiresAt"] = formatOptTime(exp)
			}
		}
		if m, ok := a["latestTryout"].(fiber.Map); ok {
			row["latestTryoutScore"] = formatOptScore(m["score"])
		}
		if m, ok := a["latestPractice"].(fiber.Map); ok {
			row["latestPracticeScore"] = formatOptScore(m["score"])
		}
		if m, ok := a["latestCermat"].(fiber.Map); ok {
			row["latestCermat"] = formatOptScore(m["correctCount"]) + "/" + formatOptScore(m["totalQuestions"])
		}
		rows = append(rows, row)
	}
	return csvAttachment(c, "laporan-member.csv", examcsv.ToRows(
		[]string{"id", "name", "email", "joinedAt", "package", "expiresAt", "latestTryoutScore", "latestPracticeScore", "latestCermat"}, rows))
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
	if !materials.ValidCategory(body.Category) {
		return httpx.New(400, "Kategori materi tidak valid")
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
	if raw, ok := body["category"].(string); ok && !materials.ValidCategory(raw) {
		return httpx.New(400, "Kategori materi tidak valid")
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
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	limit := c.QueryInt("limit", 20)
	if limit < 1 || limit > 100 {
		limit = 20
	}
	var total int64
	if err := h.DB.Model(&models.ContactMessage{}).Count(&total).Error; err != nil {
		return err
	}
	items := []models.ContactMessage{}
	if err := h.DB.Order(`"createdAt" DESC`).Offset((page - 1) * limit).Limit(limit).Find(&items).Error; err != nil {
		return err
	}
	pages := int((total + int64(limit) - 1) / int64(limit))
	return httpx.Success(c, fiber.Map{"items": items, "total": total, "page": page, "limit": limit, "pages": pages})
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

func normalizeNewsKind(kind string) (string, error) {
	k := strings.ToUpper(strings.TrimSpace(kind))
	switch k {
	case "":
		return "EDUKASI", nil
	case "EDUKASI", "KUOTA", "ALUMNI", "NEWS", "INSIGHT":
		return k, nil
	default:
		return "", httpx.New(400, "Kategori berita harus EDUKASI, KUOTA, ALUMNI, NEWS, atau INSIGHT")
	}
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
