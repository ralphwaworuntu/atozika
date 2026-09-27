package middleware

import (
	"context"
	"strings"
	"time"

	"atozika/internal/config"
	"atozika/internal/httpx"
	"atozika/internal/membership"
	"atozika/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Claims struct {
	Email           string `json:"email"`
	Role            string `json:"role"`
	Name            string `json:"name"`
	ReferralCode    string `json:"referralCode"`
	IsEmailVerified bool   `json:"isEmailVerified"`
	SessionVersion  int    `json:"sessionVersion"`
	jwt.RegisteredClaims
}

type UserCtx struct {
	ID              string
	Email           string
	Role            string
	Name            string
	ReferralCode    string
	IsEmailVerified bool
	SessionVersion  int
}

func Current(c *fiber.Ctx) *UserCtx {
	u, _ := c.Locals("user").(*UserCtx)
	return u
}

func Auth(db *gorm.DB, cfg config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			return httpx.New(401, "Unauthorized")
		}
		raw := strings.TrimPrefix(header, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
			return []byte(cfg.JWTAccessSecret), nil
		})
		if err != nil || !token.Valid {
			return httpx.New(401, "Invalid or expired token")
		}
		var account models.User
		if err := db.Select(`id, "isActive", "sessionVersion"`).First(&account, "id = ?", claims.Subject).Error; err != nil {
			return httpx.New(403, "Akun Anda dinonaktifkan atau tidak ditemukan.")
		}
		if !account.IsActive {
			return httpx.New(403, "Akun Anda dinonaktifkan atau tidak ditemukan.")
		}
		if claims.SessionVersion != account.SessionVersion && !membership.IsPremium(db, claims.Subject) {
			return httpx.New(401, "Sesi Anda telah berakhir karena login di perangkat lain.")
		}
		c.Locals("user", &UserCtx{
			ID:              claims.Subject,
			Email:           claims.Email,
			Role:            claims.Role,
			Name:            claims.Name,
			ReferralCode:    claims.ReferralCode,
			IsEmailVerified: claims.IsEmailVerified,
			SessionVersion:  claims.SessionVersion,
		})
		return c.Next()
	}
}

func AdminOnly(c *fiber.Ctx) error {
	u := Current(c)
	if u == nil || u.Role != "ADMIN" {
		return httpx.New(403, "Forbidden")
	}
	return c.Next()
}

func RequireMembership(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		u := Current(c)
		if u == nil {
			return httpx.New(401, "Unauthorized")
		}
		if _, err := membership.AssertActive(db, u.ID); err != nil {
			return err
		}
		return c.Next()
	}
}

func AuthRateLimit(rdb *redis.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if rdb == nil {
			return c.Next()
		}
		ctx := context.Background()
		key := "rl:auth:" + c.IP()
		n, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			return c.Next()
		}
		if n == 1 {
			_ = rdb.Expire(ctx, key, 15*time.Minute).Err()
		}
		if n > 30 {
			return c.Status(429).JSON(fiber.Map{
				"status":  "error",
				"message": "Too many requests, please try again later.",
			})
		}
		return c.Next()
	}
}

func NoStore(c *fiber.Ctx) error {
	c.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	c.Set("Pragma", "no-cache")
	c.Set("Expires", "0")
	return c.Next()
}
