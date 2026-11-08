package admin

import (
	"strings"

	"atozika/internal/httpx"
	"atozika/internal/models"
	"atozika/internal/whatsapp"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) WhatsAppStatus(c *fiber.Ctx) error {
	var pending int64
	h.DB.Model(&models.WhatsAppDispatch{}).Where(`status IN ?`, []string{whatsapp.StatusSkipped, whatsapp.StatusFailed}).Count(&pending)
	var items []models.WhatsAppDispatch
	h.DB.Order(`"createdAt" DESC`).Limit(30).Find(&items)
	provider := h.Cfg.WhatsAppProvider
	if provider == "" {
		provider = "belum dipilih"
	}
	return httpx.Success(c, fiber.Map{
		"provider": provider, "configured": h.WA != nil && h.WA.Configured(),
		"template": h.Cfg.WhatsAppTemplate, "pending": pending, "items": items,
	})
}

func (h *Handler) WhatsAppRetry(c *fiber.Ctx) error {
	if h.WA == nil {
		return httpx.New(422, "Pengiriman WhatsApp belum terpasang")
	}
	tried, sent, err := h.WA.RetryPending(30)
	if err != nil {
		return httpx.New(422, err.Error())
	}
	return httpx.Success(c, fiber.Map{"tried": tried, "sent": sent})
}

func (h *Handler) WhatsAppTest(c *fiber.Ctx) error {
	if h.WA == nil {
		return httpx.New(422, "Pengiriman WhatsApp belum terpasang")
	}
	var body struct {
		Phone string `json:"phone"`
	}
	if err := c.BodyParser(&body); err != nil || strings.TrimSpace(body.Phone) == "" {
		return httpx.New(400, "Nomor WhatsApp wajib diisi")
	}
	page := strings.TrimRight(h.Cfg.AppURL, "/")
	if page != "" {
		page += "/orang-tua"
	}
	if err := h.WA.SendTest(body.Phone, page); err != nil {
		return httpx.New(422, err.Error())
	}
	return httpx.Success(c, fiber.Map{"sent": true})
}
