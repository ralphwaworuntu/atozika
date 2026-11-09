package materials

import (
	"time"

	"atozika/internal/activity"
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

// access describes which materials a member may open under their active membership.
type access struct {
	premium    bool
	trx        *models.Transaction
	categories []string
	materialID map[string]struct{}
}

func (h *Handler) resolveAccess(userID string) access {
	trx, _ := membership.GetActive(h.DB, userID)
	a := access{premium: membership.IsPremium(h.DB, userID), trx: trx, materialID: map[string]struct{}{}}
	if a.premium {
		a.categories = Categories
		return a
	}
	a.categories = h.assignedCategories(userID)
	for _, mid := range membership.EntitledMaterialIDs(h.DB, trx) {
		a.materialID[mid] = struct{}{}
	}
	return a
}

func (a access) allows(m models.Material) bool {
	if a.premium {
		return true
	}
	if _, ok := a.materialID[m.ID]; ok {
		return true
	}
	for _, cat := range a.categories {
		if cat == m.Category {
			return true
		}
	}
	return false
}

func (a access) visibleCategories(items []models.Material) []string {
	if a.premium {
		return Categories
	}
	set := append([]string{}, a.categories...)
	for _, m := range items {
		if _, ok := a.materialID[m.ID]; ok {
			set = append(set, m.Category)
		}
	}
	return Ordered(set)
}

func (h *Handler) accessible(a access) []models.Material {
	var all []models.Material
	h.DB.Order(`"createdAt" DESC`).Find(&all)
	out := []models.Material{}
	for _, m := range all {
		if a.allows(m) {
			out = append(out, m)
		}
	}
	return out
}

func (h *Handler) Categories(c *fiber.Ctx) error {
	a := h.resolveAccess(middleware.Current(c).ID)
	return httpx.Success(c, fiber.Map{"categories": a.visibleCategories(h.accessible(a))})
}

func (h *Handler) openedIDs(userID string, trx *models.Transaction) map[string]struct{} {
	out := map[string]struct{}{}
	if trx == nil {
		return out
	}
	ids := []string{}
	h.DB.Model(&models.MaterialAccess{}).Where(`"userId" = ? AND "transactionId" = ?`, userID, trx.ID).Pluck(`"materialId"`, &ids)
	for _, mid := range ids {
		out[mid] = struct{}{}
	}
	return out
}

func (h *Handler) List(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	a := h.resolveAccess(uid)
	opened := h.openedIDs(uid, a.trx)
	limited := !a.premium && a.trx != nil && a.trx.ModuleQuota > 0
	cat, typ := c.Query("category"), c.Query("type")
	out := []fiber.Map{}
	for _, m := range h.accessible(a) {
		if cat != "" && m.Category != cat {
			continue
		}
		if typ != "" && m.Type != typ {
			continue
		}
		_, isOpened := opened[m.ID]
		locked := limited && !isOpened
		fileURL := m.FileURL
		if locked {
			fileURL = ""
		}
		out = append(out, fiber.Map{
			"id": m.ID, "title": m.Title, "category": m.Category, "type": m.Type, "description": m.Description,
			"fileUrl": fileURL, "createdAt": m.CreatedAt, "opened": isOpened, "locked": locked,
		})
	}
	return httpx.Success(c, out)
}

// Open returns a material's file after checking access and spending module quota once.
func (h *Handler) Open(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var m models.Material
	if err := h.DB.First(&m, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Materi tidak ditemukan")
	}
	a := h.resolveAccess(uid)
	if !a.allows(m) {
		return httpx.New(403, "Materi ini belum termasuk dalam paket Anda.", map[string]any{"code": "MATERIAL_NOT_ENTITLED"})
	}
	trx := a.trx
	if a.premium && trx != nil {
		unlimited := *trx
		unlimited.ModuleQuota = 0
		trx = &unlimited
	}
	if err := membership.ConsumeModule(h.DB, trx, uid, m.ID, id.New); err != nil {
		return err
	}
	activity.Record(h.DB, uid, activity.KindMaterialOpen, "Membuka materi: "+m.Title, "/app/materi", map[string]any{
		"materialId": m.ID, "category": m.Category, "type": m.Type,
	})
	return httpx.Success(c, fiber.Map{"id": m.ID, "fileUrl": m.FileURL, "type": m.Type, "openedAt": time.Now()})
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
	body.CreatedAt = time.Now()
	if u != nil {
		body.UploadedByID = &u.ID
	}
	if err := h.DB.Create(&body).Error; err != nil {
		return err
	}
	return httpx.Created(c, body)
}
