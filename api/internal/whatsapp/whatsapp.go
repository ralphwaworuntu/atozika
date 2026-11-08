package whatsapp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"atozika/internal/config"
	"atozika/internal/id"
	"atozika/internal/models"

	"gorm.io/gorm"
)

const (
	StatusSent    = "SENT"
	StatusFailed  = "FAILED"
	StatusSkipped = "SKIPPED"
)

type Sender struct {
	DB     *gorm.DB
	Cfg    config.Config
	Client *http.Client
}

type Result struct {
	UserID  string
	Kind    string
	RefID   string
	Title   string
	Score   float64
	Correct int
	Total   int
}

func (s *Sender) Configured() bool {
	if s == nil || strings.TrimSpace(s.Cfg.WhatsAppToken) == "" {
		return false
	}
	switch s.Cfg.WhatsAppProvider {
	case "meta":
		return strings.TrimSpace(s.Cfg.WhatsAppPhoneID) != ""
	case "fonnte":
		return true
	default:
		return false
	}
}

func (s *Sender) Queue(result Result) {
	if s == nil || s.DB == nil || result.UserID == "" || result.RefID == "" {
		return
	}
	go s.deliver(result)
}

func (s *Sender) deliver(result Result) {
	var user models.User
	if err := s.DB.Select(`id, name, "parentName", "parentPhone"`).First(&user, "id = ?", result.UserID).Error; err != nil {
		return
	}
	raw := ""
	if user.ParentPhone != nil {
		raw = *user.ParentPhone
	}
	phone, ok := NormalizePhone(raw)
	if strings.TrimSpace(raw) == "" {
		return
	}
	var areas []models.MemberArea
	s.DB.Select("slug").Where(`"userId" = ?`, user.ID).Limit(1).Find(&areas)
	code := ""
	if len(areas) > 0 {
		code = areas[0].Slug
	}
	body := ReportText(user.Name, activityLabel(result.Kind), result.Title, result.Score, result.Correct, result.Total, code, parentPage(s.Cfg.AppURL))
	row := models.WhatsAppDispatch{
		ID: id.New(), UserID: &user.ID, ParentPhone: phone, Kind: result.Kind, RefID: result.RefID,
		Body: body, Status: StatusSkipped, CreatedAt: time.Now(),
	}
	if !ok {
		row.ParentPhone = strings.TrimSpace(raw)
		row.Status = StatusFailed
		row.Detail = "Nomor WhatsApp orang tua tidak valid"
		_ = s.DB.Create(&row).Error
		return
	}
	if !s.Configured() {
		row.Detail = "Kredensial WhatsApp belum diisi"
		_ = s.DB.Create(&row).Error
		return
	}
	row.Status = StatusFailed
	if err := s.DB.Create(&row).Error; err != nil {
		return
	}
	s.dispatch(&row)
}

func (s *Sender) dispatch(row *models.WhatsAppDispatch) {
	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()
	err := s.send(ctx, row.ParentPhone, row.Body)
	now := time.Now()
	if err != nil {
		s.DB.Model(row).Updates(map[string]any{"status": StatusFailed, "detail": clip(err.Error(), 300)})
		return
	}
	s.DB.Model(row).Updates(map[string]any{"status": StatusSent, "detail": "", "sentAt": now})
}

func (s *Sender) RetryPending(limit int) (int, int, error) {
	if !s.Configured() {
		return 0, 0, fmt.Errorf("Kredensial WhatsApp belum diisi")
	}
	if limit < 1 || limit > 50 {
		limit = 30
	}
	var rows []models.WhatsAppDispatch
	since := time.Now().Add(-14 * 24 * time.Hour)
	s.DB.Where(`status IN ? AND "createdAt" >= ?`, []string{StatusSkipped, StatusFailed}, since).
		Order(`"createdAt" ASC`).Limit(limit).Find(&rows)
	sent := 0
	for i := range rows {
		phone, ok := NormalizePhone(rows[i].ParentPhone)
		if !ok {
			s.DB.Model(&rows[i]).Updates(map[string]any{"status": StatusFailed, "detail": "Nomor WhatsApp orang tua tidak valid"})
			continue
		}
		rows[i].ParentPhone = phone
		s.dispatch(&rows[i])
		var fresh models.WhatsAppDispatch
		if err := s.DB.Select("status").First(&fresh, "id = ?", rows[i].ID).Error; err == nil && fresh.Status == StatusSent {
			sent++
		}
	}
	return len(rows), sent, nil
}

