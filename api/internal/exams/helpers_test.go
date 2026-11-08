package exams

import (
	"testing"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
)

func TestResultMode(t *testing.T) {
	if resultMode(false) != ModeRegular {
		t.Fatal("regular mode")
	}
	if resultMode(true) != ModeExam {
		t.Fatal("exam mode")
	}
}

func TestEnsureWindow(t *testing.T) {
	future := time.Now().Add(time.Hour)
	past := time.Now().Add(-time.Hour)
	if err := ensureWindow(&future, nil); err == nil {
		t.Fatal("expected not yet open")
	}
	if err := ensureWindow(nil, &past); err == nil {
		t.Fatal("expected already closed")
	}
	if err := ensureWindow(nil, &future); err != nil {
		t.Fatal(err)
	}
	if _, ok := ensureWindow(&future, nil).(*httpx.AppError); !ok {
		t.Fatal("expected http error")
	}
}

func TestShapePracticeReview(t *testing.T) {
	optCorrect := "opt-1"
	score := 100.0
	done := time.Now()
	res := models.PracticeResult{
		Score:       &score,
		CompletedAt: &done,
		Set: models.PracticeSet{
			ID: "set-1", Title: "TWK", Slug: "twk",
			Questions: []models.PracticeQuestion{{
				ID: "q1", Prompt: "Ibu kota?",
				Options: []models.PracticeOption{
					{ID: "opt-1", Label: "Jakarta", IsCorrect: true},
					{ID: "opt-2", Label: "Bandung", IsCorrect: false},
				},
			}},
		},
	}
	out := shapePracticeReview(res, []models.PracticeAnswer{{
		QuestionID: "q1", OptionID: &optCorrect, IsCorrect: true,
	}})
	if out["score"] != 100.0 {
		t.Fatalf("score %+v", out["score"])
	}
	raw, ok := out["questions"].([]fiber.Map)
	if !ok || len(raw) != 1 {
		t.Fatalf("questions type %T", out["questions"])
	}
	if raw[0]["isCorrect"] != true {
		t.Fatal("expected correct")
	}
	ids, _ := raw[0]["userOptionIds"].([]string)
	if len(ids) != 1 || ids[0] != "opt-1" {
		t.Fatalf("userOptionIds %+v", raw[0]["userOptionIds"])
	}
}
