package admin

import (
	"time"

	"atozika/internal/commerce"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
)

func packageView(p models.MembershipPackage) fiber.Map {
	ids := []string{}
	for _, m := range p.Materials {
		ids = append(ids, m.MaterialID)
	}
	return fiber.Map{
		"id": p.ID, "name": p.Name, "slug": p.Slug, "category": p.Category, "tagline": p.Tagline,
		"description": p.Description, "price": p.Price, "durationDays": p.DurationDays, "badgeLabel": p.BadgeLabel,
		"features": jsonutil.Strings(p.Features), "tryoutQuota": p.TryoutQuota, "moduleQuota": p.ModuleQuota,
		"cermatQuota": p.CermatQuota,
		"allowTryout": p.AllowTryout, "allowPractice": p.AllowPractice, "allowCermat": p.AllowCermat,
		"accessAllPackages": p.AccessAllPackages, "isActive": p.IsActive, "materialIds": ids, "materials": p.Materials,
	}
}

func (h *Handler) ListPackages(c *fiber.Ctx) error {
	var items []models.MembershipPackage
	h.DB.Preload("Materials").Where(`"isActive" = ?`, true).Order("price ASC").Find(&items)
	out := []fiber.Map{}
	for _, p := range items {
		out = append(out, packageView(p))
	}
	return httpx.Success(c, out)
}

type packageBody struct {
	Name              string   `json:"name"`
	Slug              string   `json:"slug"`
	Category          string   `json:"category"`
	Tagline           string   `json:"tagline"`
	Description       string   `json:"description"`
	Price             int      `json:"price"`
	DurationDays      int      `json:"durationDays"`
	BadgeLabel        string   `json:"badgeLabel"`
	Features          []string `json:"features"`
	TryoutQuota       int      `json:"tryoutQuota"`
	ModuleQuota       int      `json:"moduleQuota"`
	CermatQuota       int      `json:"cermatQuota"`
	AllowTryout       *bool    `json:"allowTryout"`
	AllowPractice     *bool    `json:"allowPractice"`
	AllowCermat       *bool    `json:"allowCermat"`
	AccessAllPackages *bool    `json:"accessAllPackages"`
	IsActive          *bool    `json:"isActive"`
	MaterialIDs       []string `json:"materialIds"`
}

