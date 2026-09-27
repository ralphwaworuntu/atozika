package calculators

import (
	"encoding/json"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func (h *Handler) Tree(c *fiber.Ctx) error {
	var items []models.PsychCalculatorTemplate
	h.DB.Order(`"category" ASC, "sectionOrder" ASC, "order" ASC`).Find(&items)
	groups := map[string][]models.PsychCalculatorTemplate{}
	for _, it := range items {
		groups[it.Category] = append(groups[it.Category], it)
	}
	out := []fiber.Map{}
	for cat, list := range groups {
		label := cat
		if len(list) > 0 {
			label = list[0].CategoryLabel
		}
		out = append(out, fiber.Map{"category": cat, "categoryLabel": label, "items": list})
	}
	return httpx.Success(c, out)
}

func (h *Handler) Detail(c *fiber.Ctx) error {
	var item models.PsychCalculatorTemplate
	if err := h.DB.Where("slug = ?", c.Params("slug")).First(&item).Error; err != nil {
		return httpx.New(404, "Kalkulator tidak ditemukan")
	}
	return httpx.Success(c, item)
}

func (h *Handler) Compute(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var item models.PsychCalculatorTemplate
	if err := h.DB.Where("slug = ?", c.Params("slug")).First(&item).Error; err != nil {
		return httpx.New(404, "Kalkulator tidak ditemukan")
	}
	var body struct {
		Values map[string]any `json:"values"`
	}
	_ = c.BodyParser(&body)
	score := 0
	for _, v := range body.Values {
		switch n := v.(type) {
		case float64:
			score += int(n)
		case int:
			score += n
		}
	}
	interpretation := "Cukup"
	var cfg map[string]any
	_ = json.Unmarshal(item.Config, &cfg)
	if rows, ok := cfg["interpretation"].([]any); ok {
		for _, row := range rows {
			m, _ := row.(map[string]any)
			min, _ := m["min"].(float64)
			max, _ := m["max"].(float64)
			if float64(score) >= min && float64(score) <= max {
				if label, ok := m["label"].(string); ok {
					interpretation = label
				}
			}
		}
	}
	payload, _ := json.Marshal(body.Values)
	sub := models.PsychCalculatorSubmission{
		ID: id.New(), CalculatorID: item.ID, UserID: &uid, Score: score,
		Interpretation: interpretation, Payload: datatypes.JSON(payload), CreatedAt: time.Now(),
	}
	h.DB.Create(&sub)
	return httpx.Success(c, fiber.Map{"score": score, "interpretation": interpretation, "submissionId": sub.ID, "config": cfg})
}

func (h *Handler) AdminList(c *fiber.Ctx) error {
	var items []models.PsychCalculatorTemplate
	h.DB.Order("title ASC").Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) AdminUpdate(c *fiber.Ctx) error {
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var item models.PsychCalculatorTemplate
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Kalkulator tidak ditemukan")
	}
	h.DB.Model(&item).Updates(body)
	h.DB.First(&item, "id = ?", item.ID)
	return httpx.Success(c, item)
}
