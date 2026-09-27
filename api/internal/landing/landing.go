package landing

import (
	"fmt"
	"strings"

	"atozika/internal/httpx"
	"atozika/internal/jsonutil"
	"atozika/internal/membership"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }

func (h *Handler) setting(key, fallback string) string {
	var s models.SiteSetting
	if err := h.DB.Where(`key = ?`, key).First(&s).Error; err != nil {
		return fallback
	}
	return s.Value
}

func (h *Handler) contact() fiber.Map {
	wa := h.setting("whatsapp_primary", "6281234567890")
	return fiber.Map{
		"email":           h.setting("company_email", "hallo@atozika.id"),
		"whatsappPrimary": wa,
		"whatsappConsult": h.setting("whatsapp_consult", wa),
		"companyAddress":  h.setting("company_address", "Alamat perusahaan belum diatur"),
	}
}

func publicURL(path, base string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if base == "" {
		return path
	}
	return strings.TrimRight(base, "/") + path
}

func (h *Handler) Home(c *fiber.Ctx) error {
	host := c.Get("Host")
	base := ""
	if host != "" {
		base = fmt.Sprintf("%s://%s", c.Protocol(), host)
	}
	var stats []models.LandingStat
	h.DB.Find(&stats)
	var packages []models.MembershipPackage
	h.DB.Where(`"isActive" = true`).Limit(6).Find(&packages)
	var testimonials []models.Testimonial
	h.DB.Limit(6).Find(&testimonials)
	var videos []models.YoutubeVideo
	h.DB.Limit(6).Find(&videos)
	heroPath := h.setting("hero_image", "/Alumni.png")
	heroURL := publicURL(heroPath, base)
	if heroURL == "" {
		heroURL = "/Alumni.png"
	}
	var slides []models.HeroSlide
	h.DB.Order(`"order" ASC, "createdAt" ASC`).Find(&slides)
	slideOut := []fiber.Map{}
	if len(slides) == 0 {
		slideOut = append(slideOut, fiber.Map{"id": "fallback", "imageUrl": heroURL})
	} else {
		for _, s := range slides {
			u := publicURL(s.ImageURL, base)
			if u == "" {
				u = heroURL
			}
			slideOut = append(slideOut, fiber.Map{"id": s.ID, "imageUrl": u})
		}
	}
	pkgOut := []fiber.Map{}
	for _, p := range packages {
		pkgOut = append(pkgOut, fiber.Map{
			"id": p.ID, "name": p.Name, "category": p.Category, "price": p.Price,
			"description": p.Description, "badgeLabel": p.BadgeLabel,
		})
	}
	if len(stats) == 0 {
		stats = []models.LandingStat{
			{Label: "Materi Video", Value: 1200}, {Label: "Soal Try Out", Value: 4500},
			{Label: "Jumlah Alumni", Value: 724}, {Label: "Modul Interaktif", Value: 35},
		}
	}
	reasons := []string{
		"Pembentukan karakter kepemimpinan dan integritas, bukan sekadar hapalan soal.",
		"Bank soal terstandardisasi CAT untuk TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.",
		"Kurikulum taktis sesuai kisi resmi dan pola seleksi institusi elit.",
		"Simulasi ujian berdisiplin: timer, anti-cheat, dan evaluasi berkala.",
		"Laporan progres untuk orang tua serta pendampingan mentor berpengalaman.",
	}
	return httpx.Success(c, fiber.Map{
		"hero": fiber.Map{
			"title":        "Menempa Intelektual, Mengunci Kelulusan.",
			"subtitle":     "Akademi Taktis Optimasi Integritas, Intelektual, dan Kepemimpinan. Persiapan elit, berstandar tinggi, dan terstruktur.",
			"ctaPrimary":   fiber.Map{"label": "Gabung Sekarang", "href": "/auth/register"},
			"ctaSecondary": fiber.Map{"label": "Paket Bimbel", "href": "/paket-bimbel"},
			"imageUrl":     heroURL,
			"slides":       slideOut,
		},
		"stats":        stats,
		"reasons":      reasons,
		"packages":     pkgOut,
		"testimonials": testimonials,
		"videos":       videos,
		"contact":      h.contact(),
	})
}

