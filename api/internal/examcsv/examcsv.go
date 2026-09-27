package examcsv

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Option struct {
	Label     string  `json:"label"`
	ImageURL  *string `json:"imageUrl"`
	IsCorrect bool    `json:"isCorrect"`
}

type Question struct {
	Prompt              string   `json:"prompt"`
	ImageURL            *string  `json:"imageUrl"`
	Explanation         *string  `json:"explanation"`
	ExplanationImageURL *string  `json:"explanationImageUrl"`
	Order               int      `json:"order"`
	Options             []Option `json:"options"`
}

type Warning struct {
	Row     int    `json:"row"`
	Field   string `json:"field"`
	Message string `json:"message"`
}

var CSVHeaders = []string{
	"prompt", "prompt_image", "explanation", "explanationImageUrl", "order",
	"option_a", "option_a_image", "option_a_correct",
	"option_b", "option_b_image", "option_b_correct",
	"option_c", "option_c_image", "option_c_correct",
	"option_d", "option_d_image", "option_d_correct",
	"option_e", "option_e_image", "option_e_correct",
}

var optionKeys = []string{"option_a", "option_b", "option_c", "option_d", "option_e"}

func ParseFile(path, label string) ([]Question, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseBytes(raw, label)
}

func ParseBytes(raw []byte, label string) ([]Question, error) {
	content := strings.TrimPrefix(string(raw), "\ufeff")
	delim := ','
	headerLine := firstLine(content)
	if strings.Count(headerLine, ";") > strings.Count(headerLine, ",") && strings.Count(headerLine, ";") >= 5 {
		delim = ';'
	}
	r := csv.NewReader(strings.NewReader(content))
	r.Comma = delim
	r.LazyQuotes = true
	r.FieldsPerRecord = -1
	r.TrimLeadingSpace = true
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, errf("CSV %s: tidak ada soal terdeteksi.", label)
	}
	headers := make([]string, len(rows[0]))
	for i, h := range rows[0] {
		headers[i] = strings.TrimSpace(strings.TrimPrefix(h, "\ufeff"))
	}
	questions := make([]Question, 0, len(rows)-1)
	for i, row := range rows[1:] {
		rec := map[string]string{}
		for j, h := range headers {
			if j < len(row) {
				rec[h] = strings.TrimSpace(row[j])
			}
		}
		order := i + 1
		if n, err := strconv.Atoi(rec["order"]); err == nil {
			order = n
		}
		exp := rec["explanation"]
		expImg := rec["explanationImageUrl"]
		if expImg == "" {
			expImg = rec["explanation_image"]
		}
		promptImg := rec["prompt_image"]
		q := Question{
			Prompt:  rec["prompt"],
			Order:   order,
			Options: parseOptions(rec),
		}
		if promptImg != "" {
			q.ImageURL = &promptImg
		}
		if exp != "" {
			q.Explanation = &exp
		}
		if expImg != "" {
			q.ExplanationImageURL = &expImg
		}
		questions = append(questions, q)
	}
	if err := assertImportable(questions, label); err != nil {
		return nil, err
	}
	return questions, nil
}

func parseOptions(row map[string]string) []Option {
	keys := append([]string{}, optionKeys...)
	for k := range row {
		if strings.HasPrefix(k, "option_") && !strings.HasSuffix(k, "_correct") && !strings.HasSuffix(k, "_image") {
			found := false
			for _, existing := range keys {
				if existing == k {
					found = true
					break
				}
			}
			if !found {
				keys = append(keys, k)
			}
		}
	}
	out := []Option{}
	for _, key := range keys {
		label := strings.TrimSpace(row[key])
		img := strings.TrimSpace(row[key+"_image"])
		if label == "" && img == "" {
			continue
		}
		opt := Option{Label: label, IsCorrect: isTrue(row[key+"_correct"])}
		if img != "" {
			opt.ImageURL = &img
		}
		out = append(out, opt)
	}
	return out
}

