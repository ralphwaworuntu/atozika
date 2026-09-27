package contact

import (
	"time"

	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func (h *Handler) Create(c *fiber.Ctx) error {
	var body struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Message string `json:"message"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Name) < 3 || len(body.Message) < 10 {
		return httpx.New(400, "Pesan tidak valid")
	}
	msg := models.ContactMessage{
		ID: id.New(), Name: body.Name, Email: body.Email, Phone: strPtr(body.Phone),
		Message: body.Message, Status: "NEW", CreatedAt: time.Now(),
	}
	h.DB.Create(&msg)
	return httpx.Created(c, msg)
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
