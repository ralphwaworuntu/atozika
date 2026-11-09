package admin

import (
	"bufio"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"atozika/internal/auth"
	"atozika/internal/examcsv"
	"atozika/internal/httpx"
	"atozika/internal/id"
	"atozika/internal/materials"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var startedAt = time.Now()

type rankAcc struct {
	User          fiber.Map
	TryoutCount   int
	TryoutTotal   float64
	PracticeCount int
	PracticeTotal float64
	CermatCount   int
	CermatTotal   float64
}

func (h *Handler) rankingData(c *fiber.Ctx) (fiber.Map, error) {
	var tryouts []models.TryoutResult
	var practices []models.PracticeResult
	var cermat []models.CermatAttempt
	applyDates(h.DB.Preload("User").Preload("Tryout").Where("score IS NOT NULL AND mode = ?", "REGULAR"), `"createdAt"`, c).Order(`"createdAt" DESC`).Find(&tryouts)
	applyDates(h.DB.Preload("User").Preload("Set").Where("score IS NOT NULL AND mode = ?", "REGULAR"), `"createdAt"`, c).Order(`"createdAt" DESC`).Find(&practices)
	applyDates(h.DB.Preload("User").Where(`"averageScore" IS NOT NULL`), `"startedAt"`, c).Order(`"startedAt" DESC`).Find(&cermat)

	acc := map[string]*rankAcc{}
	ensure := func(uid string, user models.User) *rankAcc {
		if a, ok := acc[uid]; ok {
			return a
		}
		a := &rankAcc{User: fiber.Map{"id": user.ID, "name": user.Name, "email": user.Email}}
		acc[uid] = a
		return a
	}
	for _, r := range tryouts {
		if r.Score == nil {
			continue
		}
		a := ensure(r.UserID, r.User)
		a.TryoutCount++
		a.TryoutTotal += *r.Score
	}
	for _, r := range practices {
		if r.Score == nil {
			continue
		}
		a := ensure(r.UserID, r.User)
		a.PracticeCount++
		a.PracticeTotal += *r.Score
	}
	for _, r := range cermat {
		if r.AverageScore == nil {
			continue
		}
		a := ensure(r.UserID, r.User)
		a.CermatCount++
		a.CermatTotal += *r.AverageScore
	}
	summary := []fiber.Map{}
	for _, a := range acc {
		totalCount := a.TryoutCount + a.PracticeCount + a.CermatCount
		totalScore := a.TryoutTotal + a.PracticeTotal + a.CermatTotal
		item := fiber.Map{
			"user": a.User, "tryoutCount": a.TryoutCount, "practiceCount": a.PracticeCount, "cermatCount": a.CermatCount,
			"tryoutAvg": 0.0, "practiceAvg": 0.0, "cermatAvg": 0.0, "overallAvg": 0.0,
		}
		if a.TryoutCount > 0 {
			item["tryoutAvg"] = a.TryoutTotal / float64(a.TryoutCount)
		}
		if a.PracticeCount > 0 {
			item["practiceAvg"] = a.PracticeTotal / float64(a.PracticeCount)
		}
		if a.CermatCount > 0 {
			item["cermatAvg"] = a.CermatTotal / float64(a.CermatCount)
		}
		if totalCount > 0 {
			item["overallAvg"] = totalScore / float64(totalCount)
		}
		summary = append(summary, item)
	}
	return fiber.Map{"summary": summary, "tryouts": tryouts, "practices": practices, "cermat": cermat}, nil
}

func (h *Handler) Ranking(c *fiber.Ctx) error {
	data, err := h.rankingData(c)
	if err != nil {
		return err
	}
	return httpx.Success(c, data)
}

func (h *Handler) RankingExport(c *fiber.Ctx) error {
	data, err := h.rankingData(c)
	if err != nil {
		return err
	}
	summary, _ := data["summary"].([]fiber.Map)
	rows := []map[string]any{}
	for _, s := range summary {
		u, _ := s["user"].(fiber.Map)
		rows = append(rows, map[string]any{
			"name": u["name"], "email": u["email"], "tryoutAvg": s["tryoutAvg"],
			"practiceAvg": s["practiceAvg"], "cermatAvg": s["cermatAvg"], "overallAvg": s["overallAvg"],
		})
	}
	return csvAttachment(c, "ranking.csv", examcsv.ToRows([]string{"name", "email", "tryoutAvg", "practiceAvg", "cermatAvg", "overallAvg"}, rows))
}

func (h *Handler) Users(c *fiber.Ctx) error {
	var users []models.User
	h.DB.Where("email <> ?", hiddenAdminEmail).Order(`"createdAt" DESC`).Find(&users)
	out := []fiber.Map{}
	for _, u := range users {
		var trxCount, tryoutCount, practiceCount int64
		h.DB.Model(&models.Transaction{}).Where(`"userId" = ?`, u.ID).Count(&trxCount)
		h.DB.Model(&models.TryoutResult{}).Where(`"userId" = ?`, u.ID).Count(&tryoutCount)
		h.DB.Model(&models.PracticeResult{}).Where(`"userId" = ?`, u.ID).Count(&practiceCount)
		var area models.MemberArea
		h.DB.Where(`"userId" = ?`, u.ID).First(&area)
		out = append(out, fiber.Map{
			"id": u.ID, "name": u.Name, "email": u.Email, "phone": u.Phone, "role": u.Role,
			"isActive": u.IsActive, "createdAt": u.CreatedAt, "referralCode": u.ReferralCode,
			"memberArea": fiber.Map{"slug": area.Slug},
			"_count":     fiber.Map{"transactions": trxCount, "tryoutResults": tryoutCount, "practiceResults": practiceCount},
		})
	}
	return httpx.Success(c, out)
}

func (h *Handler) UsersExport(c *fiber.Ctx) error {
	var users []models.User
	h.DB.Where("email <> ?", hiddenAdminEmail).Order(`"createdAt" DESC`).Find(&users)
	rows := []map[string]any{}
	for _, u := range users {
		var area models.MemberArea
		h.DB.Where(`"userId" = ?`, u.ID).First(&area)
		phone := ""
		if u.Phone != nil {
			phone = *u.Phone
		}
		status := "NONAKTIF"
		if u.IsActive {
			status = "AKTIF"
		}
		rows = append(rows, map[string]any{
			"id": u.ID, "name": u.Name, "email": u.Email, "phone": phone, "role": u.Role,
			"status": status, "kodeAkses": area.Slug, "referralCode": u.ReferralCode,
			"joinedAt": u.CreatedAt.Format(time.RFC3339),
		})
	}
	return csvAttachment(c, "manajemen-pengguna.csv", examcsv.ToRows(
		[]string{"id", "name", "email", "phone", "role", "status", "kodeAkses", "referralCode", "joinedAt"}, rows,
	))
}

func (h *Handler) PatchRole(c *fiber.Ctx) error {
	var body struct {
		Role string `json:"role"`
	}
	_ = c.BodyParser(&body)
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "User tidak ditemukan")
	}
	if isProtected(user) {
		return httpx.New(400, "Role Super Admin tidak dapat diubah.")
	}
	if body.Role != "ADMIN" && body.Role != "MEMBER" {
		return httpx.New(400, "Role tidak valid")
	}
	h.DB.Model(&user).Update("role", body.Role)
	h.DB.First(&user, "id = ?", user.ID)
	return httpx.Success(c, user)
}

