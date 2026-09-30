package materials

var Categories = []string{"POLRI", "TNI", "Kedinasan", "BUMN", "PCPN-BI"}

func ValidCategory(value string) bool {
	for _, item := range Categories {
		if item == value {
			return true
		}
	}
	return false
}

func Ordered(selected []string) []string {
	allowed := map[string]struct{}{}
	for _, item := range selected {
		if ValidCategory(item) {
			allowed[item] = struct{}{}
		}
	}
	out := make([]string, 0, len(allowed))
	for _, item := range Categories {
		if _, ok := allowed[item]; ok {
			out = append(out, item)
		}
	}
	return out
}