func assertImportable(questions []Question, label string) error {
	if len(questions) == 0 {
		return errf("CSV %s: tidak ada soal terdeteksi.", label)
	}
	for i, q := range questions {
		row := i + 2
		correct := 0
		filled := 0
		for _, o := range q.Options {
			if o.Label != "" || (o.ImageURL != nil && *o.ImageURL != "") {
				filled++
			}
			if o.IsCorrect {
				correct++
			}
		}
		hasPrompt := strings.TrimSpace(q.Prompt) != "" || (q.ImageURL != nil && *q.ImageURL != "")
		hasExpl := (q.Explanation != nil && strings.TrimSpace(*q.Explanation) != "") || (q.ExplanationImageURL != nil && *q.ExplanationImageURL != "")
		if !hasPrompt {
			return errf("CSV %s: pertanyaan kosong — isi teks atau prompt_image (baris %d).", label, row)
		}
		if !hasExpl {
			return errf("CSV %s: pembahasan wajib — isi teks atau gambar pembahasan (baris %d).", label, row)
		}
		if filled < 2 {
			return errf("CSV %s: minimal 2 pilihan jawaban teks/gambar (baris %d).", label, row)
		}
		if correct == 0 {
			return errf("CSV %s: kunci jawaban belum ditentukan (baris %d).", label, row)
		}
	}
	return nil
}

func Serialize(questions []Question) string {
	var buf bytes.Buffer
	buf.WriteString("\ufeff")
	w := csv.NewWriter(&buf)
	_ = w.Write(CSVHeaders)
	for i, q := range questions {
		order := q.Order
		if order == 0 {
			order = i + 1
		}
		row := map[string]string{
			"prompt": q.Prompt, "order": strconv.Itoa(order),
		}
		if q.ImageURL != nil {
			row["prompt_image"] = *q.ImageURL
		}
		if q.Explanation != nil {
			row["explanation"] = *q.Explanation
		}
		if q.ExplanationImageURL != nil {
			row["explanationImageUrl"] = *q.ExplanationImageURL
		}
		for idx, key := range optionKeys {
			if idx < len(q.Options) {
				opt := q.Options[idx]
				row[key] = opt.Label
				if opt.ImageURL != nil {
					row[key+"_image"] = *opt.ImageURL
				}
				if opt.IsCorrect {
					row[key+"_correct"] = "TRUE"
				} else {
					row[key+"_correct"] = "FALSE"
				}
			} else {
				row[key+"_correct"] = "FALSE"
			}
		}
		line := make([]string, len(CSVHeaders))
		for i, h := range CSVHeaders {
			line[i] = row[h]
		}
		_ = w.Write(line)
	}
	w.Flush()
	return buf.String()
}

func Validate(questions []Question) []Warning {
	var warnings []Warning
	if len(questions) == 0 {
		return []Warning{{Row: 0, Field: "document", Message: "Tidak ada soal terdeteksi dalam dokumen."}}
	}
	for i, q := range questions {
		row := i + 1
		if strings.TrimSpace(q.Prompt) == "" && (q.ImageURL == nil || *q.ImageURL == "") {
			warnings = append(warnings, Warning{Row: row, Field: "prompt", Message: "Pertanyaan kosong."})
		}
		filled := 0
		correct := 0
		for _, o := range q.Options {
			if strings.TrimSpace(o.Label) != "" || (o.ImageURL != nil && *o.ImageURL != "") {
				filled++
			}
			if o.IsCorrect {
				correct++
			}
		}
		if filled < 2 {
			warnings = append(warnings, Warning{Row: row, Field: "options", Message: "Minimal 2 pilihan jawaban."})
		}
		if correct == 0 {
			warnings = append(warnings, Warning{Row: row, Field: "answer", Message: "Kunci jawaban belum ditentukan."})
		}
	}
	return warnings
}

func ToRows(headers []string, records []map[string]any) string {
	var buf bytes.Buffer
	buf.WriteString("\ufeff")
	w := csv.NewWriter(&buf)
	_ = w.Write(headers)
	for _, rec := range records {
		line := make([]string, len(headers))
		for i, h := range headers {
			if v, ok := rec[h]; ok && v != nil {
				line[i] = stringify(v)
			}
		}
		_ = w.Write(line)
	}
	w.Flush()
	return buf.String()
}

func stringify(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case int:
		return strconv.Itoa(t)
	case int64:
		return strconv.FormatInt(t, 10)
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case bool:
		if t {
			return "TRUE"
		}
		return "FALSE"
	default:
		return ""
	}
}

func isTrue(v string) bool {
	v = strings.TrimSpace(strings.ToLower(v))
	return v == "true" || v == "1" || v == "y"
}

func firstLine(s string) string {
	if i := strings.IndexAny(s, "\r\n"); i >= 0 {
		return s[:i]
	}
	return s
}

type parseErr string

func (e parseErr) Error() string { return string(e) }

func errf(format string, args ...any) error {
	return parseErr(fmt.Sprintf(format, args...))
}
