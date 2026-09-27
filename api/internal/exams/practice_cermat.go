package exams

import (
	"encoding/json"
	"hash/fnv"
	"math"
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

func (h *Handler) PracticeCategories(c *fiber.Ctx) error {
	var cats []models.PracticeCategory
	h.DB.Order("name ASC").Find(&cats)
	out := []fiber.Map{}
	for _, cat := range cats {
		var subs []models.PracticeSubCategory
		h.DB.Where(`"categoryId" = ?`, cat.ID).Find(&subs)
		subOut := []fiber.Map{}
		for _, s := range subs {
			var sss []models.PracticeSubSubCategory
			h.DB.Where(`"subCategoryId" = ?`, s.ID).Find(&sss)
			ssOut := []fiber.Map{}
			for _, ss := range sss {
				var sets []models.PracticeSet
				h.DB.Where(`"subSubCategoryId" = ? AND "isFree" = true OR "subSubCategoryId" = ?`, ss.ID, ss.ID).Find(&sets)
				h.DB.Where(`"subSubCategoryId" = ?`, ss.ID).Find(&sets)
				ssOut = append(ssOut, fiber.Map{"id": ss.ID, "name": ss.Name, "slug": ss.Slug, "imageUrl": ss.ImageURL, "sets": sets})
			}
			subOut = append(subOut, fiber.Map{"id": s.ID, "name": s.Name, "slug": s.Slug, "imageUrl": s.ImageURL, "subSubs": ssOut})
		}
		out = append(out, fiber.Map{"id": cat.ID, "name": cat.Name, "slug": cat.Slug, "imageUrl": cat.ImageURL, "subCategories": subOut})
	}
	return httpx.Success(c, out)
}

func (h *Handler) practiceBySlug(slug string) (*models.PracticeSet, error) {
	var set models.PracticeSet
	if err := h.DB.Where("slug = ?", slug).
		Preload("SubSubCategory").Preload("SubSubCategory.SubCategory").Preload("SubSubCategory.SubCategory.Category").
		Preload("Questions", func(db *gorm.DB) *gorm.DB { return db.Order(`"order" ASC`) }).
		Preload("Questions.Options").First(&set).Error; err != nil {
		return nil, httpx.New(404, "Paket latihan tidak ditemukan")
	}
	return &set, nil
}

func (h *Handler) PracticeInfo(c *fiber.Ctx) error {
	set, err := h.practiceBySlug(c.Params("slug"))
	if err != nil {
		return err
	}
	set.Questions = nil
	return httpx.Success(c, set)
}

func (h *Handler) PracticeSet(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	set, err := h.practiceBySlug(c.Params("slug"))
	if err != nil {
		return err
	}
	if _, err := h.ensurePracticeAccess(uid, set); err != nil {
		return err
	}
	qOut := []fiber.Map{}
	for _, q := range shuffle(set.Questions) {
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
		"id": set.ID, "title": set.Title, "slug": set.Slug, "description": set.Description,
		"durationMinutes": set.DurationMinutes, "totalQuestions": set.TotalQuestions,
		"coverImageUrl": set.CoverImageURL, "questions": qOut,
	})
}

func (h *Handler) ensurePracticeAccess(userID string, set *models.PracticeSet) (*models.Transaction, error) {
	if membership.IsPremium(h.DB, userID) {
		return membership.AssertActive(h.DB, userID)
	}
	trx, err := membership.GetActive(h.DB, userID)
	freePkgs := jsonutil.Strings(set.FreePackageIDs)
	if err != nil || trx == nil {
		if !set.IsFree || !set.FreeForNewMembers {
			return nil, httpx.New(403, "Membership tidak aktif atau belum divalidasi admin.", map[string]any{"code": "MEMBERSHIP_REQUIRED"})
		}
		return nil, nil
	}
	if set.IsFree && (set.FreeForNewMembers || jsonutil.Contains(freePkgs, trx.PackageID)) {
		return trx, nil
	}
	if err := membership.AssertFeature(trx, "PRACTICE", false); err != nil {
		return nil, err
	}
	return trx, nil
}