func (h *Handler) PatchStatus(c *fiber.Ctx) error {
	var body struct {
		IsActive bool `json:"isActive"`
	}
	_ = c.BodyParser(&body)
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "User tidak ditemukan")
	}
	if isProtected(user) {
		return httpx.New(400, "Status Super Admin tidak dapat diubah.")
	}
	h.DB.Model(&user).Update("isActive", body.IsActive)
	h.DB.First(&user, "id = ?", user.ID)
	return httpx.Success(c, user)
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "User tidak ditemukan")
	}
	if isProtected(user) {
		return httpx.New(400, "Password Super Admin tidak dapat direset.")
	}
	temp := auth.RandomPassword()
	hash, err := auth.HashPassword(temp)
	if err != nil {
		return err
	}
	h.DB.Model(&user).Updates(map[string]any{
		"passwordHash":   hash,
		"sessionVersion": gorm.Expr(`"sessionVersion" + 1`),
		"updatedAt":      time.Now(),
	})
	h.DB.Where(`"userId" = ?`, user.ID).Delete(&models.RefreshToken{})
	return httpx.Success(c, fiber.Map{"userId": user.ID, "tempPassword": temp})
}

func (h *Handler) Impersonate(c *fiber.Ctx) error {
	data, err := auth.IssueImpersonation(h.DB, h.Cfg, c.Params("id"))
	if err != nil {
		return err
	}
	return httpx.Success(c, data)
}

