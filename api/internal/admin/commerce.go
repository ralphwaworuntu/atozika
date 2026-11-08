package admin

import (
	"strings"
	"time"

	"atozika/internal/commerce"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
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
	q := h.DB.Preload("Materials").Order(`"isActive" DESC, price ASC`)
	if c.Query("active") == "true" {
		q = q.Where(`"isActive" = ?`, true)
	}
	q.Find(&items)
	out := []fiber.Map{}
	for _, p := range items {
		out = append(out, packageView(p))
	}
	return httpx.Success(c, out)
}

type packageBody struct {
	Name              *string  `json:"name"`
	Slug              *string  `json:"slug"`
	Category          *string  `json:"category"`
	Tagline           *string  `json:"tagline"`
	Description       *string  `json:"description"`
	Price             *int     `json:"price"`
	DurationDays      *int     `json:"durationDays"`
	BadgeLabel        *string  `json:"badgeLabel"`
	Features          []string `json:"features"`
	TryoutQuota       *int     `json:"tryoutQuota"`
	ModuleQuota       *int     `json:"moduleQuota"`
	CermatQuota       *int     `json:"cermatQuota"`
	AllowTryout       *bool    `json:"allowTryout"`
	AllowPractice     *bool    `json:"allowPractice"`
	AllowCermat       *bool    `json:"allowCermat"`
	AccessAllPackages *bool    `json:"accessAllPackages"`
	IsActive          *bool    `json:"isActive"`
	MaterialIDs       []string `json:"materialIds"`
}

func trimPtr(s *string) string {
	if s == nil {
		return ""
	}
	return strings.TrimSpace(*s)
}

func nonNegative(fields map[string]*int) error {
	for label, v := range fields {
		if v != nil && *v < 0 {
			return httpx.New(400, label+" tidak boleh negatif")
		}
	}
	return nil
}

func (h *Handler) validMaterialIDs(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	var n int64
	h.DB.Model(&models.Material{}).Where("id IN ?", ids).Count(&n)
	if int(n) != len(uniqueStrings(ids)) {
		return httpx.New(400, "Materi yang dipilih tidak ditemukan")
	}
	return nil
}

