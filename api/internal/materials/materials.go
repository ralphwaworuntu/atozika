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

func (h *Handler) List(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	premium := membership.IsPremium(h.DB, uid)
	q := h.DB.Model(&models.Material{}).Order(`"createdAt" DESC`)
	if cat := c.Query("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if typ := c.Query("type"); typ != "" {
		q = q.Where("type = ?", typ)
	}
	if !premium {
		ids := membership.AllMaterialIDs(h.DB, uid)
		if len(ids) == 0 {
			return httpx.Success(c, []any{})
		}
		q = q.Where("id IN ?", ids)
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
	body.ID = id.New()
	if u != nil {
		body.UploadedByID = &u.ID
	}
	h.DB.Create(&body)
	return httpx.Created(c, body)
}