func (s *Sender) SendTest(phoneRaw, page string) error {
	if !s.Configured() {
		return fmt.Errorf("Kredensial WhatsApp belum diisi")
	}
	phone, ok := NormalizePhone(phoneRaw)
	if !ok {
		return fmt.Errorf("Nomor WhatsApp tidak valid")
	}
	body := "Halo Bapak/Ibu, ini pesan uji rapor ATOZIKA. Pengiriman WhatsApp orang tua sudah terhubung."
	if page != "" {
		body += "\nHalaman rapor: " + page
	}
	row := models.WhatsAppDispatch{
		ID: id.New(), ParentPhone: phone, Kind: "TEST", RefID: id.New(),
		Body: body, Status: StatusFailed, CreatedAt: time.Now(),
	}
	if err := s.DB.Create(&row).Error; err != nil {
		return err
	}
	s.dispatch(&row)
	var fresh models.WhatsAppDispatch
	if err := s.DB.Select("status, detail").First(&fresh, "id = ?", row.ID).Error; err != nil {
		return err
	}
	if fresh.Status != StatusSent {
		if fresh.Detail == "" {
			return fmt.Errorf("Pengiriman uji gagal")
		}
		return fmt.Errorf("%s", fresh.Detail)
	}
	return nil
}

func (s *Sender) send(ctx context.Context, phone, body string) error {
	switch s.Cfg.WhatsAppProvider {
	case "meta":
		return s.sendMeta(ctx, phone, body)
	case "fonnte":
		return s.sendFonnte(ctx, phone, body)
	default:
		return fmt.Errorf("Provider WhatsApp belum dipilih")
	}
}

func (s *Sender) sendMeta(ctx context.Context, phone, body string) error {
	payload := map[string]any{
		"messaging_product": "whatsapp",
		"to":                phone,
	}
	if name := strings.TrimSpace(s.Cfg.WhatsAppTemplate); name != "" {
		lang := s.Cfg.WhatsAppLang
		if lang == "" {
			lang = "id"
		}
		payload["type"] = "template"
		payload["template"] = map[string]any{
			"name":     name,
			"language": map[string]string{"code": lang},
			"components": []map[string]any{{
				"type":       "body",
				"parameters": []map[string]string{{"type": "text", "text": oneLine(body)}},
			}},
		}
	} else {
		payload["type"] = "text"
		payload["text"] = map[string]any{"preview_url": true, "body": body}
	}
	url := "https://graph.facebook.com/v21.0/" + s.Cfg.WhatsAppPhoneID + "/messages"
	return s.postJSON(ctx, url, payload, map[string]string{"Authorization": "Bearer " + s.Cfg.WhatsAppToken})
}

func (s *Sender) sendFonnte(ctx context.Context, phone, body string) error {
	payload := map[string]string{"target": phone, "message": body}
	return s.postJSON(ctx, "https://api.fonnte.com/send", payload, map[string]string{"Authorization": s.Cfg.WhatsAppToken})
}

func (s *Sender) postJSON(ctx context.Context, url string, payload any, headers map[string]string) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	client := s.Client
	if client == nil {
		client = &http.Client{Timeout: 12 * time.Second}
	}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	resp, _ := io.ReadAll(io.LimitReader(res.Body, 400))
	if res.StatusCode >= 300 {
		return fmt.Errorf("WhatsApp menolak pesan (%d)", res.StatusCode)
	}
	if bytes.Contains(bytes.ToLower(resp), []byte(`"status":false`)) {
		return fmt.Errorf("Gateway WhatsApp menolak pesan")
	}
	return nil
}

func NormalizePhone(raw string) (string, bool) {
	var b strings.Builder
	for _, r := range raw {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	d := b.String()
	switch {
	case strings.HasPrefix(d, "0"):
		d = "62" + d[1:]
	case strings.HasPrefix(d, "8"):
		d = "62" + d
	}
	if len(d) < 11 || len(d) > 15 || !strings.HasPrefix(d, "62") {
		return "", false
	}
	return d, true
}

func ReportText(member, activity, title string, score float64, correct, total int, code, page string) string {
	if strings.TrimSpace(member) == "" {
		member = "putra/putri Bapak/Ibu"
	}
	if strings.TrimSpace(title) == "" {
		title = activity
	}
	scoreLine := fmt.Sprintf("Skor: %.0f", score)
	if total > 0 {
		scoreLine = fmt.Sprintf("Skor: %.0f (%d/%d benar)", score, correct, total)
	}
	lines := []string{
		fmt.Sprintf("Halo Bapak/Ibu, rapor ATOZIKA untuk %s.", member),
		"",
		fmt.Sprintf("%s: %s", activity, title),
		scoreLine,
	}
	if code != "" {
		lines = append(lines, "", "Kode akses rapor: "+code)
	}
	if page != "" {
		lines = append(lines, "Buka tanpa login: "+page)
	}
	return strings.Join(lines, "\n")
}

func activityLabel(kind string) string {
	switch kind {
	case "TRYOUT":
		return "Tryout"
	case "PRACTICE":
		return "Latihan soal"
	case "CERMAT":
		return "Tes kecermatan"
	default:
		return "Laporan"
	}
}

func parentPage(appURL string) string {
	base := strings.TrimRight(strings.TrimSpace(appURL), "/")
	if base == "" {
		return ""
	}
	return base + "/orang-tua"
}

func oneLine(s string) string {
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	return clip(strings.Join(strings.Fields(s), " "), 900)
}

func clip(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
