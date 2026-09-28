package exams

import (
	"encoding/json"
	"math/rand"
	"strings"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func shuffle[T any](in []T) []T {
	out := append([]T(nil), in...)
	rand.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	return out
}

func grade(selected, correct []string) (credit float64, ok bool) {
	if len(correct) == 0 || len(selected) != len(correct) {
		return 0, false
	}
	set := map[string]struct{}{}
	for _, s := range selected {
		set[s] = struct{}{}
	}
	for _, c := range correct {
		if _, hit := set[c]; !hit {
			return 0, false
		}
	}
	return 1, true
}

func selectedIDs(optionID string, optionIDs []string) []string {
	if len(optionIDs) > 0 {
		seen := map[string]struct{}{}
		out := []string{}
		for _, id := range optionIDs {
			if id == "" {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			out = append(out, id)
		}
		return out
	}
	if optionID != "" {
		return []string{optionID}
	}
	return nil
}

func kw(name, slug, key string) bool {
	k := strings.ToLower(strings.TrimSpace(key))
	return strings.ToLower(strings.TrimSpace(name)) == k || strings.ToLower(strings.TrimSpace(slug)) == k
}

func isPsiko(t models.Tryout) bool {
	return t.SessionOrder != nil && kw(t.SubCategory.Category.Name, t.SubCategory.Category.Slug, "polri") && kw(t.SubCategory.Name, t.SubCategory.Slug, "psiko")
}

func (h *Handler) ensureAccess(userID string, isFree, freeForNew bool, freeIDs []byte) (*models.Transaction, error) {
	if membership.IsPremium(h.DB, userID) {
		return membership.AssertActive(h.DB, userID)
	}
	trx, err := membership.GetActive(h.DB, userID)
	freePkgs := jsonutil.Strings(freeIDs)
	if err != nil || trx == nil {
		if !isFree || !freeForNew {
			return nil, httpx.New(403, "Membership tidak aktif atau belum divalidasi admin.", map[string]any{"code": "MEMBERSHIP_REQUIRED"})
		}
		return nil, nil
	}
	if isFree && (freeForNew || jsonutil.Contains(freePkgs, trx.PackageID)) {
		return trx, nil
	}
	if err := membership.AssertFeature(trx, "TRYOUT", false); err != nil {
		return nil, err
	}
	return trx, nil
}

func (h *Handler) ListTryouts(c *fiber.Ctx) error {
	var items []models.Tryout
	h.DB.Where(`"isPublished" = true`).Preload("SubCategory").Preload("SubCategory.Category").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) TryoutInfo(c *fiber.Ctx) error {
	var t models.Tryout
	if err := h.DB.Where("slug = ? AND \"isPublished\" = true", c.Params("slug")).Preload("SubCategory").Preload("SubCategory.Category").First(&t).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	return httpx.Success(c, t)
}

func (h *Handler) TryoutDetail(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var t models.Tryout
	if err := h.DB.Where("slug = ? AND \"isPublished\" = true", c.Params("slug")).
		Preload("SubCategory").Preload("SubCategory.Category").
		Preload("Questions", func(db *gorm.DB) *gorm.DB { return db.Order(`"order" ASC`) }).
		Preload("Questions.Options").First(&t).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	if _, err := h.ensureAccess(uid, t.IsFree, t.FreeForNewMembers, t.FreePackageIDs); err != nil {
		return err
	}
	qs := shuffle(t.Questions)
	qOut := []fiber.Map{}
	for _, q := range qs {
		opts := []fiber.Map{}
		for _, o := range shuffle(q.Options) {
			opts = append(opts, fiber.Map{"id": o.ID, "label": o.Label, "imageUrl": o.ImageURL})
		}
		qOut = append(qOut, fiber.Map{
			"id": q.ID, "prompt": q.Prompt, "imageUrl": q.ImageURL, "order": q.Order,
			"multipleCorrect": q.MultipleCorrect, "options": opts,
		})
	}
	return httpx.Success(c, fiber.Map{
		"id": t.ID, "name": t.Name, "slug": t.Slug, "summary": t.Summary, "description": t.Description,
		"coverImageUrl": t.CoverImageURL, "durationMinutes": t.DurationMinutes, "totalQuestions": t.TotalQuestions,
		"isPublished": t.IsPublished, "isFree": t.IsFree, "sessionOrder": t.SessionOrder,
		"openAt": t.OpenAt, "closeAt": t.CloseAt, "subCategory": t.SubCategory, "questions": qOut,
	})
}

func (h *Handler) StartTryout(c *fiber.Ctx) error {
	return h.startTryout(c, false)
}

func (h *Handler) StartExamTryout(c *fiber.Ctx) error {
	return h.startTryout(c, true)
}

func (h *Handler) startTryout(c *fiber.Ctx, ujian bool) error {
	uid := middleware.Current(c).ID
	var t models.Tryout
	if err := h.DB.Where("slug = ? AND \"isPublished\" = true", c.Params("slug")).
		Preload("SubCategory").Preload("SubCategory.Category").First(&t).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	if err := h.EnsureBlock(uid, "TRYOUT", ujian); err != nil {
		return err
	}
	target := t
	if !ujian && isPsiko(t) {
		if next := h.psikoTarget(uid, t); next != nil {
			target = *next
		}
	}
	if ujian {
		if err := h.assertExamControl(uid, "TRYOUT"); err != nil {
			return err
		}
	} else {
		mem, err := h.ensureAccess(uid, target.IsFree, target.FreeForNewMembers, target.FreePackageIDs)
		if err != nil {
			return err
		}
		var recent models.TryoutResult
		threshold := time.Now().Add(-2 * time.Minute)
		if err := h.DB.Where(`"userId" = ? AND "tryoutId" = ? AND "completedAt" IS NULL AND "startedAt" >= ?`, uid, target.ID, threshold).
			Order(`"startedAt" DESC`).First(&recent).Error; err == nil {
			return httpx.Success(c, fiber.Map{"resultId": recent.ID, "durationMinutes": target.DurationMinutes, "startedSlug": target.Slug, "sessionOrder": target.SessionOrder})
		}
		now := time.Now()
		if target.OpenAt != nil && now.Before(*target.OpenAt) {
			return httpx.New(403, "Tryout belum dibuka sesuai jadwal.")
		}
		if target.CloseAt != nil && now.After(*target.CloseAt) {
			return httpx.New(403, "Tryout telah ditutup.")
		}
		if mem != nil {
			if _, err := membership.ConsumeTryout(h.DB, uid); err != nil {
				return err
			}
		}
	}
	now := time.Now()
	if ujian {
		if target.OpenAt != nil && now.Before(*target.OpenAt) {
			return httpx.New(403, "Tryout belum dibuka sesuai jadwal.")
		}
		if target.CloseAt != nil && now.After(*target.CloseAt) {
			return httpx.New(403, "Tryout telah ditutup.")
		}
	}
	res := models.TryoutResult{ID: id.New(), UserID: uid, TryoutID: target.ID, StartedAt: now, CreatedAt: now}
	h.DB.Create(&res)
	out := fiber.Map{"resultId": res.ID, "durationMinutes": target.DurationMinutes}
	if !ujian {
		out["startedSlug"] = target.Slug
		out["sessionOrder"] = target.SessionOrder
	}
	return httpx.Success(c, out)
}

func (h *Handler) psikoTarget(userID string, t models.Tryout) *models.Tryout {
	var seq []models.Tryout
	h.DB.Where(`"subCategoryId" = ? AND "isPublished" = true AND "sessionOrder" IS NOT NULL`, t.SubCategoryID).
		Order(`"sessionOrder" ASC, "createdAt" ASC`).Find(&seq)
	if len(seq) == 0 {
		return &t
	}
	var latest models.TryoutResult
	err := h.DB.Joins(`JOIN "Tryout" ON "Tryout".id = "TryoutResult"."tryoutId"`).
		Where(`"TryoutResult"."userId" = ? AND "TryoutResult"."completedAt" IS NOT NULL AND "Tryout"."subCategoryId" = ? AND "Tryout"."sessionOrder" IS NOT NULL`, userID, t.SubCategoryID).
		Order(`"TryoutResult"."completedAt" DESC`).First(&latest).Error
	if err != nil {
		return &seq[0]
	}
	idx := -1
	for i, item := range seq {
		if item.ID == latest.TryoutID {
			idx = i
			break
		}
	}
	if idx == -1 || idx+1 >= len(seq) {
		return &seq[0]
	}
	return &seq[idx+1]
}

func (h *Handler) SubmitTryout(c *fiber.Ctx) error {
	return h.submitTryout(c, false)
}

func (h *Handler) SubmitExamTryout(c *fiber.Ctx) error {
	return h.submitTryout(c, true)
}

func (h *Handler) submitTryout(c *fiber.Ctx, ujian bool) error {
	uid := middleware.Current(c).ID
	var t models.Tryout
	if err := h.DB.Where("slug = ? AND \"isPublished\" = true", c.Params("slug")).
		Preload("SubCategory").Preload("SubCategory.Category").
		Preload("Questions").Preload("Questions.Options").First(&t).Error; err != nil {
		return httpx.New(404, "Tryout tidak ditemukan")
	}
	if !ujian {
		if _, err := h.ensureAccess(uid, t.IsFree, t.FreeForNewMembers, t.FreePackageIDs); err != nil {
			return err
		}
	}
	var body struct {
		ResultID string `json:"resultId"`
		Answers  []struct {
			QuestionID string   `json:"questionId"`
			OptionID   string   `json:"optionId"`
			OptionIDs  []string `json:"optionIds"`
		} `json:"answers"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var result models.TryoutResult
	if err := h.DB.First(&result, "id = ? AND \"userId\" = ?", body.ResultID, uid).Error; err != nil {
		return httpx.New(404, "Result not found")
	}
	qMap := map[string]models.TryoutQuestion{}
	for _, q := range t.Questions {
		qMap[q.ID] = q
	}
	earned := 0.0
	correct := 0
	h.DB.Where(`"resultId" = ?`, result.ID).Delete(&models.TryoutAnswer{})
	for _, a := range body.Answers {
		q := qMap[a.QuestionID]
		var correctIDs []string
		for _, o := range q.Options {
			if o.IsCorrect {
				correctIDs = append(correctIDs, o.ID)
			}
		}
		sel := selectedIDs(a.OptionID, a.OptionIDs)
		cr, ok := grade(sel, correctIDs)
		earned += cr
		if ok {
			correct++
		}
		var opt *string
		if len(sel) > 0 {
			opt = &sel[0]
		}
		ans := models.TryoutAnswer{
			ID: id.New(), ResultID: result.ID, QuestionID: a.QuestionID, OptionID: opt,
			UserID: uid, IsCorrect: ok, CreatedAt: time.Now(),
		}
		if len(sel) > 0 {
			ans.SelectedOptionIDs = jsonutil.MustJSON(sel)
		}
		h.DB.Create(&ans)
	}
	total := len(t.Questions)
	if total == 0 {
		total = 1
	}
	score := (earned / float64(total)) * 100
	dur := t.DurationMinutes * 60
	now := time.Now()
	h.DB.Model(&result).Updates(map[string]any{"completedAt": now, "score": score, "durationSeconds": dur})
	out := fiber.Map{"resultId": result.ID, "score": score, "correct": correct, "earnedCredit": earned, "total": total}
	if !ujian && isPsiko(t) {
		var seq []models.Tryout
		h.DB.Where(`"subCategoryId" = ? AND "isPublished" = true AND "sessionOrder" IS NOT NULL`, t.SubCategoryID).
			Order(`"sessionOrder" ASC`).Find(&seq)
		idx := -1
		for i, item := range seq {
			if item.ID == t.ID {
				idx = i
				break
			}
		}
		if idx >= 0 && idx+1 < len(seq) {
			next := seq[idx+1]
			breakSec := 5
			var s models.SiteSetting
			if err := h.DB.Where("key = ?", "psiko_tryout_break_seconds").First(&s).Error; err == nil {
				if n := atoi(s.Value); n >= 0 {
					breakSec = n
				}
			}
			out["nextSession"] = fiber.Map{"slug": next.Slug, "name": next.Name, "sessionOrder": next.SessionOrder, "breakSeconds": breakSec}
		} else {
			mode := "NUMBER"
			var s models.SiteSetting
			if err := h.DB.Where("key = ?", "psiko_tryout_cermat_mode").First(&s).Error; err == nil && s.Value != "" {
				mode = s.Value
			}
			out["nextCermatMode"] = mode
		}
	}
	return httpx.Success(c, out)
}

func (h *Handler) TryoutHistory(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var items []models.TryoutResult
	h.DB.Preload("Tryout").Preload("Tryout.SubCategory").Preload("Tryout.SubCategory.Category").
		Where(`"userId" = ?`, uid).Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) TryoutReview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var result models.TryoutResult
	if err := h.DB.Preload("Tryout").Preload("Tryout.Questions").Preload("Tryout.Questions.Options").
		Preload("Answers").Where("id = ? AND \"userId\" = ?", c.Params("resultId"), uid).First(&result).Error; err != nil {
		return httpx.New(404, "Result not found")
	}
	return httpx.Success(c, result)
}

func (h *Handler) PackageReview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var result models.TryoutResult
	if err := h.DB.Preload("Tryout").Preload("Tryout.SubCategory").Preload("Tryout.SubCategory.Category").
		Where("id = ? AND \"userId\" = ?", c.Params("resultId"), uid).First(&result).Error; err != nil {
		return httpx.New(404, "Result not found")
	}
	var results []models.TryoutResult
	h.DB.Preload("Tryout").Where(`"userId" = ? AND "completedAt" IS NOT NULL`, uid).
		Joins(`JOIN "Tryout" ON "Tryout".id = "TryoutResult"."tryoutId"`).
		Where(`"Tryout"."subCategoryId" = ? AND "Tryout"."sessionOrder" IS NOT NULL`, result.Tryout.SubCategoryID).
		Find(&results)
	sum := 0.0
	n := 0
	sessions := []fiber.Map{}
	for _, r := range results {
		if r.Score != nil {
			sum += *r.Score
			n++
		}
		sessions = append(sessions, fiber.Map{"resultId": r.ID, "score": r.Score, "tryout": r.Tryout})
	}
	avg := 0.0
	if n > 0 {
		avg = sum / float64(n)
	}
	return httpx.Success(c, fiber.Map{"average": avg, "sessions": sessions})
}

func atoi(s string) int {
	n := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			break
		}
		n = n*10 + int(r-'0')
	}
	return n
}

var _ = json.Marshal
