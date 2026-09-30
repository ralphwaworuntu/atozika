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
	ActiveWhere(db).Joins(`JOIN "MembershipPackage" p ON p.id = "Transaction"."packageId"`).
		Where(`"Transaction"."userId" = ? AND p."accessAllPackages" = true`, userID).Count(&n)
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

func MaterialIDs(trx *models.Transaction) []string {
	if trx == nil {
		return nil
	}
	ids := make([]string, 0)
	for _, m := range trx.Package.Materials {
		ids = append(ids, m.MaterialID)
	}
	return ids
}

func AllMaterialIDs(db *gorm.DB, userID string) []string {
	var rows []models.PackageMaterial
	ActiveWhere(db).Select(`"Transaction".id`).Where(`"userId" = ?`, userID)
	db.Table(`"PackageMaterial"`).
		Joins(`JOIN "Transaction" t ON t."packageId" = "PackageMaterial"."packageId"`).
		Where(`t."userId" = ? AND t.status = 'PAID' AND t.type = 'MEMBERSHIP'`, userID).
		Find(&rows)
	seen := map[string]struct{}{}
	out := []string{}
	for _, r := range rows {
		if _, ok := seen[r.MaterialID]; ok {
			continue
		}
		seen[r.MaterialID] = struct{}{}
		out = append(out, r.MaterialID)
	}
	_ = jsonutil.Strings(nil)
	return out
}

func FreeIDs(raw []byte) []string {
	return jsonutil.Strings(raw)
}