func (h *Handler) SubmitPractice(c *fiber.Ctx) error {
	return h.submitPractice(c, false)
}

func (h *Handler) SubmitExamPractice(c *fiber.Ctx) error {
	return h.submitPractice(c, true)
}

func (h *Handler) submitPractice(c *fiber.Ctx, ujian bool) error {
	uid := middleware.Current(c).ID
	set, err := h.practiceBySlug(c.Params("slug"))
	if err != nil {
		return err
	}
	if ujian {
		if err := h.EnsureBlock(uid, "PRACTICE", true); err != nil {
			return err
		}
		if err := h.assertExamControl(uid, "EXAM"); err != nil {
			return err
		}
	} else {
		if err := h.EnsureBlock(uid, "PRACTICE", false); err != nil {
			return err
		}
		if _, err := h.ensurePracticeAccess(uid, set); err != nil {
			return err
		}
	}
	var body struct {
		Answers []struct {
			QuestionID string   `json:"questionId"`
			OptionID   string   `json:"optionId"`
			OptionIDs  []string `json:"optionIds"`
		} `json:"answers"`
	}
	_ = c.BodyParser(&body)
	qMap := map[string]models.PracticeQuestion{}
	for _, q := range set.Questions {
		qMap[q.ID] = q
	}
	now := time.Now()
	res := models.PracticeResult{ID: id.New(), UserID: uid, SetID: set.ID, CreatedAt: now}
	earned := 0.0
	h.DB.Create(&res)
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
		var opt *string
		if len(sel) > 0 {
			opt = &sel[0]
		}
		ans := models.PracticeAnswer{ID: id.New(), ResultID: res.ID, QuestionID: a.QuestionID, OptionID: opt, UserID: uid, IsCorrect: ok, CreatedAt: now}
		if len(sel) > 0 {
			ans.SelectedOptionIDs = jsonutil.MustJSON(sel)
		}
		h.DB.Create(&ans)
	}
	total := len(set.Questions)
	if total == 0 {
		total = 1
	}
	score := (earned / float64(total)) * 100
	h.DB.Model(&res).Updates(map[string]any{"score": score, "completedAt": now})
	return httpx.Success(c, fiber.Map{"resultId": res.ID, "score": score, "total": total, "earnedCredit": earned})
}

func (h *Handler) PracticeHistory(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var items []models.PracticeResult
	h.DB.Preload("Set").Where(`"userId" = ?`, uid).Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) PracticeReview(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var res models.PracticeResult
	if err := h.DB.Preload("Set").Preload("Set.Questions").Preload("Set.Questions.Options").
		Where("id = ? AND \"userId\" = ?", c.Params("resultId"), uid).First(&res).Error; err != nil {
		return httpx.New(404, "Result not found")
	}
	var answers []models.PracticeAnswer
	h.DB.Where(`"resultId" = ?`, res.ID).Find(&answers)
	return httpx.Success(c, fiber.Map{"result": res, "answers": answers, "set": res.Set, "questions": res.Set.Questions})
}

func (h *Handler) settingInt(key string, fallback int) int {
	var s models.SiteSetting
	if err := h.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return fallback
	}
	n := atoi(s.Value)
	if n <= 0 {
		return fallback
	}
	return n
}

func (h *Handler) CermatConfig(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"questionCount":   h.settingInt("cermat_question_count", 60),
		"durationSeconds": h.settingInt("cermat_duration_seconds", 60),
		"totalSessions":   h.settingInt("cermat_total_sessions", 10),
		"breakSeconds":    h.settingInt("cermat_break_seconds", 5),
	})
}