func (h *Handler) DeleteUser(c *fiber.Ctx) error {
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "User tidak ditemukan")
	}
	if isProtected(user) {
		return httpx.New(400, "Akun Super Admin tidak dapat dihapus.")
	}
	if user.Role != "MEMBER" {
		return httpx.New(400, "Hanya akun MEMBER yang dapat dihapus dari halaman ini.")
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		uid := user.ID
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.TryoutAnswer{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.TryoutResult{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.PracticeAnswer{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.PracticeResult{}).Error; err != nil {
			return err
		}
		var sessions []models.CermatSession
		tx.Select("id").Where(`"userId" = ?`, uid).Find(&sessions)
		sessionIDs := make([]string, 0, len(sessions))
		for _, s := range sessions {
			sessionIDs = append(sessionIDs, s.ID)
		}
		if len(sessionIDs) > 0 {
			if err := tx.Where(`"sessionId" IN ?`, sessionIDs).Delete(&models.CermatAnswer{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.CermatSession{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.CermatAttempt{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.MaterialAccess{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.Transaction{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.ExamBlock{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.ExamQuotaUsage{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.MemberMaterialCategory{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.PsychCalculatorSubmission{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"referrerId" = ? OR "referredUserId" = ?`, uid, uid).Delete(&models.Referral{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.MemberActivityLog{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.WhatsAppDispatch{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.RefreshToken{}).Error; err != nil {
			return err
		}
		if err := tx.Where(`"userId" = ?`, uid).Delete(&models.MemberArea{}).Error; err != nil {
			return err
		}
		tx.Model(&models.Announcement{}).Where(`"createdById" = ?`, uid).Update("createdById", nil)
		tx.Model(&models.Material{}).Where(`"uploadedById" = ?`, uid).Update("uploadedById", nil)
		return tx.Delete(&models.User{}, "id = ?", uid).Error
	})
	if err != nil {
		return err
	}
	return httpx.Success(c, fiber.Map{"ok": true, "id": user.ID})
}

func (h *Handler) ActivityLogs(c *fiber.Ctx) error {
	q := h.DB.Model(&models.MemberActivityLog{}).Preload("User")
	if userID := strings.TrimSpace(c.Query("userId")); userID != "" {
		q = q.Where(`"userId" = ?`, userID)
	}
	if kind := strings.TrimSpace(c.Query("kind")); kind != "" {
		q = q.Where("kind = ?", kind)
	}
	limit := 100
	if n, err := strconv.Atoi(c.Query("limit")); err == nil && n > 0 && n <= 500 {
		limit = n
	}
	var logs []models.MemberActivityLog
	q.Order(`"createdAt" DESC`).Limit(limit).Find(&logs)

	var members []models.User
	h.DB.Select(`id, name, email`).Where(`role = ? AND email <> ?`, "MEMBER", hiddenAdminEmail).Order("name ASC").Find(&members)

	type summary struct {
		UserID       string     `json:"userId"`
		Name         string     `json:"name"`
		Email        string     `json:"email"`
		LastLoginAt  *time.Time `json:"lastLoginAt"`
		LastSeenAt   *time.Time `json:"lastSeenAt"`
		PageViews    int64      `json:"pageViews"`
		TryoutStarts int64      `json:"tryoutStarts"`
		TryoutDone   int64      `json:"tryoutDone"`
		PracticeDone int64      `json:"practiceDone"`
		CermatDone   int64      `json:"cermatDone"`
		MaterialOpen int64      `json:"materialOpen"`
	}
	outSummaries := []summary{}
	for _, m := range members {
		item := summary{UserID: m.ID, Name: m.Name, Email: m.Email}
		var lastLogin models.MemberActivityLog
		if err := h.DB.Where(`"userId" = ? AND kind = ?`, m.ID, "LOGIN").Order(`"createdAt" DESC`).First(&lastLogin).Error; err == nil {
			item.LastLoginAt = &lastLogin.CreatedAt
		}
		var lastSeen models.MemberActivityLog
		if err := h.DB.Where(`"userId" = ?`, m.ID).Order(`"createdAt" DESC`).First(&lastSeen).Error; err == nil {
			item.LastSeenAt = &lastSeen.CreatedAt
		}
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "PAGE").Count(&item.PageViews)
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "TRYOUT_START").Count(&item.TryoutStarts)
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "TRYOUT_SUBMIT").Count(&item.TryoutDone)
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "PRACTICE_SUBMIT").Count(&item.PracticeDone)
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "CERMAT").Count(&item.CermatDone)
		h.DB.Model(&models.MemberActivityLog{}).Where(`"userId" = ? AND kind = ?`, m.ID, "MATERIAL_OPEN").Count(&item.MaterialOpen)
		outSummaries = append(outSummaries, item)
	}

	items := []fiber.Map{}
	for _, log := range logs {
		items = append(items, fiber.Map{
			"id": log.ID, "userId": log.UserID, "kind": log.Kind, "title": log.Title,
			"path": log.Path, "meta": log.Meta, "createdAt": log.CreatedAt,
			"user": fiber.Map{"id": log.User.ID, "name": log.User.Name, "email": log.User.Email},
		})
	}
	return httpx.Success(c, fiber.Map{"items": items, "summaries": outSummaries})
}

func (h *Handler) MonitoringUsers(c *fiber.Ctx) error {
	var users []models.User
	h.DB.Where("role = ?", "MEMBER").Order(`"createdAt" DESC`).Limit(40).Find(&users)
	out := []fiber.Map{}
	for _, u := range users {
		var trx models.Transaction
		h.DB.Preload("Package").Where(`"userId" = ? AND type = ? AND status = ?`, u.ID, "MEMBERSHIP", "PAID").
			Order(`"activatedAt" DESC`).First(&trx)
		var lastTry models.TryoutResult
		h.DB.Where(`"userId" = ?`, u.ID).Order(`"createdAt" DESC`).First(&lastTry)
		var lastPrac models.PracticeResult
		h.DB.Where(`"userId" = ?`, u.ID).Order(`"createdAt" DESC`).First(&lastPrac)
		var lastCer models.CermatSession
		h.DB.Where(`"userId" = ?`, u.ID).Order(`"createdAt" DESC`).First(&lastCer)
		item := fiber.Map{"id": u.ID, "name": u.Name, "email": u.Email, "joinedAt": u.CreatedAt}
		if trx.ID != "" {
			item["membership"] = fiber.Map{"packageName": trx.Package.Name, "activatedAt": trx.ActivatedAt, "expiresAt": trx.ExpiresAt}
		}
		if lastTry.ID != "" {
			item["lastTryout"] = fiber.Map{"score": lastTry.Score, "createdAt": lastTry.CreatedAt}
		}
		if lastPrac.ID != "" {
			item["lastPractice"] = fiber.Map{"score": lastPrac.Score, "createdAt": lastPrac.CreatedAt}
		}
		if lastCer.ID != "" {
			item["lastCermat"] = fiber.Map{"correctCount": lastCer.CorrectCount, "totalQuestions": lastCer.TotalQuestions, "createdAt": lastCer.CreatedAt}
		}
		out = append(out, item)
	}
	return httpx.Success(c, out)
}

func (h *Handler) MonitoringUser(c *fiber.Ctx) error {
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "User tidak ditemukan")
	}
	var trx []models.Transaction
	h.DB.Preload("Package").Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Find(&trx)
	var tryouts []models.TryoutResult
	h.DB.Preload("Tryout").Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Limit(20).Find(&tryouts)
	var practices []models.PracticeResult
	h.DB.Preload("Set").Where(`"userId" = ?`, user.ID).Order(`"createdAt" DESC`).Limit(20).Find(&practices)
	return httpx.Success(c, fiber.Map{"user": user, "transactions": trx, "tryouts": tryouts, "practices": practices})
}

func (h *Handler) SystemMetrics(c *fiber.Ctx) error {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	total := ms.Sys
	used := ms.Alloc
	free := uint64(0)
	if total > used {
		free = total - used
	}
	usage := 0.0
	if total > 0 {
		usage = float64(used) / float64(total) * 100
	}
	cpus := sampleCPU()
	return httpx.Success(c, fiber.Map{
		"memory": fiber.Map{"total": total, "used": used, "free": free, "usage": usage},
		"cpu":    cpus,
		"uptime": int(time.Since(startedAt).Seconds()),
	})
}

func readProcStat() ([][2]uint64, error) {
	f, err := os.Open("/proc/stat")
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var cores [][2]uint64
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		fields := strings.Fields(sc.Text())
		if len(fields) < 5 || !strings.HasPrefix(fields[0], "cpu") || fields[0] == "cpu" {
			continue
		}
		var idle, total uint64
		for i, raw := range fields[1:] {
			n, _ := strconv.ParseUint(raw, 10, 64)
			total += n
			if i == 3 {
				idle = n
			}
		}
		cores = append(cores, [2]uint64{idle, total})
	}
	return cores, sc.Err()
}

func sampleCPU() []fiber.Map {
	first, err := readProcStat()
	if err != nil || len(first) == 0 {
		out := []fiber.Map{}
		for i := 0; i < runtime.NumCPU(); i++ {
			out = append(out, fiber.Map{"core": i, "model": runtime.GOARCH, "speed": 0, "usage": 0})
		}
		return out
	}
	time.Sleep(120 * time.Millisecond)
	second, err := readProcStat()
	if err != nil || len(second) != len(first) {
		out := []fiber.Map{}
		for i := range first {
			out = append(out, fiber.Map{"core": i, "model": runtime.GOARCH, "speed": 0, "usage": 0})
		}
		return out
	}
	out := make([]fiber.Map, 0, len(first))
	for i := range first {
		idleDelta := second[i][0] - first[i][0]
		totalDelta := second[i][1] - first[i][1]
		usage := 0.0
		if totalDelta > 0 {
			usage = (1 - float64(idleDelta)/float64(totalDelta)) * 100
		}
		out = append(out, fiber.Map{"core": i, "model": runtime.GOARCH, "speed": 0, "usage": usage})
	}
	return out
}

func (h *Handler) ListReferrals(c *fiber.Ctx) error {
	type item struct {
		ID            string    `json:"id"`
		Status        string    `json:"status"`
		CreatedAt     time.Time `json:"createdAt"`
		ReferrerName  string    `json:"referrerName"`
		ReferrerEmail string    `json:"referrerEmail"`
		ReferralCode  string    `json:"referralCode"`
		ReferredName  string    `json:"referredName"`
		ReferredEmail string    `json:"referredEmail"`
	}
	items := []item{}
	err := h.DB.Raw(`
		SELECT r.id, r.status, r."createdAt",
		       u.name AS "referrerName", u.email AS "referrerEmail", u."referralCode",
		       d.name AS "referredName", d.email AS "referredEmail"
		FROM "Referral" r
		JOIN "User" u ON u.id = r."referrerId"
		JOIN "User" d ON d.id = r."referredUserId"
		ORDER BY r."createdAt" DESC
	`).Scan(&items).Error
	if err != nil {
		return httpx.New(500, "Gagal memuat afiliasi")
	}
	return httpx.Success(c, items)
}

func (h *Handler) ListBlocks(c *fiber.Ctx) error {
	var items []models.ExamBlock
	h.DB.Preload("User").Where(`"resolvedAt" IS NULL`).Order(`"blockedAt" DESC`).Find(&items)
	out := []fiber.Map{}
	for _, b := range items {
		out = append(out, fiber.Map{
			"id": b.ID, "type": b.Type, "reason": b.Reason, "code": b.Code,
			"violationCount": b.ViolationCount, "blockedAt": b.BlockedAt,
			"user": fiber.Map{"id": b.User.ID, "name": b.User.Name, "email": b.User.Email},
		})
	}
	return httpx.Success(c, out)
}

func (h *Handler) RegenBlock(c *fiber.Ctx) error {
	var blk models.ExamBlock
	if err := h.DB.Preload("User").First(&blk, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Blokir ujian tidak ditemukan")
	}
	code := 100000 + int(time.Now().UnixNano()%900000)
	h.DB.Model(&blk).Updates(map[string]any{"code": itoa(code), "updatedAt": time.Now()})
	h.DB.Preload("User").First(&blk, "id = ?", blk.ID)
	return httpx.Success(c, fiber.Map{
		"id": blk.ID, "type": blk.Type, "reason": blk.Reason, "code": blk.Code,
		"violationCount": blk.ViolationCount, "blockedAt": blk.BlockedAt,
		"user": fiber.Map{"id": blk.User.ID, "name": blk.User.Name, "email": blk.User.Email},
	})
}

func (h *Handler) ResolveBlock(c *fiber.Ctx) error {
	var blk models.ExamBlock
	if err := h.DB.First(&blk, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Blokir ujian tidak ditemukan")
	}
	now := time.Now()
	h.DB.Model(&blk).Updates(map[string]any{"resolvedAt": now, "updatedAt": now})
	h.DB.First(&blk, "id = ?", blk.ID)
	return httpx.Success(c, blk)
}

func (h *Handler) GetUserMaterialCategories(c *fiber.Ctx) error {
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Member tidak ditemukan")
	}
	var rows []models.MemberMaterialCategory
	h.DB.Where(`"userId" = ?`, user.ID).Find(&rows)
	selected := make([]string, 0, len(rows))
	for _, row := range rows {
		selected = append(selected, row.Category)
	}
	return httpx.Success(c, fiber.Map{
		"userId":     user.ID,
		"categories": materials.Ordered(selected),
		"options":    materials.Categories,
	})
}

func (h *Handler) PutUserMaterialCategories(c *fiber.Ctx) error {
	var user models.User
	if err := h.DB.First(&user, "id = ?", c.Params("id")).Error; err != nil {
		return httpx.New(404, "Member tidak ditemukan")
	}
	var body struct {
		Categories []string `json:"categories"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Invalid body")
	}
	chosen := materials.Ordered(body.Categories)
	if len(chosen) != len(body.Categories) {
		return httpx.New(400, "Kategori materi tidak valid")
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(`"userId" = ?`, user.ID).Delete(&models.MemberMaterialCategory{}).Error; err != nil {
			return err
		}
		if len(chosen) == 0 {
			return nil
		}
		rows := make([]models.MemberMaterialCategory, 0, len(chosen))
		now := time.Now()
		for _, category := range chosen {
			rows = append(rows, models.MemberMaterialCategory{
				ID: id.New(), UserID: user.ID, Category: category, CreatedAt: now,
			})
		}
		return tx.Create(&rows).Error
	})
	if err != nil {
		return httpx.New(500, "Gagal menyimpan kategori materi")
	}
	return httpx.Success(c, fiber.Map{"userId": user.ID, "categories": chosen})
}
