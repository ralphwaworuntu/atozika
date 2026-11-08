package membership

import (
	"time"

	"atozika/internal/httpx"
	"atozika/internal/jsonutil"
	"atozika/internal/models"

	"gorm.io/gorm"
)

func ActiveWhere(db *gorm.DB) *gorm.DB {
	now := time.Now()
	return db.Where(`status = ? AND type = ? AND "activatedAt" IS NOT NULL AND ("expiresAt" IS NULL OR "expiresAt" > ?)`, "PAID", "MEMBERSHIP", now)
}

func GetActive(db *gorm.DB, userID string) (*models.Transaction, error) {
	var trx models.Transaction
	err := ActiveWhere(db).Preload("Package").Preload("Package.Materials").Preload("Package.Materials.Material").
		Where(`"userId" = ?`, userID).Order(`"expiresAt" DESC NULLS LAST`).First(&trx).Error
	if err != nil {
		return nil, err
	}
	return &trx, nil
}

func IsPremium(db *gorm.DB, userID string) bool {
	var n int64
	ActiveWhere(db.Model(&models.Transaction{})).
		Joins(`JOIN "MembershipPackage" p ON p.id = "Transaction"."packageId"`).
		Where(`"Transaction"."userId" = ? AND p."accessAllPackages" = true`, userID).
		Count(&n)
	return n > 0
}

func AssertActive(db *gorm.DB, userID string) (*models.Transaction, error) {
	trx, err := GetActive(db, userID)
	if err != nil {
		return nil, httpx.New(403, "Membership tidak aktif atau belum divalidasi admin.", map[string]any{"code": "MEMBERSHIP_REQUIRED"})
	}
	return trx, nil
}

func AssertFeature(trx *models.Transaction, feature string, premium bool) error {
	if premium {
		return nil
	}
	if trx == nil {
		return nil
	}
	ok := true
	switch feature {
	case "TRYOUT":
		ok = trx.Package.AllowTryout
	case "PRACTICE":
		ok = trx.Package.AllowPractice
	case "CERMAT":
		ok = trx.Package.AllowCermat
	}
	if !ok {
		return httpx.New(403, "Paket Anda belum mencakup fitur ini.", map[string]any{"code": "FEATURE_DISABLED"})
	}
	return nil
}

func ConsumeTryout(db *gorm.DB, userID string) (*models.Transaction, error) {
	trx, err := AssertActive(db, userID)
	if err != nil {
		return nil, err
	}
	if err := AssertFeature(trx, "TRYOUT", false); err != nil {
		return nil, err
	}
	if trx.TryoutQuota == 0 {
		return trx, nil
	}
	if trx.TryoutUsed >= trx.TryoutQuota {
		return nil, httpx.New(403, "Kuota tryout Anda telah habis. Silakan perpanjang paket atau beli addon.", map[string]any{"code": "TRYOUT_QUOTA_EXHAUSTED"})
	}
	res := db.Model(&models.Transaction{}).Where(`id = ? AND "tryoutUsed" < "tryoutQuota"`, trx.ID).
		UpdateColumn("tryoutUsed", gorm.Expr(`"tryoutUsed" + 1`))
	if res.RowsAffected == 0 {
		return nil, httpx.New(403, "Kuota tryout Anda telah habis. Silakan perpanjang paket atau beli addon.", map[string]any{"code": "TRYOUT_QUOTA_EXHAUSTED"})
	}
	return trx, nil
}

func ConsumeCermat(db *gorm.DB, userID string) (*models.Transaction, error) {
	trx, err := AssertActive(db, userID)
	if err != nil {
		return nil, err
	}
	if err := AssertFeature(trx, "CERMAT", false); err != nil {
		return nil, err
	}
	if trx.CermatQuota == 0 {
		return trx, nil
	}
	if trx.CermatUsed >= trx.CermatQuota {
		return nil, httpx.New(403, "Token tes kecermatan Anda telah habis. Silakan hubungi admin atau perpanjang paket.", map[string]any{"code": "CERMAT_QUOTA_EXHAUSTED"})
	}
	res := db.Model(&models.Transaction{}).Where(`id = ? AND "cermatUsed" < "cermatQuota"`, trx.ID).
		UpdateColumn("cermatUsed", gorm.Expr(`"cermatUsed" + 1`))
	if res.RowsAffected == 0 {
		return nil, httpx.New(403, "Token tes kecermatan Anda telah habis. Silakan hubungi admin atau perpanjang paket.", map[string]any{"code": "CERMAT_QUOTA_EXHAUSTED"})
	}
	return trx, nil
}

// AllMaterialIDs lists every material; premium members may open all of them.
func AllMaterialIDs(db *gorm.DB) []string {
	ids := []string{}
	db.Model(&models.Material{}).Pluck("id", &ids)
	return ids
}

// EntitledMaterialIDs returns materials granted by the active membership's
// package plus every paid add-on attached to that membership.
func EntitledMaterialIDs(db *gorm.DB, trx *models.Transaction) []string {
	if trx == nil {
		return []string{}
	}
	ids := []string{}
	db.Model(&models.PackageMaterial{}).Where(`"packageId" = ?`, trx.PackageID).Pluck(`"materialId"`, &ids)
	addonIDs := []string{}
	db.Model(&models.AddonPackageMaterial{}).
		Joins(`JOIN "Transaction" t ON t."addonId" = "AddonPackageMaterial"."addonId"`).
		Where(`t."targetTransactionId" = ? AND t.type = ? AND t.status = ?`, trx.ID, "ADDON", "PAID").
		Pluck(`"AddonPackageMaterial"."materialId"`, &addonIDs)
	seen := map[string]struct{}{}
	out := []string{}
	for _, id := range append(ids, addonIDs...) {
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

// ConsumeModule records that a material was opened under the membership and
// spends one module quota the first time a limited membership opens it.
func ConsumeModule(db *gorm.DB, trx *models.Transaction, userID, materialID string, newID func() string) error {
	if trx == nil {
		return nil
	}
	return db.Transaction(func(tx *gorm.DB) error {
		ins := tx.Exec(`INSERT INTO "MaterialAccess" (id, "userId", "materialId", "transactionId", "createdAt")
			VALUES (?, ?, ?, ?, now()) ON CONFLICT ("userId", "materialId", "transactionId") DO NOTHING`,
			newID(), userID, materialID, trx.ID)
		if ins.Error != nil {
			return ins.Error
		}
		if ins.RowsAffected == 0 || trx.ModuleQuota == 0 {
			return nil
		}
		res := tx.Model(&models.Transaction{}).Where(`id = ? AND "moduleUsed" < "moduleQuota"`, trx.ID).
			UpdateColumn("moduleUsed", gorm.Expr(`"moduleUsed" + 1`))
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return httpx.New(403, "Kuota modul Anda telah habis. Silakan perpanjang paket atau beli addon.", map[string]any{"code": "MODULE_QUOTA_EXHAUSTED"})
		}
		return nil
	})
}

func FreeIDs(raw []byte) []string {
	return jsonutil.Strings(raw)
}
