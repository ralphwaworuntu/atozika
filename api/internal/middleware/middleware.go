package middleware

import (
	"context"
	"fmt"
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
		token, err := jwt.ParseWithClaims(raw, claims, HMACSecret(cfg.JWTAccessSecret))
		if err != nil || !token.Valid || claims.Subject == "" {
			return httpx.New(401, "Invalid or expired token")
		}
		var account models.User
		if err := db.Select(`id, email, role, name, "referralCode", "isActive", "isEmailVerified", "sessionVersion"`).First(&account, "id = ?", claims.Subject).Error; err != nil {
			return httpx.New(403, "Akun Anda dinonaktifkan atau tidak ditemukan.")
		}
		if !account.IsActive || !account.IsEmailVerified {
			return httpx.New(403, "Akun Anda dinonaktifkan atau tidak ditemukan.")
		}
		if claims.SessionVersion != account.SessionVersion {
			return httpx.New(401, "Sesi Anda telah berakhir. Silakan masuk lagi.")
		}
		c.Locals("user", &UserCtx{
			ID:              account.ID,
			Email:           account.Email,
			Role:            account.Role,
			Name:            account.Name,
			ReferralCode:    account.ReferralCode,
			IsEmailVerified: account.IsEmailVerified,
			SessionVersion:  account.SessionVersion,
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
		if n > 10 {
			return c.Status(429).JSON(fiber.Map{
				"status":  "error",
				"message": "Too many requests, please try again later.",
			})
		}
		return c.Next()
	}
}

func HMACSecret(secret string) jwt.Keyfunc {
	return func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	}
}

func NoStore(c *fiber.Ctx) error {
	c.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	c.Set("Pragma", "no-cache")
	c.Set("Expires", "0")
	return c.Next()
}
