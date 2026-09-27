package commerce

import (
	"strings"
	"time"

	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/jsonutil"
	"atozika/internal/membership"
	"atozika/internal/middleware"
	"atozika/internal/models"
	"atozika/internal/upload"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	DB     *gorm.DB
	Upload string
}

func (h *Handler) Packages(c *fiber.Ctx) error {
	lh := landingish{h.DB}
	return lh.packages(c)
}

type landingish struct{ DB *gorm.DB }

func (l landingish) packages(c *fiber.Ctx) error {
	var packages []models.MembershipPackage
	l.DB.Where(`"isActive" = true`).Preload("Materials").Preload("Materials.Material").Order("price ASC").Find(&packages)
	out := []fiber.Map{}
	for _, p := range packages {
		ids := []string{}
		for _, m := range p.Materials {
			ids = append(ids, m.MaterialID)
		}
		out = append(out, fiber.Map{
			"id": p.ID, "name": p.Name, "slug": p.Slug, "category": p.Category, "tagline": p.Tagline,
			"description": p.Description, "price": p.Price, "durationDays": p.DurationDays, "badgeLabel": p.BadgeLabel,
			"features": jsonutil.Strings(p.Features), "tryoutQuota": p.TryoutQuota, "moduleQuota": p.ModuleQuota,
			"allowTryout": p.AllowTryout, "allowPractice": p.AllowPractice, "allowCermat": p.AllowCermat,
			"accessAllPackages": p.AccessAllPackages, "isActive": p.IsActive, "materialIds": ids, "materialCount": len(ids),
		})
	}
	return httpx.Success(c, out)
}

func (h *Handler) PaymentInfo(c *fiber.Ctx) error {
	var s models.PaymentSetting
	if err := h.DB.First(&s).Error; err != nil {
		s = models.PaymentSetting{ID: id.New(), BankName: "BCA", AccountNumber: "0000000000", AccountHolder: "ATOZIKA", CreatedAt: time.Now(), UpdatedAt: time.Now()}
		h.DB.Create(&s)
	}
	return httpx.Success(c, s)
}

func (h *Handler) Addons(c *fiber.Ctx) error {
	var addons []models.AddonPackage
	h.DB.Where(`"isActive" = true`).Preload("Materials").Preload("Materials.Material").Order("price ASC").Find(&addons)
	out := []fiber.Map{}
	for _, a := range addons {
		ids := []string{}
		for _, m := range a.Materials {
			ids = append(ids, m.MaterialID)
		}
		out = append(out, fiber.Map{
			"id": a.ID, "name": a.Name, "slug": a.Slug, "description": a.Description, "price": a.Price,
			"tryoutBonus": a.TryoutBonus, "moduleBonus": a.ModuleBonus, "isActive": a.IsActive, "materialIds": ids,
		})
	}
	return httpx.Success(c, out)
}

func (h *Handler) MembershipStatus(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	trx, err := membership.GetActive(h.DB, uid)
	if err != nil || trx == nil {
		return httpx.Success(c, fiber.Map{"isActive": false})
	}
	premium := membership.IsPremium(h.DB, uid)
	tryoutRem := any(nil)
	if trx.TryoutQuota > 0 {
		v := trx.TryoutQuota - trx.TryoutUsed
		if v < 0 {
			v = 0
		}
		tryoutRem = v
	}
	moduleRem := any(nil)
	if trx.ModuleQuota > 0 {
		v := trx.ModuleQuota - trx.ModuleUsed
		if v < 0 {
			v = 0
		}
		moduleRem = v
	}
	matIDs := membership.MaterialIDs(trx)
	if premium {
		matIDs = membership.AllMaterialIDs(h.DB, uid)
	}
	pkgName := trx.Package.Name
	if premium {
		pkgName = "Premium All Access"
	}
	return httpx.Success(c, fiber.Map{
		"isActive": true, "isPremium": premium, "expiresAt": trx.ExpiresAt, "packageName": pkgName,
		"packageId": trx.PackageID, "transactionCode": trx.Code, "transactionId": trx.ID,
		"allowTryout": premium || trx.Package.AllowTryout, "allowPractice": premium || trx.Package.AllowPractice,
		"allowCermat": premium || trx.Package.AllowCermat,
		"tryoutQuota": trx.TryoutQuota, "tryoutUsed": trx.TryoutUsed, "tryoutRemaining": tryoutRem,
		"moduleQuota": trx.ModuleQuota, "moduleUsed": trx.ModuleUsed, "moduleRemaining": moduleRem,
		"allowedMaterialIds": matIDs,
	})
}

