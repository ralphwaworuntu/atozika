package exams

import (
	"strings"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/jsonutil"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
)

const (
	ModeRegular = "REGULAR"
	ModeExam    = "EXAM"
)

func resultMode(ujian bool) string {
	if ujian {
		return ModeExam
	}
	return ModeRegular
}

func requestMode(c *fiber.Ctx) string {
	if strings.Contains(c.Path(), "/ujian") {
		return ModeExam
	}
	return ModeRegular
}

func ensureWindow(openAt, closeAt *time.Time) error {
	now := time.Now()
	if openAt != nil && now.Before(*openAt) {
		return httpx.New(403, "Paket belum dibuka sesuai jadwal.")
	}
	if closeAt != nil && now.After(*closeAt) {
		return httpx.New(403, "Paket telah ditutup.")
	}
	return nil
}

func practiceSelectedIDs(a models.PracticeAnswer) []string {
	ids := jsonutil.Strings(a.SelectedOptionIDs)
	if len(ids) > 0 {
		return ids
	}
	if a.OptionID != nil && *a.OptionID != "" {
		return []string{*a.OptionID}
	}
	return nil
}

func shapePracticeReview(res models.PracticeResult, answers []models.PracticeAnswer) fiber.Map {
	answerMap := map[string]models.PracticeAnswer{}
	for _, a := range answers {
		answerMap[a.QuestionID] = a
	}
	questions := make([]fiber.Map, 0, len(res.Set.Questions))
	for _, q := range res.Set.Questions {
		ans, ok := answerMap[q.ID]
		userIDs := []string{}
		correct := false
		if ok {
			userIDs = practiceSelectedIDs(ans)
			correct = ans.IsCorrect
		}
		var userOptionID any
		if len(userIDs) > 0 {
			userOptionID = userIDs[0]
		}
		options := make([]fiber.Map, 0, len(q.Options))
		for _, o := range q.Options {
			options = append(options, fiber.Map{
				"id": o.ID, "label": o.Label, "imageUrl": o.ImageURL, "isCorrect": o.IsCorrect,
			})
		}
		questions = append(questions, fiber.Map{
			"id": q.ID, "prompt": q.Prompt, "imageUrl": q.ImageURL, "explanation": q.Explanation,
			"explanationImageUrl": q.ExplanationImageURL, "order": q.Order, "multipleCorrect": q.MultipleCorrect,
			"options": options, "userOptionId": userOptionID, "userOptionIds": userIDs,
			"isCorrect": correct,
		})
	}
	score := 0.0
	if res.Score != nil {
		score = *res.Score
	}
	var completedAt any
	if res.CompletedAt != nil {
		completedAt = *res.CompletedAt
	}
	return fiber.Map{
		"set": fiber.Map{
			"id": res.Set.ID, "title": res.Set.Title, "slug": res.Set.Slug, "level": res.Set.Level,
			"isFree": res.Set.IsFree, "subSubCategory": res.Set.SubSubCategory,
		},
		"score": score, "completedAt": completedAt, "questions": questions,
	}
}
