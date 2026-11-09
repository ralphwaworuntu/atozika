package activity

import (
	"encoding/json"
	"strings"
	"time"

	"atozika/internal/id"
	"atozika/internal/models"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

const (
	KindLogin          = "LOGIN"
	KindPage           = "PAGE"
	KindTryoutStart    = "TRYOUT_START"
	KindTryoutSubmit   = "TRYOUT_SUBMIT"
	KindPracticeSubmit = "PRACTICE_SUBMIT"
	KindCermat         = "CERMAT"
	KindMaterialOpen   = "MATERIAL_OPEN"
)

func Record(db *gorm.DB, userID, kind, title, path string, meta map[string]any) {
	if db == nil || strings.TrimSpace(userID) == "" || strings.TrimSpace(kind) == "" {
		return
	}
	title = strings.TrimSpace(title)
	if title == "" {
		title = kind
	}
	var raw datatypes.JSON
	if len(meta) > 0 {
		if b, err := json.Marshal(meta); err == nil {
			raw = datatypes.JSON(b)
		}
	}
	var pathPtr *string
	if p := strings.TrimSpace(path); p != "" {
		pathPtr = &p
	}
	_ = db.Create(&models.MemberActivityLog{
		ID:        id.New(),
		UserID:    userID,
		Kind:      kind,
		Title:     title,
		Path:      pathPtr,
		Meta:      raw,
		CreatedAt: time.Now(),
	}).Error
}
