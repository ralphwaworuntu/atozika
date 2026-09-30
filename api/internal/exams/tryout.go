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

func answerSelectedIDs(a models.TryoutAnswer) []string {
	ids := jsonutil.Strings(a.SelectedOptionIDs)
	if len(ids) > 0 {
		return ids
	}
	if a.OptionID != nil && *a.OptionID != "" {
		return []string{*a.OptionID}
	}
	return nil
}

func questionHasMultipleCorrect(options []models.TryoutOption) bool {
	n := 0
	for _, o := range options {
		if o.IsCorrect {
			n++
			if n > 1 {
				return true
			}
		}
	}
	return false
}

func buildTryoutReviewQuestions(questions []models.TryoutQuestion, answers []models.TryoutAnswer) []fiber.Map {
	answerMap := map[string]models.TryoutAnswer{}
	for _, a := range answers {
		answerMap[a.QuestionID] = a
	}
	out := make([]fiber.Map, 0, len(questions))
	for _, q := range questions {
		var correctIDs []string
		for _, o := range q.Options {
			if o.IsCorrect {
				correctIDs = append(correctIDs, o.ID)
			}
		}
		ans, hasAns := answerMap[q.ID]
		sel := []string{}
		if hasAns {
			sel = answerSelectedIDs(ans)
		}
		credit, ok := grade(sel, correctIDs)
		status := "incorrect"
		if ok {
			status = "correct"
		}
		var userOptionID any
		if len(sel) > 0 {
			userOptionID = sel[0]
		} else {
			userOptionID = nil
		}
		opts := make([]fiber.Map, 0, len(q.Options))
		for _, o := range q.Options {
			opts = append(opts, fiber.Map{
				"id": o.ID, "label": o.Label, "imageUrl": o.ImageURL, "isCorrect": o.IsCorrect,
			})
		}
		out = append(out, fiber.Map{
			"id": q.ID, "order": q.Order, "prompt": q.Prompt, "imageUrl": q.ImageURL,
			"explanation": q.Explanation, "explanationImageUrl": q.ExplanationImageURL,
			"multipleCorrect": q.MultipleCorrect || questionHasMultipleCorrect(q.Options),
			"options": opts, "userOptionId": userOptionID, "userOptionIds": sel,
			"isCorrect": ok, "credit": credit, "gradeStatus": status,
		})
	}
	return out
}

func (h *Handler) loadTryoutResultForReview(resultID, userID string) (*models.TryoutResult, error) {
	var result models.TryoutResult
	err := h.DB.
		Preload("Tryout").
		Preload("Tryout.SubCategory").
		Preload("Tryout.SubCategory.Category").
		Preload("Tryout.Questions", func(db *gorm.DB) *gorm.DB { return db.Order(`"order" ASC`) }).
		Preload("Tryout.Questions.Options").
		Preload("Answers").
		Where("id = ? AND \"userId\" = ?", resultID, userID).
		First(&result).Error
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (h *Handler) TryoutReview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	result, err := h.loadTryoutResultForReview(c.Params("resultId"), uid)
	if err != nil {
		return httpx.New(404, "Hasil tryout tidak ditemukan.")
	}
	if _, err := h.ensureAccess(uid, result.Tryout.IsFree, result.Tryout.FreeForNewMembers, result.Tryout.FreePackageIDs); err != nil {
		return err
	}

	score := 0.0
	if result.Score != nil {
		score = *result.Score
	}
	completedAt := result.CreatedAt
	if result.CompletedAt != nil {
		completedAt = *result.CompletedAt
	}
	durationSeconds := tDurationSeconds(result, result.Tryout.DurationMinutes)

	t := result.Tryout
	return httpx.Success(c, fiber.Map{
		"tryout": fiber.Map{
			"id": t.ID, "name": t.Name, "slug": t.Slug, "isFree": t.IsFree,
			"sessionOrder": t.SessionOrder, "isPsikoSession": isPsiko(t),
			"totalQuestions": t.TotalQuestions, "durationMinutes": t.DurationMinutes,
			"subCategory": fiber.Map{
				"id": t.SubCategory.ID, "name": t.SubCategory.Name,
				"category": fiber.Map{"id": t.SubCategory.Category.ID, "name": t.SubCategory.Category.Name},
			},
		},
		"score":            score,
		"completedAt":      completedAt,
		"durationSeconds":  durationSeconds,
		"questions":        buildTryoutReviewQuestions(t.Questions, result.Answers),
	})
}

func tDurationSeconds(result *models.TryoutResult, durationMinutes int) int {
	if result.CompletedAt != nil {
		sec := int(result.CompletedAt.Sub(result.StartedAt).Seconds())
		if sec > 0 {
			return sec
		}
	}
	if result.DurationSeconds != nil && *result.DurationSeconds > 0 {
		return *result.DurationSeconds
	}
	if durationMinutes > 0 {
		return durationMinutes * 60
	}
	return 0
}