func (h *Handler) CreatePackage(c *fiber.Ctx) error {
	var body packageBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	item := models.MembershipPackage{
		ID: id.New(), Name: body.Name, Slug: body.Slug, Category: body.Category,
		Tagline: ptr(body.Tagline), Description: body.Description, Price: body.Price,
		DurationDays: body.DurationDays, BadgeLabel: ptr(body.BadgeLabel),
		Features: jsonutil.MustJSON(body.Features), TryoutQuota: body.TryoutQuota, ModuleQuota: body.ModuleQuota,
		CermatQuota: body.CermatQuota,
		AllowTryout: true, AllowPractice: true, AllowCermat: true, IsActive: true,
	}
	if body.AllowTryout != nil {
		item.AllowTryout = *body.AllowTryout
	}
	if body.AllowPractice != nil {
		item.AllowPractice = *body.AllowPractice
	}
	if body.AllowCermat != nil {
		item.AllowCermat = *body.AllowCermat
	}
	if body.AccessAllPackages != nil {
		item.AccessAllPackages = *body.AccessAllPackages
	}
	if body.IsActive != nil {
		item.IsActive = *body.IsActive
	}
	h.DB.Create(&item)
	for _, mid := range body.MaterialIDs {
		h.DB.Create(&models.PackageMaterial{ID: id.New(), PackageID: item.ID, MaterialID: mid})
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Created(c, packageView(item))
}

func (h *Handler) UpdatePackage(c *fiber.Ctx) error {
	var body packageBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "No data provided")
	}
	var item models.MembershipPackage
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Paket tidak ditemukan")
	}
	updates := map[string]any{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.Slug != "" {
		updates["slug"] = body.Slug
	}
	if body.Category != "" {
		updates["category"] = body.Category
	}
	if body.Description != "" {
		updates["description"] = body.Description
	}
	if body.Price != 0 {
		updates["price"] = body.Price
	}
	if body.DurationDays != 0 {
		updates["durationDays"] = body.DurationDays
	}
	if body.Tagline != "" {
		updates["tagline"] = body.Tagline
	}
	if body.BadgeLabel != "" {
		updates["badgeLabel"] = body.BadgeLabel
	}
	if body.Features != nil {
		updates["features"] = jsonutil.MustJSON(body.Features)
	}
	updates["tryoutQuota"] = body.TryoutQuota
	updates["moduleQuota"] = body.ModuleQuota
	updates["cermatQuota"] = body.CermatQuota
	if body.AllowTryout != nil {
		updates["allowTryout"] = *body.AllowTryout
	}
	if body.AllowPractice != nil {
		updates["allowPractice"] = *body.AllowPractice
	}
	if body.AllowCermat != nil {
		updates["allowCermat"] = *body.AllowCermat
	}
	if body.AccessAllPackages != nil {
		updates["accessAllPackages"] = *body.AccessAllPackages
	}
	if body.IsActive != nil {
		updates["isActive"] = *body.IsActive
	}
	h.DB.Model(&item).Updates(updates)
	if body.MaterialIDs != nil {
		h.DB.Where(`"packageId" = ?`, item.ID).Delete(&models.PackageMaterial{})
		for _, mid := range body.MaterialIDs {
			h.DB.Create(&models.PackageMaterial{ID: id.New(), PackageID: item.ID, MaterialID: mid})
		}
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Success(c, packageView(item))
}

func (h *Handler) DeletePackage(c *fiber.Ctx) error {
	h.DB.Where(`"packageId" = ?`, c.Params("id")).Delete(&models.PackageMaterial{})
	h.DB.Delete(&models.MembershipPackage{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func addonView(a models.AddonPackage) fiber.Map {
	ids := []string{}
	for _, m := range a.Materials {
		ids = append(ids, m.MaterialID)
	}
	return fiber.Map{
		"id": a.ID, "name": a.Name, "slug": a.Slug, "description": a.Description, "price": a.Price,
		"tryoutBonus": a.TryoutBonus, "moduleBonus": a.ModuleBonus, "isActive": a.IsActive, "materialIds": ids,
	}
}

func (h *Handler) ListAddons(c *fiber.Ctx) error {
	var items []models.AddonPackage
	h.DB.Preload("Materials").Order("name ASC").Find(&items)
	out := []fiber.Map{}
	for _, a := range items {
		out = append(out, addonView(a))
	}
	return httpx.Success(c, out)
}

type addonBody struct {
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description string   `json:"description"`
	Price       int      `json:"price"`
	TryoutBonus int      `json:"tryoutBonus"`
	ModuleBonus int      `json:"moduleBonus"`
	IsActive    *bool    `json:"isActive"`
	MaterialIDs []string `json:"materialIds"`
}

func (h *Handler) CreateAddon(c *fiber.Ctx) error {
	var body addonBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	item := models.AddonPackage{
		ID: id.New(), Name: body.Name, Slug: body.Slug, Description: ptr(body.Description),
		Price: body.Price, TryoutBonus: body.TryoutBonus, ModuleBonus: body.ModuleBonus, IsActive: true,
	}
	if body.IsActive != nil {
		item.IsActive = *body.IsActive
	}
	h.DB.Create(&item)
	for _, mid := range body.MaterialIDs {
		h.DB.Create(&models.AddonPackageMaterial{ID: id.New(), AddonID: item.ID, MaterialID: mid})
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Created(c, addonView(item))
}

func (h *Handler) UpdateAddon(c *fiber.Ctx) error {
	var body addonBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "No data provided")
	}
	var item models.AddonPackage
	if err := h.DB.First(&item, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Addon tidak ditemukan")
	}
	updates := map[string]any{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.Slug != "" {
		updates["slug"] = body.Slug
	}
	if body.Description != "" {
		updates["description"] = body.Description
	}
	updates["price"] = body.Price
	updates["tryoutBonus"] = body.TryoutBonus
	updates["moduleBonus"] = body.ModuleBonus
	if body.IsActive != nil {
		updates["isActive"] = *body.IsActive
	}
	h.DB.Model(&item).Updates(updates)
	if body.MaterialIDs != nil {
		h.DB.Where(`"addonId" = ?`, item.ID).Delete(&models.AddonPackageMaterial{})
		for _, mid := range body.MaterialIDs {
			h.DB.Create(&models.AddonPackageMaterial{ID: id.New(), AddonID: item.ID, MaterialID: mid})
		}
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Success(c, addonView(item))
}

func (h *Handler) DeleteAddon(c *fiber.Ctx) error {
	h.DB.Where(`"addonId" = ?`, c.Params("id")).Delete(&models.AddonPackageMaterial{})
	h.DB.Delete(&models.AddonPackage{}, "id = ?", c.Params("id"))
	return noContent(c)
}

func (h *Handler) ListTransactions(c *fiber.Ctx) error {
	var items []models.Transaction
	h.DB.Preload("User").Preload("Package").Preload("Addon").Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) PatchTransaction(c *fiber.Ctx) error {
	return commerce.ApplyStatus(h.DB, c.Params("id"), c)
}

func (h *Handler) GetPayment(c *fiber.Ctx) error {
	var s models.PaymentSetting
	if err := h.DB.Order(`"updatedAt" DESC`).First(&s).Error; err != nil {
		return httpx.Success(c, fiber.Map{"bankName": "", "accountNumber": "", "accountHolder": ""})
	}
	return httpx.Success(c, s)
}

func (h *Handler) PutPayment(c *fiber.Ctx) error {
	var body models.PaymentSetting
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	var s models.PaymentSetting
	now := time.Now()
	if err := h.DB.First(&s).Error; err != nil {
		s = models.PaymentSetting{
			ID: id.New(), BankName: body.BankName, AccountNumber: body.AccountNumber,
			AccountHolder: body.AccountHolder, CreatedAt: now, UpdatedAt: now,
		}
		h.DB.Create(&s)
		return httpx.Success(c, s)
	}
	h.DB.Model(&s).Updates(map[string]any{
		"bankName": body.BankName, "accountNumber": body.AccountNumber,
		"accountHolder": body.AccountHolder, "updatedAt": now,
	})
	h.DB.First(&s, "id = ?", s.ID)
	return httpx.Success(c, s)
}

func (h *Handler) GrantTryout(c *fiber.Ctx) error {
	var body struct {
		UserID string `json:"userId"`
		Amount int    `json:"amount"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if body.Amount <= 0 {
		return httpx.New(400, "Jumlah kuota minimal 1.")
	}
	if body.Amount > 50 {
		return httpx.New(400, "Kuota gratis maksimal 50 sekaligus.")
	}
	trx, err := membershipActive(h, body.UserID)
	if err != nil {
		return httpx.New(404, "Member tidak memiliki membership aktif.")
	}
	if trx.TryoutQuota == 0 {
		return httpx.New(400, "Member ini sudah memiliki kuota tryout tak terbatas.")
	}
	h.DB.Model(trx).UpdateColumn("tryoutQuota", trx.TryoutQuota+body.Amount)
	h.DB.First(trx, "id = ?", trx.ID)
	remain := trx.TryoutQuota - trx.TryoutUsed
	if remain < 0 {
		remain = 0
	}
	return httpx.Success(c, fiber.Map{
		"transactionCode": trx.Code, "tryoutQuota": trx.TryoutQuota, "tryoutUsed": trx.TryoutUsed, "tryoutRemaining": remain,
	})
}

func membershipActive(h *Handler, userID string) (*models.Transaction, error) {
	now := time.Now()
	var trx models.Transaction
	err := h.DB.Where(`"userId" = ? AND status = ? AND type = ? AND "activatedAt" IS NOT NULL AND ("expiresAt" IS NULL OR "expiresAt" > ?)`,
		userID, "PAID", "MEMBERSHIP", now).Order(`"expiresAt" DESC`).First(&trx).Error
	if err != nil {
		return nil, err
	}
	return &trx, nil
}
