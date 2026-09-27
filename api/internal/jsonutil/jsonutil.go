package jsonutil

import (
	"encoding/json"

	"gorm.io/datatypes"
)

func Strings(raw datatypes.JSON) []string {
	if len(raw) == 0 {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal(raw, &out); err != nil {
		return []string{}
	}
	return out
}

func Contains(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

func MustJSON(v any) datatypes.JSON {
	b, err := json.Marshal(v)
	if err != nil {
		return datatypes.JSON([]byte("[]"))
	}
	return datatypes.JSON(b)
}
