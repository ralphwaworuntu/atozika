package materials

import (
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func (h *Handler) assignedCategories(userID string) []string {
	var rows []models.MemberMaterialCategory
	h.DB.Where(`"userId" = ?`, userID).Find(&rows)
	selected := make([]string, 0, len(rows))
	for _, row := range rows {
		selected = append(selected, row.Category)
	}
	return Ordered(selected)
}

func (h *Handler) Categories(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	if membership.IsPremium(h.DB, uid) {
		return httpx.Success(c, fiber.Map{"categories": Categories})
	}
	return httpx.Success(c, fiber.Map{"categories": h.assignedCategories(uid)})
}

func (h *Handler) List(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	allowed := Categories
	if !membership.IsPremium(h.DB, uid) {
		allowed = h.assignedCategories(uid)
		if len(allowed) == 0 {
			return httpx.Success(c, []any{})
		}
	}
	q := h.DB.Model(&models.Material{}).Where("category IN ?", allowed).Order(`"createdAt" DESC`)
	if cat := c.Query("category"); cat != "" {
		if !ValidCategory(cat) {
			return httpx.Success(c, []any{})
		}
		allowedCat := false
		for _, item := range allowed {
			if item == cat {
				allowedCat = true
				break
			}
		}
		if !allowedCat {
			return httpx.Success(c, []any{})
		}
		q = q.Where("category = ?", cat)
	}
	if typ := c.Query("type"); typ != "" {
		q = q.Where("type = ?", typ)
	}
	var items []models.Material
	q.Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	u := middleware.Current(c)
	var body models.Material
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if !ValidCategory(body.Category) {
		return httpx.New(400, "Kategori materi tidak valid")
	}
	body.ID = id.New()
	if u != nil {
		body.UploadedByID = &u.ID
	}
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
