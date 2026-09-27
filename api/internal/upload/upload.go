package upload

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"atozika/internal/httpx"
	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
)

type SavedFile struct {
	Path      string
	PublicURL string
}

func Save(c *fiber.Ctx, field, destDir, publicPrefix string, maxBytes int64, allowed map[string]bool) (*SavedFile, error) {
	fh, err := c.FormFile(field)
	if err != nil {
		return nil, nil
	}
	if maxBytes > 0 && fh.Size > maxBytes {
		return nil, httpx.New(400, "Ukuran file melebihi batas.")
	}
	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if allowed != nil && !allowed[ext] {
		return nil, httpx.New(400, "Format file tidak didukung.")
	}
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return nil, err
	}
	base := strings.TrimSuffix(filepath.Base(fh.Filename), ext)
	base = slug(base)
	name := fmt.Sprintf("%s-%d%s", base, time.Now().UnixMilli(), ext)
	full := filepath.Join(destDir, name)
	if err := c.SaveFile(fh, full); err != nil {
		return nil, err
	}
	if isImage(ext) {
		_ = resizeMax(full, 1024)
	}
	rel := filepath.ToSlash(filepath.Join(publicPrefix, name))
	if !strings.HasPrefix(rel, "/") {
		rel = "/" + rel
	}
	return &SavedFile{Path: full, PublicURL: rel}, nil
}

func PublicFromDisk(uploadsRoot, fullPath string) string {
	root := filepath.ToSlash(uploadsRoot)
	file := filepath.ToSlash(fullPath)
	if strings.HasPrefix(file, root) {
		return "/uploads" + strings.TrimPrefix(file, root)
	}
	return "/uploads/" + filepath.Base(fullPath)
}

func resizeMax(path string, max int) error {
	img, err := imaging.Open(path, imaging.AutoOrientation(true))
	if err != nil {
		return err
	}
	w := img.Bounds().Dx()
	h := img.Bounds().Dy()
	if w <= max && h <= max {
		return nil
	}
	resized := imaging.Fit(img, max, max, imaging.Lanczos)
	return imaging.Save(resized, path)
}

func isImage(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
		return true
	}
	return false
}

func slug(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	var b strings.Builder
	for _, r := range v {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == ' ' || r == '_' || r == '-' {
			b.WriteByte('-')
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "file"
	}
	return out
}

func CopyTo(dst io.Writer, src io.Reader) error {
	_, err := io.Copy(dst, src)
	return err
}

var (
	Images = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	Proof  = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".pdf": true}
	CSV    = map[string]bool{".csv": true}
	Word   = map[string]bool{".doc": true, ".docx": true}
)