var imageCols = [][]string{
	{"bulu-tangkis", "bola-voly", "sarung-tinju", "bowling", "sepatu"},
	{"larangan-jalan", "larangan-merokok", "larangan-mobil", "larangan-sampah", "larangan-kosong"},
	{"emoji-lidah", "emoji-kacamata", "emoji-baik", "emoji-datar", "emoji-senang"},
	{"apel", "semangka", "anggur", "alpukat", "pisang"},
	{"pesawat", "mobil", "kapal", "bus", "kereta-api"},
	{"diagram-batang", "panah-naik", "donut-chart", "diagram-turun", "garis-naik"},
	{"topi", "sepatu-olahraga", "baju", "tas", "celana"},
	{"gitar", "harpa", "suling", "drum", "piano"},
	{"kucing", "ikan", "jerapah", "ayam", "burung"},
	{"saturnus", "bulan-sabit", "bulan-purnama", "bintang", "matahari"},
}

func seeded(parts ...string) func() float64 {
	h := fnv.New32a()
	h.Write([]byte(strings.Join(parts, "|")))
	state := h.Sum32()
	return func() float64 {
		state = state*1664525 + 1013904223
		return float64(state) / float64(math.MaxUint32)
	}
}

func shuffleSeeded[T any](in []T, rng func() float64) []T {
	out := append([]T(nil), in...)
	for i := len(out) - 1; i > 0; i-- {
		j := int(rng() * float64(i+1))
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func (h *Handler) CermatStart(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	if err := h.EnsureBlock(uid, "CERMAT", false); err != nil {
		return err
	}
	if membership.IsPremium(h.DB, uid) {
		if _, err := membership.AssertActive(h.DB, uid); err != nil {
			return err
		}
	} else {
		trx, err := membership.AssertActive(h.DB, uid)
		if err != nil {
			return err
		}
		if err := membership.AssertFeature(trx, "CERMAT", false); err != nil {
			return err
		}
	}
	var body struct {
		Mode         string `json:"mode"`
		SessionIndex int    `json:"sessionIndex"`
		AttemptID    string `json:"attemptId"`
	}
	_ = c.BodyParser(&body)
	mode := body.Mode
	if mode != "LETTER" && mode != "IMAGE" {
		mode = "NUMBER"
	}
	qCount := h.settingInt("cermat_question_count", 60)
	dur := h.settingInt("cermat_duration_seconds", 60)
	total := h.settingInt("cermat_total_sessions", 10)
	brk := h.settingInt("cermat_break_seconds", 5)
	now := time.Now()
	attemptID := body.AttemptID
	if attemptID == "" {
		att := models.CermatAttempt{
			ID: id.New(), UserID: uid, Mode: mode, TotalSessions: total, QuestionCount: qCount,
			DurationSeconds: dur, BreakSeconds: brk, StartedAt: now,
		}
		h.DB.Create(&att)
		attemptID = att.ID
	}
	idx := body.SessionIndex
	if idx <= 0 {
		idx = 1
	}
	seed := seeded(uid, attemptID, itoa(idx))
	var base []string
	switch mode {
	case "LETTER":
		letters := []string{}
		for i := 0; i < 26; i++ {
			letters = append(letters, string(rune('A'+i)))
		}
		base = shuffleSeeded(letters, seed)[:5]
	case "IMAGE":
		order := shuffleSeeded([]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}, seeded(uid, attemptID, "column-order"))
		col := imageCols[order[(idx-1)%10]]
		base = shuffleSeeded(append([]string{}, col...), seed)
	default:
		digits := []string{"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}
		base = shuffleSeeded(digits, seed)[:5]
	}
	type q struct {
		Sequence []string `json:"sequence"`
		Answer   string   `json:"answer"`
	}
	questions := []q{}
	for i := 0; i < qCount; i++ {
		qRng := seeded(uid, attemptID, itoa(idx), "q", itoa(i))
		missing := base[int(qRng()*float64(len(base)))]
		prompt := []string{}
		for _, tok := range base {
			if tok != missing {
				prompt = append(prompt, tok)
			}
		}
		prompt = shuffleSeeded(prompt, qRng)
		questions = append(questions, q{Sequence: prompt, Answer: missing})
	}
	if mode == "IMAGE" {
		questions = shuffleSeeded(questions, seeded(uid, attemptID, itoa(idx), "order"))
	}
	b, _ := json.Marshal(base)
	sess := models.CermatSession{
		ID: id.New(), UserID: uid, AttemptID: &attemptID, SessionIndex: idx, TotalQuestions: qCount,
		CorrectCount: 0, DurationSeconds: dur, BaseSet: string(b), Mode: mode, StartedAt: now, CreatedAt: now,
	}
	h.DB.Create(&sess)
	qOut := []fiber.Map{}
	for i, item := range questions {
		seq, _ := json.Marshal(item.Sequence)
		h.DB.Create(&models.CermatAnswer{
			ID: id.New(), SessionID: sess.ID, Order: i, Sequence: string(seq),
			CorrectAnswer: item.Answer, IsCorrect: false,
		})
		qOut = append(qOut, fiber.Map{"order": i, "sequence": item.Sequence})
	}
	return httpx.Success(c, fiber.Map{
		"sessionId": sess.ID, "attemptId": attemptID, "sessionIndex": idx, "mode": mode,
		"durationSeconds": dur, "breakSeconds": brk, "totalSessions": total,
		"timerSeconds": dur, "questionCount": qCount,
		"questions": qOut, "baseSet": base,
	})
}

func (h *Handler) CermatSubmit(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var sess models.CermatSession
	if err := h.DB.First(&sess, "id = ? AND \"userId\" = ?", c.Params("sessionId"), uid).Error; err != nil {
		return httpx.New(404, "Sesi tidak ditemukan")
	}
	var body struct {
		Answers []struct {
			Order int     `json:"order"`
			Value *string `json:"value"`
		} `json:"answers"`
	}
	_ = c.BodyParser(&body)
	var stored []models.CermatAnswer
	h.DB.Where(`"sessionId" = ?`, sess.ID).Order(`"order" ASC`).Find(&stored)
	correct := 0
	now := time.Now()
	for _, q := range stored {
		var val *string
		for _, a := range body.Answers {
			if a.Order == q.Order {
				val = a.Value
				break
			}
		}
		ok := val != nil && *val == q.CorrectAnswer
		if ok {
			correct++
		}
		h.DB.Model(&q).Updates(map[string]any{"userAnswer": val, "isCorrect": ok})
	}
	total := sess.TotalQuestions
	if total == 0 {
		total = 1
	}
	score := float64(correct) / float64(total) * 100
	h.DB.Model(&sess).Updates(map[string]any{"correctCount": correct, "score": score, "finishedAt": now})
	band := "Cukup"
	if score >= 85 {
		band = "Sangat Baik"
	} else if score >= 70 {
		band = "Baik"
	}
	return httpx.Success(c, fiber.Map{"sessionId": sess.ID, "score": score, "correctCount": correct, "totalQuestions": total, "band": band, "attemptId": sess.AttemptID})
}

func (h *Handler) CermatHistory(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	mode := c.Query("mode", "IMAGE")
	var items []models.CermatAttempt
	q := h.DB.Where(`"userId" = ?`, uid).Order(`"startedAt" DESC`)
	if mode != "" {
		q = q.Where("mode = ?", mode)
	}
	q.Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) CermatAttempt(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var att models.CermatAttempt
	if err := h.DB.Preload("Sessions").Preload("Sessions.Answers").Where("id = ? AND \"userId\" = ?", c.Params("attemptId"), uid).First(&att).Error; err != nil {
		return httpx.New(404, "Attempt tidak ditemukan")
	}
	return httpx.Success(c, att)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [12]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
