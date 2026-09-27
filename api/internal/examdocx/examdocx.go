package examdocx

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"

	"atozika/internal/examcsv"
	"atozika/internal/httpx"
)

var (
	optionLine  = regexp.MustCompile(`(?i)^(?:\(([A-E])\)|([A-E])[.)]|([A-E])[:：=\-])\s*(.+)$`)
	kunciLine   = regexp.MustCompile(`(?i)^(?:KUNCI(?:\s*JAWABAN)?|Kunci\s*Jawaban|JAWABAN|Jawaban(?:\s*Benar)?|Jawab)\s*[:：=\-]?\s*([A-E])\s*$`)
	pembahasan  = regexp.MustCompile(`(?i)^(?:PEMBAHASAN|Pembahasan|Penjelasan|PENJELASAN|Alasan)\s*[:：=\-]?\s*(.*)$`)
	soalSplit   = regexp.MustCompile(`(?i)(?:^|\n)\s*(?:\[)?SOAL\s*(\d+)(?:\])?\s*(?:\n|$)`)
	numbered    = regexp.MustCompile(`(?m)(?:^|\n)\s*(\d+)\.\s+`)
	noSoalHdr   = regexp.MustCompile(`(?i)No\.\s*\d+`)
	noSoalStart = regexp.MustCompile(`(?i)(?:^|\n)\s*No\.\s*\d+\b`)
)

type Result struct {
	Questions          []examcsv.Question
	Warnings           []examcsv.Warning
	ExtractedImages    []string
	EmbeddedImageCount int
}

func ParseFile(path string) (*Result, error) {
	lower := strings.ToLower(path)
	if strings.HasSuffix(lower, ".doc") && !strings.HasSuffix(lower, ".docx") {
		return nil, httpx.New(400, "File .doc belum didukung. Simpan ulang sebagai .docx.")
	}
	text, images, err := extractDocx(path)
	if err != nil {
		return nil, httpx.New(400, "File Word tidak valid. Gunakan .docx yang dapat dibuka di Microsoft Word / Google Docs.")
	}
	questions := parseText(text)
	return &Result{
		Questions:          questions,
		Warnings:           examcsv.Validate(questions),
		ExtractedImages:    []string{},
		EmbeddedImageCount: images,
	}, nil
}

func extractDocx(path string) (string, int, error) {
	zr, err := zip.OpenReader(path)
	if err != nil {
		raw, rerr := os.ReadFile(path)
		if rerr != nil {
			return "", 0, err
		}
		zr2, err2 := zip.NewReader(bytes.NewReader(raw), int64(len(raw)))
		if err2 != nil {
			return "", 0, err
		}
		return readDocumentXML(zr2.File)
	}
	defer zr.Close()
	return readDocumentXML(zr.File)
}

func readDocumentXML(files []*zip.File) (string, int, error) {
	var doc *zip.File
	images := 0
	for _, f := range files {
		if f.Name == "word/document.xml" {
			doc = f
		}
		if strings.HasPrefix(f.Name, "word/media/") {
			images++
		}
	}
	if doc == nil {
		return "", images, httpx.New(400, "File Word tidak valid.")
	}
	rc, err := doc.Open()
	if err != nil {
		return "", images, err
	}
	defer rc.Close()
	raw, err := io.ReadAll(rc)
	if err != nil {
		return "", images, err
	}
	return xmlToText(raw), images, nil
}

func xmlToText(raw []byte) string {
	dec := xml.NewDecoder(bytes.NewReader(raw))
	var b strings.Builder
	for {
		tok, err := dec.Token()
		if err != nil {
			break
		}
		switch t := tok.(type) {
		case xml.StartElement:
			if t.Name.Local == "p" || t.Name.Local == "br" || t.Name.Local == "tab" {
				if t.Name.Local == "p" {
					b.WriteByte('\n')
				} else if t.Name.Local == "br" {
					b.WriteByte('\n')
				} else {
					b.WriteByte(' ')
				}
			}
		case xml.CharData:
			b.Write(t)
		}
	}
	text := strings.ReplaceAll(b.String(), "\u00a0", " ")
	text = regexp.MustCompile(`[ \t]+\n`).ReplaceAllString(text, "\n")
	text = regexp.MustCompile(`\n{3,}`).ReplaceAllString(text, "\n\n")
	return strings.TrimSpace(text)
}

