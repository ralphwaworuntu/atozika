package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	NodeEnv          string
	Port             string
	DatabaseURL      string
	JWTAccessSecret  string
	JWTRefreshSecret string
	AccessTTLMinutes int
	RefreshTTLDays   int
	FrontendURL      string
	AppURL           string
	RedisURL         string
	SMTPHost         string
	SMTPPort         int
	SMTPUser         string
	SMTPPass         string
	SMTPFromName     string
	SMTPFromEmail    string
	UploadsDir       string
}

func Load() Config {
	for _, p := range []string{".env", "../backend/.env", "backend/.env"} {
		if _, err := os.Stat(p); err == nil {
			_ = godotenv.Load(p)
			break
		}
	}
	_ = godotenv.Load()
	uploads := getenv("UPLOADS_DIR", "")
	if uploads == "" {
		if st, err := os.Stat("../backend/uploads"); err == nil && st.IsDir() {
			uploads = "../backend/uploads"
		} else {
			uploads = "uploads"
		}
	}
	return Config{
		NodeEnv:          getenv("NODE_ENV", "development"),
		Port:             getenv("PORT", "5000"),
		DatabaseURL:      must("DATABASE_URL"),
		JWTAccessSecret:  must("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: must("JWT_REFRESH_SECRET"),
		AccessTTLMinutes: atoi(getenv("ACCESS_TOKEN_TTL_MINUTES", "1440")),
		RefreshTTLDays:   atoi(getenv("REFRESH_TOKEN_TTL_DAYS", "30")),
		FrontendURL:      getenv("FRONTEND_URL", "http://localhost:5174"),
		AppURL:           getenv("APP_URL", ""),
		RedisURL:         getenv("REDIS_URL", ""),
		SMTPHost:         getenv("SMTP_HOST", ""),
		SMTPPort:         atoi(getenv("SMTP_PORT", "587")),
		SMTPUser:         getenv("SMTP_USER", ""),
		SMTPPass:         getenv("SMTP_PASS", ""),
		SMTPFromName:     getenv("SMTP_FROM_NAME", "ATOZIKA"),
		SMTPFromEmail:    getenv("SMTP_FROM_EMAIL", ""),
		UploadsDir:       uploads,
	}
}

func (c Config) FrontendOrigins() []string {
	parts := strings.Split(c.FrontendURL, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func must(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("missing required env: " + key)
	}
	return v
}

func atoi(v string) int {
	n, _ := strconv.Atoi(v)
	return n
}