func (h *Handler) Profile(c *fiber.Ctx) error {
	return httpx.Success(c, fiber.Map{
		"title": "Profil Lembaga",
		"body":  "ATOZIKA (Akademi Taktis Optimasi Zona Integritas, Kepemimpinan & Aparatur) berfokus pada pembentukan karakter kepemimpinan, daya saing intelektual, dan persiapan ujian kompetensi tinggi untuk posisi strategis di institusi pemerintahan, perbankan nasional, hingga panggung politik.\n\nKami menempa peserta dengan standar elit: disiplin, tegas, taktis, dan berintegritas tinggi — tepat untuk lulusan yang mengejar karier di Bank Indonesia, BUMN, sekolah kedinasan favorit, TNI, Polri, dan CPNS.",
		"highlights": []string{
			"Citra taktis, tegas, disiplin, dan berintegritas tinggi.",
			"Kurikulum terstruktur untuk seleksi TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.",
			"Satu dashboard: tryout, latihan soal, tes kecermatan, materi, dan transaksi.",
		},
	})
}

func (h *Handler) Packages(c *fiber.Ctx) error {
	var packages []models.MembershipPackage
	h.DB.Where(`"isActive" = true`).Preload("Materials").Preload("Materials.Material").Order("price ASC").Find(&packages)
	out := []fiber.Map{}
	for _, p := range packages {
		features := jsonutil.Strings(p.Features)
		ids := []string{}
		for _, m := range p.Materials {
			ids = append(ids, m.MaterialID)
		}
		out = append(out, fiber.Map{
			"id": p.ID, "name": p.Name, "slug": p.Slug, "category": p.Category, "tagline": p.Tagline,
			"description": p.Description, "price": p.Price, "durationDays": p.DurationDays,
			"badgeLabel": p.BadgeLabel, "features": features, "tryoutQuota": p.TryoutQuota,
			"moduleQuota": p.ModuleQuota, "allowTryout": p.AllowTryout, "allowPractice": p.AllowPractice,
			"allowCermat": p.AllowCermat, "accessAllPackages": p.AccessAllPackages, "isActive": p.IsActive,
			"materialIds": ids, "materialCount": len(ids),
		})
	}
	return httpx.Success(c, out)
}

func (h *Handler) Gallery(c *fiber.Ctx) error {
	var alumni, activities []models.GalleryItem
	h.DB.Where("kind = ?", "ALUMNI").Limit(12).Find(&alumni)
	h.DB.Where("kind = ?", "AKTIVITAS").Limit(12).Find(&activities)
	return httpx.Success(c, fiber.Map{"alumni": alumni, "activities": activities})
}

func (h *Handler) Testimonials(c *fiber.Ctx) error {
	var items []models.Testimonial
	h.DB.Limit(12).Find(&items)
	return httpx.Success(c, items)
}

func (h *Handler) ContactInfo(c *fiber.Ctx) error {
	return httpx.Success(c, h.contact())
}

func (h *Handler) Parent(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var area models.MemberArea
	if err := h.DB.Where("slug = ?", slug).First(&area).Error; err != nil {
		return httpx.New(404, "Data member tidak ditemukan")
	}
	var user models.User
	h.DB.First(&user, "id = ?", area.UserID)
	trx, _ := membership.GetActive(h.DB, user.ID)
	var tryouts []models.TryoutResult
	h.DB.Preload("Tryout").Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Limit(5).Find(&tryouts)
	var practices []models.PracticeResult
	h.DB.Preload("Set").Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Limit(5).Find(&practices)
	var cermat []models.CermatSession
	h.DB.Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Limit(5).Find(&cermat)
	tryoutOut := []fiber.Map{}
	for _, t := range tryouts {
		tryoutOut = append(tryoutOut, fiber.Map{"score": t.Score, "createdAt": t.CreatedAt, "tryout": fiber.Map{"name": t.Tryout.Name}})
	}
	practiceOut := []fiber.Map{}
	for _, p := range practices {
		practiceOut = append(practiceOut, fiber.Map{"score": p.Score, "createdAt": p.CreatedAt, "set": fiber.Map{"title": p.Set.Title}})
	}
	cermatOut := []fiber.Map{}
	for _, s := range cermat {
		cermatOut = append(cermatOut, fiber.Map{"correctCount": s.CorrectCount, "totalQuestions": s.TotalQuestions, "createdAt": s.CreatedAt})
	}
	var membershipOut any
	if trx != nil {
		membershipOut = fiber.Map{"packageName": trx.Package.Name, "activatedAt": trx.ActivatedAt, "expiresAt": trx.ExpiresAt}
	}
	return httpx.Success(c, fiber.Map{
		"member":     fiber.Map{"name": user.Name, "avatarUrl": user.AvatarURL, "joinedAt": user.CreatedAt},
		"membership": membershipOut,
		"tryouts":    tryoutOut, "practices": practiceOut, "cermat": cermatOut,
	})
}