func parseText(text string) []examcsv.Question {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}
	if soalSplit.MatchString(text) {
		return parseSplit(soalSplit.Split(text, -1))
	}
	if noSoalHdr.MatchString(text) {
		parts := splitKeepSep(text, noSoalStart)
		return parseSplit(parts)
	}
	idxs := numbered.FindAllStringIndex(text, -1)
	if len(idxs) >= 1 {
		parts := []string{}
		for i, loc := range idxs {
			start := loc[0]
			end := len(text)
			if i+1 < len(idxs) {
				end = idxs[i+1][0]
			}
			block := numbered.ReplaceAllString(text[start:end], "")
			parts = append(parts, strings.TrimSpace(block))
		}
		return parseSplit(parts)
	}
	q := parseBlock(text, 1)
	if q == nil {
		return nil
	}
	return []examcsv.Question{*q}
}

func splitKeepSep(text string, re *regexp.Regexp) []string {
	idxs := re.FindAllStringIndex(text, -1)
	if len(idxs) == 0 {
		return []string{text}
	}
	parts := []string{}
	if idxs[0][0] > 0 {
		parts = append(parts, strings.TrimSpace(text[:idxs[0][0]]))
	}
	for i, loc := range idxs {
		end := len(text)
		if i+1 < len(idxs) {
			end = idxs[i+1][0]
		}
		parts = append(parts, strings.TrimSpace(text[loc[0]:end]))
	}
	return parts
}

func parseSplit(parts []string) []examcsv.Question {
	out := []examcsv.Question{}
	order := 1
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		q := parseBlock(part, order)
		if q == nil {
			continue
		}
		out = append(out, *q)
		order++
	}
	return out
}

func parseBlock(block string, order int) *examcsv.Question {
	lines := strings.Split(strings.ReplaceAll(block, "\r\n", "\n"), "\n")
	prompt := []string{}
	options := []examcsv.Option{}
	var explanation []string
	correctLetter := ""
	inExpl := false
	currentOpt := -1
	for _, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}
		if m := kunciLine.FindStringSubmatch(line); len(m) > 1 {
			correctLetter = strings.ToUpper(m[1])
			currentOpt = -1
			continue
		}
		if m := pembahasan.FindStringSubmatch(line); len(m) > 0 {
			inExpl = true
			currentOpt = -1
			if strings.TrimSpace(m[1]) != "" {
				explanation = append(explanation, strings.TrimSpace(m[1]))
			}
			continue
		}
		if m := optionLine.FindStringSubmatch(line); len(m) > 0 {
			letter := firstGroup(m[1:4])
			label := strings.TrimSpace(m[4])
			options = append(options, examcsv.Option{Label: label})
			currentOpt = len(options) - 1
			_ = letter
			inExpl = false
			continue
		}
		if inExpl {
			explanation = append(explanation, line)
			continue
		}
		if currentOpt >= 0 {
			options[currentOpt].Label += " " + line
			continue
		}
		prompt = append(prompt, line)
	}
	if correctLetter != "" {
		idx := int(correctLetter[0] - 'A')
		if idx >= 0 && idx < len(options) {
			options[idx].IsCorrect = true
		}
	}
	p := strings.TrimSpace(strings.Join(prompt, " "))
	if p == "" && len(options) < 2 {
		return nil
	}
	q := &examcsv.Question{Prompt: p, Order: order, Options: options}
	if len(explanation) > 0 {
		exp := strings.TrimSpace(strings.Join(explanation, " "))
		q.Explanation = &exp
	} else {
		fallback := "-"
		q.Explanation = &fallback
	}
	return q
}

func firstGroup(groups []string) string {
	for _, g := range groups {
		if g != "" {
			return strings.ToUpper(g)
		}
	}
	return ""
}

func ParseQuestionsJSON(raw []examcsv.Question) []examcsv.Question {
	for i := range raw {
		if raw[i].Order == 0 {
			raw[i].Order = i + 1
		}
	}
	return raw
}

func Itoa(n int) string { return strconv.Itoa(n) }