func (h *Handler) Create(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var body map[string]any
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	typ, _ := body["type"].(string)
	method, _ := body["method"].(string)
	if len(method) < 3 {
		return httpx.New(400, "Metode pembayaran wajib diisi")
	}
	desc, _ := body["description"].(string)
	now := time.Now()
	if typ == "ADDON" {
		addonID, _ := body["addonId"].(string)
		targetID, _ := body["targetTransactionId"].(string)
		var addon models.AddonPackage
		if err := h.DB.First(&addon, "id = ? AND \"isActive\" = true", addonID).Error; err != nil {
			return httpx.New(404, "Addon tidak ditemukan")
		}
		var membershipTrx models.Transaction
		if err := h.DB.Where("id = ? AND \"userId\" = ? AND status = ? AND type = ? AND \"expiresAt\" > ?", targetID, uid, "PAID", "MEMBERSHIP", now).First(&membershipTrx).Error; err != nil {
			return httpx.New(400, "Membership aktif tidak ditemukan untuk addon ini")
		}
		trx := models.Transaction{
			ID: id.New(), Code: "ADD-" + strings.ToUpper(id.New()[len(id.New())-8:]), UserID: uid,
			PackageID: membershipTrx.PackageID, AddonID: &addon.ID, TargetTransactionID: &membershipTrx.ID,
			Amount: addon.Price, Method: method, Type: "ADDON", Status: "PENDING", Description: strPtr(desc),
			CreatedAt: now, UpdatedAt: now,
		}
		if err := h.DB.Create(&trx).Error; err != nil {
			trx.Code = "ADD-" + strings.ToUpper(random8())
			h.DB.Create(&trx)
		}
		h.DB.Preload("Addon").Preload("Package").First(&trx, "id = ?", trx.ID)
		return httpx.Success(c, trx)
	}
	packageID, _ := body["packageId"].(string)
	var pkg models.MembershipPackage
	if err := h.DB.First(&pkg, "id = ? AND \"isActive\" = true", packageID).Error; err != nil {
		return httpx.New(404, "Paket tidak ditemukan")
	}
	trx := models.Transaction{
		ID: id.New(), Code: "TRX-" + strings.ToUpper(random8()), UserID: uid, PackageID: pkg.ID,
		Amount: pkg.Price, Method: method, Type: "MEMBERSHIP", Status: "PENDING", Description: strPtr(desc),
		CreatedAt: now, UpdatedAt: now,
	}
	if err := h.DB.Create(&trx).Error; err != nil {
		return err
	}
	h.DB.Preload("Package").First(&trx, "id = ?", trx.ID)
	return httpx.Success(c, trx)
}

func (h *Handler) Confirm(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	code := c.Params("code")
	var trx models.Transaction
	if err := h.DB.Where("code = ? AND \"userId\" = ?", code, uid).First(&trx).Error; err != nil {
		return httpx.New(404, "Transaksi tidak ditemukan")
	}
	if trx.Status == "PAID" {
		return httpx.New(400, "Transaksi sudah dikonfirmasi admin")
	}
	saved, err := upload.Save(c, "proof", h.Upload+"/payments/"+uid, "uploads/payments/"+uid, 5<<20, upload.Proof)
	if err != nil {
		return err
	}
	if saved == nil {
		return httpx.New(400, "Bukti pembayaran wajib diunggah")
	}
	desc := c.FormValue("description")
	updates := map[string]any{"proofUrl": saved.PublicURL, "updatedAt": time.Now()}
	if desc != "" {
		updates["description"] = desc
	}
	h.DB.Model(&trx).Updates(updates)
	h.DB.First(&trx, "id = ?", trx.ID)
	return httpx.Success(c, trx)
}

func (h *Handler) List(c *fiber.Ctx) error {
	uid := middleware.Current(c).ID
	var items []models.Transaction
	h.DB.Preload("Package").Preload("Addon").Where(`"userId" = ?`, uid).Order(`"createdAt" DESC`).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) AdminPatch(c *fiber.Ctx) error {
	return ApplyStatus(h.DB, c.Params("id"), c)
}

func ApplyStatus(db *gorm.DB, idStr string, c *fiber.Ctx) error {
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	if body.Status != "PENDING" && body.Status != "PAID" && body.Status != "REJECTED" {
		return httpx.New(400, "Status tidak valid")
	}
	trx, err := MarkStatus(db, idStr, body.Status)
	if err != nil {
		return err
	}
	return httpx.Success(c, trx)
}

func MarkStatus(db *gorm.DB, trxID, status string) (*models.Transaction, error) {
	var trx models.Transaction
	if err := db.Preload("Package").Preload("Addon").First(&trx, "id = ?", trxID).Error; err != nil {
		return nil, httpx.New(404, "Transaksi tidak ditemukan")
	}
	now := time.Now()
	if trx.Type == "ADDON" {
		if status == "PAID" {
			if trx.AddonID == nil || trx.TargetTransactionID == nil {
				return nil, httpx.New(400, "Addon tidak memiliki target membership")
			}
			var addon models.AddonPackage
			db.First(&addon, "id = ?", *trx.AddonID)
			var target models.Transaction
			db.First(&target, "id = ?", *trx.TargetTransactionID)
			db.Model(&trx).Updates(map[string]any{"status": status, "activatedAt": now, "expiresAt": target.ExpiresAt, "updatedAt": now})
			if addon.TryoutBonus > 0 {
				db.Model(&models.Transaction{}).Where("id = ?", target.ID).UpdateColumn("tryoutQuota", gorm.Expr(`"tryoutQuota" + ?`, addon.TryoutBonus))
			}
			if addon.ModuleBonus > 0 {
				db.Model(&models.Transaction{}).Where("id = ?", target.ID).UpdateColumn("moduleQuota", gorm.Expr(`"moduleQuota" + ?`, addon.ModuleBonus))
			}
		} else {
			db.Model(&trx).Updates(map[string]any{"status": status, "updatedAt": now})
		}
		db.Preload("Addon").First(&trx, "id = ?", trx.ID)
		return &trx, nil
	}
	updates := map[string]any{"status": status, "updatedAt": now}
	if status == "PAID" {
		exp := now.Add(time.Duration(trx.Package.DurationDays) * 24 * time.Hour)
		updates["activatedAt"] = now
		updates["expiresAt"] = exp
		updates["tryoutQuota"] = trx.Package.TryoutQuota
		updates["tryoutUsed"] = 0
		updates["moduleQuota"] = trx.Package.ModuleQuota
		updates["moduleUsed"] = 0
	} else {
		updates["activatedAt"] = nil
		updates["expiresAt"] = nil
	}
	db.Model(&trx).Updates(updates)
	db.First(&trx, "id = ?", trx.ID)
	return &trx, nil
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func random8() string {
	s := id.New()
	if len(s) >= 8 {
		return s[len(s)-8:]
	}
	return s
}