func (h *Handler) PackageReview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	anchor, err := h.loadTryoutResultForReview(c.Params("resultId"), uid)
	if err != nil {
		return httpx.New(404, "Hasil tryout tidak ditemukan.")
	}
	if _, err := h.ensureAccess(uid, anchor.Tryout.IsFree, anchor.Tryout.FreeForNewMembers, anchor.Tryout.FreePackageIDs); err != nil {
		return err
	}
	if !isPsiko(anchor.Tryout) {
		return httpx.New(400, "Tryout ini bukan paket POLRI / PSIKO.")
	}

	var sequence []models.Tryout
	h.DB.Where(`"subCategoryId" = ? AND "isPublished" = true AND "sessionOrder" IS NOT NULL`, anchor.Tryout.SubCategoryID).
		Order(`"sessionOrder" ASC, "createdAt" ASC`).Find(&sequence)
	if len(sequence) == 0 {
		return httpx.New(404, "Data paket PSIKO tidak ditemukan.")
	}

	tryoutIDs := make([]string, 0, len(sequence))
	for _, item := range sequence {
		tryoutIDs = append(tryoutIDs, item.ID)
	}

	var recent []models.TryoutResult
	h.DB.Preload("Tryout").
		Where(`"userId" = ? AND "completedAt" IS NOT NULL AND "tryoutId" IN ?`, uid, tryoutIDs).
		Order(`"completedAt" DESC`).
		Limit(len(sequence) * 5).
		Find(&recent)

	resultIDByOrder := map[int]string{}
	for _, item := range recent {
		if item.Tryout.SessionOrder == nil {
			continue
		}
		order := *item.Tryout.SessionOrder
		if _, exists := resultIDByOrder[order]; !exists {
			resultIDByOrder[order] = item.ID
		}
	}
	if len(resultIDByOrder) == 0 {
		return httpx.New(404, "Belum ada data pembahasan paket PSIKO.")
	}

	selectedIDs := make([]string, 0, len(resultIDByOrder))
	for _, id := range resultIDByOrder {
		selectedIDs = append(selectedIDs, id)
	}

	var packageResults []models.TryoutResult
	h.DB.
		Preload("Tryout").
		Preload("Tryout.Questions", func(db *gorm.DB) *gorm.DB { return db.Order(`"order" ASC`) }).
		Preload("Tryout.Questions.Options").
		Preload("Answers").
		Where(`id IN ? AND "userId" = ?`, selectedIDs, uid).
		Find(&packageResults)
	resultMap := map[string]models.TryoutResult{}
	for _, item := range packageResults {
		resultMap[item.ID] = item
	}

	sections := []fiber.Map{}
	totalScore := 0.0
	totalCorrect := 0
	totalQuestions := 0
	for _, item := range sequence {
		if item.SessionOrder == nil {
			continue
		}
		order := *item.SessionOrder
		selectedID, ok := resultIDByOrder[order]
		if !ok {
			continue
		}
		result, ok := resultMap[selectedID]
		if !ok {
			continue
		}
		questions := buildTryoutReviewQuestions(result.Tryout.Questions, result.Answers)
		score := 0.0
		if result.Score != nil {
			score = *result.Score
		}
		completedAt := result.CreatedAt
		if result.CompletedAt != nil {
			completedAt = *result.CompletedAt
		}
		correctCount := 0
		for _, q := range questions {
			if isCorrect, _ := q["isCorrect"].(bool); isCorrect {
				correctCount++
			}
		}
		totalScore += score
		totalCorrect += correctCount
		totalQuestions += len(questions)
		sections = append(sections, fiber.Map{
			"sessionOrder": order,
			"resultId":     result.ID,
			"score":        score,
			"completedAt":  completedAt,
			"tryout": fiber.Map{
				"id": result.Tryout.ID, "name": result.Tryout.Name, "slug": result.Tryout.Slug,
				"totalQuestions": result.Tryout.TotalQuestions, "durationMinutes": result.Tryout.DurationMinutes,
			},
			"questions": questions,
		})
	}

	avg := 0.0
	if len(sections) > 0 {
		avg = totalScore / float64(len(sections))
	}
	mode := "NUMBER"
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", "psiko_tryout_cermat_mode").First(&s).Error; err == nil && s.Value != "" {
		mode = s.Value
	}

	return httpx.Success(c, fiber.Map{
		"package": fiber.Map{
			"categoryId":      anchor.Tryout.SubCategory.Category.ID,
			"categoryName":    anchor.Tryout.SubCategory.Category.Name,
			"subCategoryId":   anchor.Tryout.SubCategory.ID,
			"subCategoryName": anchor.Tryout.SubCategory.Name,
			"totalSessions":   len(sequence),
			"cermatMode":      mode,
		},
		"overall": fiber.Map{
			"averageScore":   avg,
			"totalCorrect":   totalCorrect,
			"totalQuestions": totalQuestions,
		},
		"sections": sections,
	})
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
