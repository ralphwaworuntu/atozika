package referrals

import (
	"atozika/internal/config"
	"atozika/internal/httpx"
	"atozika/internal/middleware"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	DB  *gorm.DB
	Cfg config.Config
}

func (h *Handler) Me(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var user models.User
	if err := h.DB.Select(`id, "referralCode"`).First(&user, "id = ?", uid).Error; err != nil {
		return httpx.New(404, "User not found")
	}
	var refs []models.Referral
	h.DB.Preload("Referred").Where(`"referrerId" = ?`, uid).Find(&refs)
	list := []fiber.Map{}
	for _, r := range refs {
		list = append(list, fiber.Map{
			"id": r.ID, "status": r.Status, "createdAt": r.CreatedAt,
			"referred": fiber.Map{"name": r.Referred.Name, "email": r.Referred.Email, "createdAt": r.Referred.CreatedAt},
		})
	}
	return httpx.Success(c, fiber.Map{
		"referralCode": user.ReferralCode,
		"link":         h.Cfg.FrontendURL + "/auth/register?ref=" + user.ReferralCode,
		"total":        len(refs),
		"list":         list,
	})
}
