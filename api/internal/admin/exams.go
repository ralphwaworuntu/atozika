package admin

import (
	"os"
	"strings"
	"time"

	"atozika/internal/examcsv"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/models"
	"atozika/internal/upload"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) ListTryoutCats(c *fiber.Ctx) error {
	var items []models.TryoutCategory
	h.DB.Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) CreateTryoutCat(c *fiber.Ctx) error {
	name, slug := c.FormValue("name"), c.FormValue("slug")
	if name == "" {
		var body models.TryoutCategory
		_ = c.BodyParser(&body)
		name, slug = body.Name, body.Slug
	}
	if name == "" || slug == "" {
		return httpx.New(400, "Nama dan slug wajib")
	}
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	now := time.Now()
	item := models.TryoutCategory{ID: id.New(), Name: name, Slug: slug, Thumbnail: ptr(img), CreatedAt: now, UpdatedAt: now}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdateTryoutCat(c *fiber.Ctx) error {
	var item models.TryoutCategory
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	if v := c.FormValue("name"); v != "" {
		updates["name"] = v
	}
	if v := c.FormValue("slug"); v != "" {
		updates["slug"] = v
	}
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	if img != "" {
		updates["thumbnail"] = img
	}
	if len(updates) == 1 {
		var body map[string]any
		_ = c.BodyParser(&body)
		for k, v := range body {
			updates[k] = v
		}
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteTryoutCat(c *fiber.Ctx) error {
	h.DB.Delete(&models.TryoutCategory{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListTryoutSubs(c *fiber.Ctx) error {
	var items []models.TryoutSubCategory
	q := h.DB.Preload("Category").Order(`"createdAt" DESC`)
	if cat := c.Query("categoryId"); cat != "" {
		q = q.Where(`"categoryId" = ?`, cat)
	}
	q.Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) CreateTryoutSub(c *fiber.Ctx) error {
	name, slug, catID := c.FormValue("name"), c.FormValue("slug"), c.FormValue("categoryId")
	if name == "" {
		var body models.TryoutSubCategory
		_ = c.BodyParser(&body)
		name, slug, catID = body.Name, body.Slug, body.CategoryID
	}
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	now := time.Now()
	item := models.TryoutSubCategory{ID: id.New(), Name: name, Slug: slug, CategoryID: catID, ImageURL: ptr(img), CreatedAt: now, UpdatedAt: now}
	h.DB.Create(&item)
	h.DB.Preload("Category").First(&item, "id = ?", item.ID)
	return httpx.Created(c, item)
}
func (h *Handler) UpdateTryoutSub(c *fiber.Ctx) error {
	var item models.TryoutSubCategory
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	for _, k := range []string{"name", "slug", "categoryId"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	if img != "" {
		updates["imageUrl"] = img
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.Preload("Category").First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteTryoutSub(c *fiber.Ctx) error {
	h.DB.Delete(&models.TryoutSubCategory{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListTryouts(c *fiber.Ctx) error {
	var items []models.Tryout
	h.DB.Preload("SubCategory.Category").Preload("Questions.Options").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) parseQuestionsCSV(c *fiber.Ctx, label string) ([]examcsv.Question, error) {
	saved, err := upload.Save(c, "questionsCsv", os.TempDir(), "tmp", 20<<20, upload.CSV)
	if err != nil {
		return nil, err
	}
	if saved == nil {
		return nil, nil
	}
	defer os.Remove(saved.Path)
	qs, err := examcsv.ParseFile(saved.Path, label)
	if err != nil {
		return nil, httpx.New(400, "CSV soal tidak valid: "+err.Error())
	}
	if len(qs) == 0 {
		return nil, httpx.New(400, "CSV soal kosong atau tidak valid.")
	}
	return qs, nil
}

func (h *Handler) CreateTryout(c *fiber.Ctx) error {
	qs, err := h.parseQuestionsCSV(c, "tryout")
	if err != nil {
		return err
	}
	if qs == nil {
		return httpx.New(400, "File CSV soal wajib diunggah.")
	}
	name := c.FormValue("name")
	slug := c.FormValue("slug")
	subID := c.FormValue("subCategoryId")
	if name == "" || slug == "" || subID == "" {
		return httpx.New(400, "Nama, slug, dan sub kategori wajib")
	}
	var sub models.TryoutSubCategory
	if err := h.DB.Preload("Category").First(&sub, "id = ?", subID).Error; err != nil {
		return httpx.New(404, "Sub kategori tryout tidak ditemukan")
	}
	cover, err := h.saveImage(c, "coverImage", "exams")
	if err != nil {
		return err
	}
	summary := strings.TrimSpace(c.FormValue("summary"))
	if len(summary) < 3 {
		summary = name
	}
	desc := strings.TrimSpace(c.FormValue("description"))
	if len(desc) < 10 {
		desc = name + " - Bank Soal Tryout dengan " + itoa(len(qs)) + " soal"
	}
	var sessionOrder *int
	if isPolriPsiko(sub) {
		if c.FormValue("sessionOrder") == "" {
			return httpx.New(400, "Urutan sesi wajib dipilih untuk kategori POLRI / sub kategori PSIKO.")
		}
		n := formInt(c, "sessionOrder", 0)
		sessionOrder = &n
	} else if c.FormValue("sessionOrder") != "" {
		return httpx.New(400, "Urutan sesi hanya berlaku untuk kategori POLRI / sub kategori PSIKO.")
	}
	now := time.Now()
	item := models.Tryout{
		ID: id.New(), Name: name, Slug: slug, Summary: summary, Description: desc,
		CoverImageURL: ptr(cover), DurationMinutes: formInt(c, "durationMinutes", 60),
		TotalQuestions: len(qs), IsPublished: formBool(c, "isPublished", true),
		IsFree: formBool(c, "isFree", false), SessionOrder: sessionOrder,
		OpenAt: formTime(c, "openAt"), CloseAt: formTime(c, "closeAt"),
		SubCategoryID: subID, CreatedAt: now, UpdatedAt: now,
	}
	if n := formInt(c, "totalQuestions", 0); n > 0 {
		item.TotalQuestions = n
	}
	if err := h.DB.Create(&item).Error; err != nil {
		if strings.Contains(err.Error(), "sessionOrder") || strings.Contains(err.Error(), "subCategoryId") {
			return httpx.New(400, "Urutan sesi sudah digunakan. Pilih urutan sesi lain.")
		}
		return err
	}
	h.replaceTryoutQuestions(item.ID, qs)
	h.DB.Preload("SubCategory.Category").Preload("Questions.Options").First(&item, "id = ?", item.ID)
	return httpx.Created(c, item)
}

func (h *Handler) UpdateTryout(c *fiber.Ctx) error {
	var item models.Tryout
	if err := h.DB.Preload("SubCategory.Category").First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	for _, k := range []string{"name", "summary", "description", "slug"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	if v := c.FormValue("durationMinutes"); v != "" {
		updates["durationMinutes"] = formInt(c, "durationMinutes", item.DurationMinutes)
	}
	if v := c.FormValue("isPublished"); v != "" {
		updates["isPublished"] = formBool(c, "isPublished", item.IsPublished)
	}
	if v := c.FormValue("isFree"); v != "" {
		updates["isFree"] = formBool(c, "isFree", item.IsFree)
	}
	cover, err := h.saveImage(c, "coverImage", "exams")
	if err != nil {
		return err
	}
	if cover != "" {
		updates["coverImageUrl"] = cover
	}
	if t := formTime(c, "openAt"); t != nil {
		updates["openAt"] = t
	}
	if t := formTime(c, "closeAt"); t != nil {
		updates["closeAt"] = t
	}
	qs, err := h.parseQuestionsCSV(c, "tryout")
	if err != nil {
		return err
	}
	h.DB.Model(&item).Updates(updates)
	if qs != nil {
		h.replaceTryoutQuestions(item.ID, qs)
		h.DB.Model(&item).Updates(map[string]any{"totalQuestions": len(qs), "updatedAt": time.Now()})
	}
	h.DB.Preload("SubCategory.Category").Preload("Questions.Options").First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}

func (h *Handler) replaceTryoutQuestions(tryoutID string, qs []examcsv.Question) {
	var old []models.TryoutQuestion
	h.DB.Where(`"tryoutId" = ?`, tryoutID).Find(&old)
	for _, q := range old {
		h.DB.Where(`"questionId" = ?`, q.ID).Delete(&models.TryoutOption{})
	}
	h.DB.Where(`"tryoutId" = ?`, tryoutID).Delete(&models.TryoutQuestion{})
	now := time.Now()
	for i, q := range qs {
		order := q.Order
		if order == 0 {
			order = i + 1
		}
		row := models.TryoutQuestion{
			ID: id.New(), Prompt: q.Prompt, ImageURL: q.ImageURL, Explanation: q.Explanation,
			ExplanationImageURL: q.ExplanationImageURL, Order: order, MultipleCorrect: multipleCorrect(q.Options),
			TryoutID: tryoutID, CreatedAt: now,
		}
		h.DB.Create(&row)
		for _, o := range q.Options {
			h.DB.Create(&models.TryoutOption{
				ID: id.New(), Label: o.Label, ImageURL: o.ImageURL, IsCorrect: o.IsCorrect,
				QuestionID: row.ID, CreatedAt: now,
			})
		}
	}
}

func (h *Handler) PatchTryoutFree(c *fiber.Ctx) error {
	var body struct {
		IsFree            bool     `json:"isFree"`
		FreeForNewMembers bool     `json:"freeForNewMembers"`
		FreePackageIDs    []string `json:"freePackageIds"`
	}
	_ = c.BodyParser(&body)
	var item models.Tryout
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	h.DB.Model(&item).Updates(map[string]any{
		"isFree": body.IsFree, "freeForNewMembers": body.FreeForNewMembers,
		"freePackageIds": jsonutil.MustJSON(body.FreePackageIDs), "updatedAt": time.Now(),
	})
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeleteTryout(c *fiber.Ctx) error {
	idStr := c.Params("id")
	var qs []models.TryoutQuestion
	h.DB.Where(`"tryoutId" = ?`, idStr).Find(&qs)
	for _, q := range qs {
		h.DB.Where(`"questionId" = ?`, q.ID).Delete(&models.TryoutOption{})
	}
	h.DB.Where(`"tryoutId" = ?`, idStr).Delete(&models.TryoutQuestion{})
	h.DB.Delete(&models.Tryout{}, "id = ?", idStr)
	return noContent(c)
}

func (h *Handler) ExportTryouts(c *fiber.Ctx) error {
	var tryouts []models.Tryout
	h.DB.Preload("SubCategory.Category").Order(`"createdAt" DESC`).Find(&tryouts)
	rows := []map[string]any{}
	for _, t := range tryouts {
		rows = append(rows, map[string]any{
			"categoryId": t.SubCategory.CategoryID, "categoryName": t.SubCategory.Category.Name,
			"subCategoryId": t.SubCategoryID, "subCategoryName": t.SubCategory.Name,
			"tryoutId": t.ID, "tryoutName": t.Name, "tryoutSlug": t.Slug, "summary": t.Summary,
			"durationMinutes": t.DurationMinutes, "totalQuestions": t.TotalQuestions,
			"isPublished": t.IsPublished, "isFree": t.IsFree,
		})
	}
	return csvAttachment(c, "manajemen-tryout-tes.csv", examcsv.ToRows(
		[]string{"categoryId", "categoryName", "subCategoryId", "subCategoryName", "tryoutId", "tryoutName", "tryoutSlug", "summary", "durationMinutes", "totalQuestions", "isPublished", "isFree"},
		rows,
	))
}

func (h *Handler) ExportTryoutQuestions(c *fiber.Ctx) error {
	q := h.DB.Preload("SubCategory.Category").Preload("Questions.Options").Order(`"createdAt" DESC`)
	if tid := c.Query("tryoutId"); tid != "" {
		q = q.Where("id = ?", tid)
	}
	var tryouts []models.Tryout
	q.Find(&tryouts)
	if c.Query("tryoutId") != "" && len(tryouts) == 0 {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	headers := append([]string{"exam_type", "category", "sub_category", "sub_sub_category", "item_id", "item_name", "item_slug", "prompt", "prompt_image", "explanation", "explanationImageUrl", "order"},
		[]string{"option_a", "option_a_image", "option_a_correct", "option_b", "option_b_image", "option_b_correct", "option_c", "option_c_image", "option_c_correct", "option_d", "option_d_image", "option_d_correct", "option_e", "option_e_image", "option_e_correct"}...)
	rows := []map[string]any{}
	for _, t := range tryouts {
		for _, qn := range t.Questions {
			row := map[string]any{
				"exam_type": "TRYOUT", "category": t.SubCategory.Category.Name, "sub_category": t.SubCategory.Name,
				"sub_sub_category": "", "item_id": t.ID, "item_name": t.Name, "item_slug": t.Slug,
				"prompt": qn.Prompt, "order": qn.Order,
			}
			if qn.ImageURL != nil {
				row["prompt_image"] = *qn.ImageURL
			}
			if qn.Explanation != nil {
				row["explanation"] = *qn.Explanation
			}
			if qn.ExplanationImageURL != nil {
				row["explanationImageUrl"] = *qn.ExplanationImageURL
			}
			for k, v := range optionCSVFields(qn.Options) {
				row[k] = v
			}
			rows = append(rows, row)
		}
	}
	name := "soal-tryout-semua.csv"
	if len(tryouts) == 1 && c.Query("tryoutId") != "" {
		name = "soal-tryout-" + tryouts[0].Slug + ".csv"
	}
	return csvAttachment(c, name, examcsv.ToRows(headers, rows))
}

func (h *Handler) ListPracticeCats(c *fiber.Ctx) error {
	var items []models.PracticeCategory
	h.DB.Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) CreatePracticeCat(c *fiber.Ctx) error {
	name, slug := c.FormValue("name"), c.FormValue("slug")
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	now := time.Now()
	item := models.PracticeCategory{ID: id.New(), Name: name, Slug: slug, ImageURL: ptr(img), CreatedAt: now, UpdatedAt: now}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdatePracticeCat(c *fiber.Ctx) error {
	var item models.PracticeCategory
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	if v := c.FormValue("name"); v != "" {
		updates["name"] = v
	}
	if v := c.FormValue("slug"); v != "" {
		updates["slug"] = v
	}
	img, _ := h.saveImage(c, "image", "exams")
	if img != "" {
		updates["imageUrl"] = img
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeletePracticeCat(c *fiber.Ctx) error {
	h.DB.Delete(&models.PracticeCategory{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListPracticeSubs(c *fiber.Ctx) error {
	var items []models.PracticeSubCategory
	h.DB.Preload("Category").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) CreatePracticeSub(c *fiber.Ctx) error {
	now := time.Now()
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	item := models.PracticeSubCategory{
		ID: id.New(), Name: c.FormValue("name"), Slug: c.FormValue("slug"),
		CategoryID: c.FormValue("categoryId"), ImageURL: ptr(img), CreatedAt: now, UpdatedAt: now,
	}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdatePracticeSub(c *fiber.Ctx) error {
	var item models.PracticeSubCategory
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	for _, k := range []string{"name", "slug", "categoryId"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	img, _ := h.saveImage(c, "image", "exams")
	if img != "" {
		updates["imageUrl"] = img
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeletePracticeSub(c *fiber.Ctx) error {
	h.DB.Delete(&models.PracticeSubCategory{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListPracticeSubSubs(c *fiber.Ctx) error {
	var items []models.PracticeSubSubCategory
	h.DB.Preload("SubCategory.Category").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}
func (h *Handler) CreatePracticeSubSub(c *fiber.Ctx) error {
	now := time.Now()
	img, err := h.saveImage(c, "image", "exams")
	if err != nil {
		return err
	}
	item := models.PracticeSubSubCategory{
		ID: id.New(), Name: c.FormValue("name"), Slug: c.FormValue("slug"),
		SubCategoryID: c.FormValue("subCategoryId"), ImageURL: ptr(img), CreatedAt: now, UpdatedAt: now,
	}
	h.DB.Create(&item)
	return httpx.Created(c, item)
}
func (h *Handler) UpdatePracticeSubSub(c *fiber.Ctx) error {
	var item models.PracticeSubSubCategory
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	for _, k := range []string{"name", "slug", "subCategoryId"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	img, _ := h.saveImage(c, "image", "exams")
	if img != "" {
		updates["imageUrl"] = img
	}
	h.DB.Model(&item).Updates(updates)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeletePracticeSubSub(c *fiber.Ctx) error {
	h.DB.Delete(&models.PracticeSubSubCategory{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListPracticeSets(c *fiber.Ctx) error {
	var items []models.PracticeSet
	h.DB.Preload("SubSubCategory.SubCategory.Category").Preload("Questions.Options").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) CreatePracticeSet(c *fiber.Ctx) error {
	qs, err := h.parseQuestionsCSV(c, "latihan")
	if err != nil {
		return err
	}
	if qs == nil {
		return httpx.New(400, "File CSV soal wajib diunggah.")
	}
	title, slug, subID := c.FormValue("title"), c.FormValue("slug"), c.FormValue("subSubCategoryId")
	if title == "" || slug == "" || subID == "" {
		return httpx.New(400, "Judul, slug, dan sub-sub kategori wajib")
	}
	cover, err := h.saveImage(c, "coverImage", "exams")
	if err != nil {
		return err
	}
	desc := strings.TrimSpace(c.FormValue("description"))
	if len(desc) < 10 {
		desc = title + " - Latihan dengan " + itoa(len(qs)) + " soal"
	}
	now := time.Now()
	item := models.PracticeSet{
		ID: id.New(), Title: title, Slug: slug, Description: desc, CoverImageURL: ptr(cover),
		Level: ptr(c.FormValue("level")), DurationMinutes: formInt(c, "durationMinutes", 30),
		TotalQuestions: len(qs), IsFree: formBool(c, "isFree", false),
		OpenAt: formTime(c, "openAt"), CloseAt: formTime(c, "closeAt"),
		SubSubCategoryID: subID, CreatedAt: now, UpdatedAt: now,
	}
	h.DB.Create(&item)
	h.replacePracticeQuestions(item.ID, qs)
	h.DB.Preload("SubSubCategory.SubCategory.Category").Preload("Questions.Options").First(&item, "id = ?", item.ID)
	return httpx.Created(c, item)
}

func (h *Handler) UpdatePracticeSet(c *fiber.Ctx) error {
	var item models.PracticeSet
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Set latihan tidak ditemukan")
	}
	updates := map[string]any{"updatedAt": time.Now()}
	for _, k := range []string{"title", "slug", "description", "level"} {
		if v := c.FormValue(k); v != "" {
			updates[k] = v
		}
	}
	if v := c.FormValue("durationMinutes"); v != "" {
		updates["durationMinutes"] = formInt(c, "durationMinutes", item.DurationMinutes)
	}
	if v := c.FormValue("isFree"); v != "" {
		updates["isFree"] = formBool(c, "isFree", item.IsFree)
	}
	cover, err := h.saveImage(c, "coverImage", "exams")
	if err != nil {
		return err
	}
	if cover != "" {
		updates["coverImageUrl"] = cover
	}
	qs, err := h.parseQuestionsCSV(c, "latihan")
	if err != nil {
		return err
	}
	h.DB.Model(&item).Updates(updates)
	if qs != nil {
		h.replacePracticeQuestions(item.ID, qs)
		h.DB.Model(&item).Updates(map[string]any{"totalQuestions": len(qs)})
	}
	h.DB.Preload("SubSubCategory.SubCategory.Category").Preload("Questions.Options").First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}

func (h *Handler) replacePracticeQuestions(setID string, qs []examcsv.Question) {
	var old []models.PracticeQuestion
	h.DB.Where(`"setId" = ?`, setID).Find(&old)
	for _, q := range old {
		h.DB.Where(`"questionId" = ?`, q.ID).Delete(&models.PracticeOption{})
	}
	h.DB.Where(`"setId" = ?`, setID).Delete(&models.PracticeQuestion{})
	now := time.Now()
	for i, q := range qs {
		order := q.Order
		if order == 0 {
			order = i + 1
		}
		row := models.PracticeQuestion{
			ID: id.New(), Prompt: q.Prompt, ImageURL: q.ImageURL, Explanation: q.Explanation,
			ExplanationImageURL: q.ExplanationImageURL, Order: order, MultipleCorrect: multipleCorrect(q.Options),
			SetID: setID, CreatedAt: now,
		}
		h.DB.Create(&row)
		for _, o := range q.Options {
			h.DB.Create(&models.PracticeOption{
				ID: id.New(), Label: o.Label, ImageURL: o.ImageURL, IsCorrect: o.IsCorrect,
				QuestionID: row.ID, CreatedAt: now,
			})
		}
	}
}

func (h *Handler) PatchPracticeFree(c *fiber.Ctx) error {
	var body struct {
		IsFree            bool     `json:"isFree"`
		FreeForNewMembers bool     `json:"freeForNewMembers"`
		FreePackageIDs    []string `json:"freePackageIds"`
	}
	_ = c.BodyParser(&body)
	var item models.PracticeSet
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Set latihan tidak ditemukan")
	}
	h.DB.Model(&item).Updates(map[string]any{
		"isFree": body.IsFree, "freeForNewMembers": body.FreeForNewMembers,
		"freePackageIds": jsonutil.MustJSON(body.FreePackageIDs), "updatedAt": time.Now(),
	})
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
func (h *Handler) DeletePracticeSet(c *fiber.Ctx) error {
	idStr := c.Params("id")
	var qs []models.PracticeQuestion
	h.DB.Where(`"setId" = ?`, idStr).Find(&qs)
	for _, q := range qs {
		h.DB.Where(`"questionId" = ?`, q.ID).Delete(&models.PracticeOption{})
	}
	h.DB.Where(`"setId" = ?`, idStr).Delete(&models.PracticeQuestion{})
	h.DB.Delete(&models.PracticeSet{}, "id = ?", idStr)
	return noContent(c)
}

func (h *Handler) ExportPractice(c *fiber.Ctx) error {
	var sets []models.PracticeSet
	h.DB.Preload("SubSubCategory.SubCategory.Category").Order(`"createdAt" DESC`).Find(&sets)
	rows := []map[string]any{}
	for _, s := range sets {
		rows = append(rows, map[string]any{
			"setId": s.ID, "title": s.Title, "slug": s.Slug, "durationMinutes": s.DurationMinutes,
			"totalQuestions": s.TotalQuestions, "isFree": s.IsFree,
			"subSubCategory": s.SubSubCategory.Name,
		})
	}
	return csvAttachment(c, "manajemen-latihan.csv", examcsv.ToRows([]string{"setId", "title", "slug", "durationMinutes", "totalQuestions", "isFree", "subSubCategory"}, rows))
}

func (h *Handler) ExportPracticeQuestions(c *fiber.Ctx) error {
	q := h.DB.Preload("SubSubCategory.SubCategory.Category").Preload("Questions.Options").Order(`"createdAt" DESC`)
	if sid := c.Query("setId"); sid != "" {
		q = q.Where("id = ?", sid)
	}
	var sets []models.PracticeSet
	q.Find(&sets)
	headers := append([]string{"exam_type", "category", "sub_category", "sub_sub_category", "item_id", "item_name", "item_slug", "prompt", "prompt_image", "explanation", "explanationImageUrl", "order"},
		[]string{"option_a", "option_a_image", "option_a_correct", "option_b", "option_b_image", "option_b_correct", "option_c", "option_c_image", "option_c_correct", "option_d", "option_d_image", "option_d_correct", "option_e", "option_e_image", "option_e_correct"}...)
	rows := []map[string]any{}
	for _, s := range sets {
		for _, qn := range s.Questions {
			row := map[string]any{
				"exam_type": "PRACTICE", "category": s.SubSubCategory.SubCategory.Category.Name,
				"sub_category": s.SubSubCategory.SubCategory.Name, "sub_sub_category": s.SubSubCategory.Name,
				"item_id": s.ID, "item_name": s.Title, "item_slug": s.Slug, "prompt": qn.Prompt, "order": qn.Order,
			}
			if qn.ImageURL != nil {
				row["prompt_image"] = *qn.ImageURL
			}
			if qn.Explanation != nil {
				row["explanation"] = *qn.Explanation
			}
			if qn.ExplanationImageURL != nil {
				row["explanationImageUrl"] = *qn.ExplanationImageURL
			}
			for k, v := range optionCSVFieldsPractice(qn.Options) {
				row[k] = v
			}
			rows = append(rows, row)
		}
	}
	return csvAttachment(c, "soal-latihan-semua.csv", examcsv.ToRows(headers, rows))
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}