func uniqueStrings(in []string) []string {
	seen := map[string]struct{}{}
	out := []string{}
	for _, s := range in {
		if _, ok := seen[s]; ok || s == "" {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}

func (h *Handler) slugTaken(model any, slug, exceptID string) bool {
	var n int64
	q := h.DB.Model(model).Where("slug = ?", slug)
	if exceptID != "" {
		q = q.Where("id <> ?", exceptID)
	}
	q.Count(&n)
	return n > 0
}

func (h *Handler) packageInput(body packageBody) error {
	if err := nonNegative(map[string]*int{
		"Harga": body.Price, "Durasi": body.DurationDays, "Kuota tryout": body.TryoutQuota,
		"Kuota modul": body.ModuleQuota, "Kuota kecermatan": body.CermatQuota,
	}); err != nil {
		return err
	}
	return h.validMaterialIDs(body.MaterialIDs)
}

func (h *Handler) CreatePackage(c *fiber.Ctx) error {
	var body packageBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if err := h.packageInput(body); err != nil {
		return err
	}
	name, slug := trimPtr(body.Name), trimPtr(body.Slug)
	if name == "" || slug == "" {
		return httpx.New(400, "Nama dan slug paket wajib diisi")
	}
	if body.DurationDays == nil || *body.DurationDays <= 0 {
		return httpx.New(400, "Durasi paket minimal 1 hari")
	}
	if h.slugTaken(&models.MembershipPackage{}, slug, "") {
		return httpx.New(409, "Slug paket sudah dipakai")
	}
	intOr := func(v *int) int {
		if v == nil {
			return 0
		}
		return *v
	}
	features := body.Features
	if features == nil {
		features = []string{}
	}
	item := models.MembershipPackage{
		ID: id.New(), Name: name, Slug: slug, Category: trimPtr(body.Category),
		Tagline: ptr(trimPtr(body.Tagline)), Description: trimPtr(body.Description), Price: intOr(body.Price),
		DurationDays: *body.DurationDays, BadgeLabel: ptr(trimPtr(body.BadgeLabel)),
		Features: jsonutil.MustJSON(features), TryoutQuota: intOr(body.TryoutQuota), ModuleQuota: intOr(body.ModuleQuota),
		CermatQuota: intOr(body.CermatQuota),
		AllowTryout: true, AllowPractice: true, AllowCermat: true, IsActive: true,
	}
	for dst, src := range map[*bool]*bool{
		&item.AllowTryout: body.AllowTryout, &item.AllowPractice: body.AllowPractice, &item.AllowCermat: body.AllowCermat,
		&item.AccessAllPackages: body.AccessAllPackages, &item.IsActive: body.IsActive,
	} {
		if src != nil {
			*dst = *src
		}
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		for _, mid := range uniqueStrings(body.MaterialIDs) {
			if err := tx.Create(&models.PackageMaterial{ID: id.New(), PackageID: item.ID, MaterialID: mid}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
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
	if err := h.packageInput(body); err != nil {
		return err
	}
	updates := map[string]any{}
	if body.Name != nil {
		if trimPtr(body.Name) == "" {
			return httpx.New(400, "Nama paket wajib diisi")
		}
		updates["name"] = trimPtr(body.Name)
	}
	if body.Slug != nil {
		slug := trimPtr(body.Slug)
		if slug == "" {
			return httpx.New(400, "Slug paket wajib diisi")
		}
		if h.slugTaken(&models.MembershipPackage{}, slug, item.ID) {
			return httpx.New(409, "Slug paket sudah dipakai")
		}
		updates["slug"] = slug
	}
	if body.Category != nil {
		updates["category"] = trimPtr(body.Category)
	}
	if body.Description != nil {
		updates["description"] = trimPtr(body.Description)
	}
	if body.Tagline != nil {
		updates["tagline"] = ptr(trimPtr(body.Tagline))
	}
	if body.BadgeLabel != nil {
		updates["badgeLabel"] = ptr(trimPtr(body.BadgeLabel))
	}
	if body.Price != nil {
		updates["price"] = *body.Price
	}
	if body.DurationDays != nil {
		if *body.DurationDays <= 0 {
			return httpx.New(400, "Durasi paket minimal 1 hari")
		}
		updates["durationDays"] = *body.DurationDays
	}
	if body.Features != nil {
		updates["features"] = jsonutil.MustJSON(body.Features)
	}
	for col, v := range map[string]*int{"tryoutQuota": body.TryoutQuota, "moduleQuota": body.ModuleQuota, "cermatQuota": body.CermatQuota} {
		if v != nil {
			updates[col] = *v
		}
	}
	for col, v := range map[string]*bool{
		"allowTryout": body.AllowTryout, "allowPractice": body.AllowPractice, "allowCermat": body.AllowCermat,
		"accessAllPackages": body.AccessAllPackages, "isActive": body.IsActive,
	} {
		if v != nil {
			updates[col] = *v
		}
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(&item).Updates(updates).Error; err != nil {
				return err
			}
		}
		if body.MaterialIDs != nil {
			if err := tx.Where(`"packageId" = ?`, item.ID).Delete(&models.PackageMaterial{}).Error; err != nil {
				return err
			}
			for _, mid := range uniqueStrings(body.MaterialIDs) {
				if err := tx.Create(&models.PackageMaterial{ID: id.New(), PackageID: item.ID, MaterialID: mid}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Success(c, packageView(item))
}

func (h *Handler) DeletePackage(c *fiber.Ctx) error {
	var used int64
	h.DB.Model(&models.Transaction{}).Where(`"packageId" = ?`, c.Params("id")).Count(&used)
	if used > 0 {
		return httpx.New(409, "Paket sudah dipakai transaksi member. Nonaktifkan paket agar riwayat transaksi tetap utuh.")
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(`"packageId" = ?`, c.Params("id")).Delete(&models.PackageMaterial{}).Error; err != nil {
			return err
		}
		res := tx.Delete(&models.MembershipPackage{}, "id = ?", c.Params("id"))
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return httpx.New(404, "Paket tidak ditemukan")
		}
		return nil
	})
	if err != nil {
		return err
	}
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
	Name        *string  `json:"name"`
	Slug        *string  `json:"slug"`
	Description *string  `json:"description"`
	Price       *int     `json:"price"`
	TryoutBonus *int     `json:"tryoutBonus"`
	ModuleBonus *int     `json:"moduleBonus"`
	IsActive    *bool    `json:"isActive"`
	MaterialIDs []string `json:"materialIds"`
}

func (h *Handler) addonInput(body addonBody) error {
	if err := nonNegative(map[string]*int{"Harga": body.Price, "Bonus tryout": body.TryoutBonus, "Bonus modul": body.ModuleBonus}); err != nil {
		return err
	}
	return h.validMaterialIDs(body.MaterialIDs)
}

func (h *Handler) replaceAddonMaterials(tx *gorm.DB, addonID string, ids []string) error {
	if err := tx.Where(`"addonId" = ?`, addonID).Delete(&models.AddonPackageMaterial{}).Error; err != nil {
		return err
	}
	for _, mid := range uniqueStrings(ids) {
		if err := tx.Create(&models.AddonPackageMaterial{ID: id.New(), AddonID: addonID, MaterialID: mid}).Error; err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) CreateAddon(c *fiber.Ctx) error {
	var body addonBody
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if err := h.addonInput(body); err != nil {
		return err
	}
	name, slug := trimPtr(body.Name), trimPtr(body.Slug)
	if name == "" || slug == "" {
		return httpx.New(400, "Nama dan slug addon wajib diisi")
	}
	if h.slugTaken(&models.AddonPackage{}, slug, "") {
		return httpx.New(409, "Slug addon sudah dipakai")
	}
	intOr := func(v *int) int {
		if v == nil {
			return 0
		}
		return *v
	}
	item := models.AddonPackage{
		ID: id.New(), Name: name, Slug: slug, Description: ptr(trimPtr(body.Description)),
		Price: intOr(body.Price), TryoutBonus: intOr(body.TryoutBonus), ModuleBonus: intOr(body.ModuleBonus), IsActive: true,
	}
	if body.IsActive != nil {
		item.IsActive = *body.IsActive
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		return h.replaceAddonMaterials(tx, item.ID, body.MaterialIDs)
	})
	if err != nil {
		return err
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
	if err := h.addonInput(body); err != nil {
		return err
	}
	updates := map[string]any{}
	if body.Name != nil {
		if trimPtr(body.Name) == "" {
			return httpx.New(400, "Nama addon wajib diisi")
		}
		updates["name"] = trimPtr(body.Name)
	}
	if body.Slug != nil {
		slug := trimPtr(body.Slug)
		if slug == "" {
			return httpx.New(400, "Slug addon wajib diisi")
		}
		if h.slugTaken(&models.AddonPackage{}, slug, item.ID) {
			return httpx.New(409, "Slug addon sudah dipakai")
		}
		updates["slug"] = slug
	}
	if body.Description != nil {
		updates["description"] = ptr(trimPtr(body.Description))
	}
	for col, v := range map[string]*int{"price": body.Price, "tryoutBonus": body.TryoutBonus, "moduleBonus": body.ModuleBonus} {
		if v != nil {
			updates[col] = *v
		}
	}
	if body.IsActive != nil {
		updates["isActive"] = *body.IsActive
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(&item).Updates(updates).Error; err != nil {
				return err
			}
		}
		if body.MaterialIDs != nil {
			return h.replaceAddonMaterials(tx, item.ID, body.MaterialIDs)
		}
		return nil
	})
	if err != nil {
		return err
	}
	h.DB.Preload("Materials").First(&item, "id = ?", item.ID)
	return httpx.Success(c, addonView(item))
}

func (h *Handler) DeleteAddon(c *fiber.Ctx) error {
	var used int64
	h.DB.Model(&models.Transaction{}).Where(`"addonId" = ?`, c.Params("id")).Count(&used)
	if used > 0 {
		return httpx.New(409, "Addon sudah dipakai transaksi member. Nonaktifkan addon agar riwayat transaksi tetap utuh.")
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(`"addonId" = ?`, c.Params("id")).Delete(&models.AddonPackageMaterial{}).Error; err != nil {
			return err
		}
		res := tx.Delete(&models.AddonPackage{}, "id = ?", c.Params("id"))
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return httpx.New(404, "Addon tidak ditemukan")
		}
		return nil
	})
	if err != nil {
		return err
	}
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
	if err := h.DB.Model(trx).UpdateColumn("tryoutQuota", gorm.Expr(`"tryoutQuota" + ?`, body.Amount)).Error; err != nil {
		return err
	}
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
