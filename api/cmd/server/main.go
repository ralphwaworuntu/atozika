package main

import (
	"log"
	"os"
	"strings"
	"time"

	"atozika/internal/admin"
	"atozika/internal/auth"
	"atozika/internal/calculators"
	"atozika/internal/commerce"
	"atozika/internal/config"
	"atozika/internal/contact"
	"atozika/internal/dashboard"
	"atozika/internal/db"
	"atozika/internal/exams"
	"atozika/internal/httpx"
	"atozika/internal/landing"
	"atozika/internal/materials"
	"atozika/internal/middleware"
	"atozika/internal/referrals"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg := config.Load()
	gdb := db.Connect(cfg.DatabaseURL)
	if err := os.MkdirAll(cfg.UploadsDir, 0o755); err != nil {
		log.Fatalf("uploads: %v", err)
	}

	var rdb *redis.Client
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			log.Printf("redis url: %v", err)
		} else {
			rdb = redis.NewClient(opt)
		}
	}

	app := fiber.New(fiber.Config{
		AppName:      "ATOZIKA API",
		ErrorHandler: httpx.ErrorHandler,
		BodyLimit:    32 * 1024 * 1024,
		ProxyHeader:  fiber.HeaderXForwardedFor,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
	})
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			if origin == "" || cfg.NodeEnv != "production" {
				return true
			}
			for _, allowed := range cfg.FrontendOrigins() {
				if strings.EqualFold(origin, allowed) {
					return true
				}
			}
			return false
		},
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))

	app.Static("/uploads", cfg.UploadsDir)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"name": "ATOZIKA API", "version": "1.0.0", "status": "online"})
	})

	authH := &auth.Handler{DB: gdb, Cfg: cfg, Upload: cfg.UploadsDir}
	landH := &landing.Handler{DB: gdb}
	dashH := &dashboard.Handler{DB: gdb}
	examH := &exams.Handler{DB: gdb}
	matH := &materials.Handler{DB: gdb}
	comH := &commerce.Handler{DB: gdb, Upload: cfg.UploadsDir}
	refH := &referrals.Handler{DB: gdb, Cfg: cfg}
	ctcH := &contact.Handler{DB: gdb}
	calcH := &calculators.Handler{DB: gdb}
	admH := &admin.Handler{DB: gdb, Cfg: cfg, Upload: cfg.UploadsDir, Calc: calcH}

	protect := middleware.Auth(gdb, cfg)
	adminOnly := middleware.AdminOnly
	member := middleware.RequireMembership(gdb)
	authLimit := middleware.AuthRateLimit(rdb)

	v1 := app.Group("/api/v1", middleware.NoStore)
	v1.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "timestamp": time.Now().UTC().Format(time.RFC3339)})
	})

	ag := v1.Group("/auth")
	ag.Post("/register", authLimit, authH.Register)
	ag.Post("/verify-email", authH.VerifyEmail)
	ag.Post("/resend-verification", authLimit, authH.Resend)
	ag.Post("/login", authLimit, authH.Login)
	ag.Post("/refresh", authH.Refresh)
	ag.Post("/logout", protect, authH.Logout)
	ag.Get("/me", protect, authH.Me)
	ag.Patch("/me", protect, authH.UpdateMe)
	ag.Post("/password", protect, authH.Password)
	ag.Post("/avatar", protect, authH.Avatar)
	ag.Post("/full-body", protect, authH.FullBody)

	lg := v1.Group("/landing")
	lg.Get("/home", landH.Home)
	lg.Get("/profile", landH.Profile)
	lg.Get("/packages", landH.Packages)
	lg.Get("/gallery", landH.Gallery)
	lg.Get("/testimonials", landH.Testimonials)
	lg.Get("/contact-info", landH.ContactInfo)
	lg.Get("/parent/:slug", landH.Parent)

	dg := v1.Group("/dashboard", protect)
	dg.Get("/overview", dashH.Overview)
	dg.Get("/announcements", dashH.Announcements)
	dg.Get("/faq", dashH.FAQ)
	dg.Get("/news", dashH.News)
	dg.Get("/welcome-modal", dashH.WelcomeModal)
	dg.Get("/member-background", dashH.MemberBackground)
	dg.Get("/exam-control", dashH.ExamControl)
	dg.Post("/calculator/:slug", dashH.CalculatorLegacy)

	mountExams := func(g fiber.Router, ujian bool) {
		g.Get("/tryouts/results/:resultId/review-package", examH.PackageReview)
		g.Get("/tryouts/results/:resultId/review", examH.TryoutReview)
		g.Get("/tryouts/:slug/info", examH.TryoutInfo)
		g.Get("/tryouts", examH.ListTryouts)
		g.Post("/tryouts/:slug/start", startTryout(examH, ujian))
		g.Post("/tryouts/:slug/submit", submitTryout(examH, ujian))
		g.Get("/tryouts/:slug", examH.TryoutDetail)
		g.Get("/tryouts-history", examH.TryoutHistory)

		g.Get("/practice/results/:resultId/review", examH.PracticeReview)
		g.Get("/practice/categories", examH.PracticeCategories)
		g.Get("/practice/:slug/info", examH.PracticeInfo)
		g.Post("/practice/:slug/submit", submitPractice(examH, ujian))
		g.Get("/practice/:slug", examH.PracticeSet)
		g.Get("/practice-history", examH.PracticeHistory)

		g.Get("/blocks", examH.Blocks)
		g.Get("/block-config", examH.BlockConfig)
		g.Post("/blocks", examH.CreateBlock)
		g.Post("/blocks/unlock", examH.Unlock)
	}

	ex := v1.Group("/exams", protect)
	mountExams(ex, false)
	ex.Get("/cermat/config", examH.CermatConfig)
	ex.Post("/cermat/session", examH.CermatStart)
	ex.Post("/cermat/session/:sessionId/submit", examH.CermatSubmit)
	ex.Get("/cermat/history", examH.CermatHistory)
	ex.Get("/cermat/history/:attemptId", examH.CermatAttempt)

	uj := v1.Group("/ujian", protect)
	mountExams(uj, true)

	v1.Get("/materials/categories", protect, member, matH.Categories)
	v1.Get("/materials", protect, member, matH.List)
	v1.Post("/materials", protect, adminOnly, matH.Create)

	cg := v1.Group("/commerce")
	cg.Get("/packages", comH.Packages)
	cg.Get("/payment-info", comH.PaymentInfo)
	cg.Get("/addons", protect, comH.Addons)
	cg.Get("/membership/status", protect, comH.MembershipStatus)
	cg.Post("/transactions", protect, comH.Create)
	cg.Post("/transactions/:code/confirm", protect, comH.Confirm)
	cg.Get("/transactions", protect, comH.List)
	cg.Patch("/transactions/:id", protect, adminOnly, comH.AdminPatch)

	v1.Get("/referrals/me", protect, refH.Me)
	v1.Post("/contact", ctcH.Create)

	cal := v1.Group("/calculators", protect, member)
	cal.Get("/", calcH.Tree)
	cal.Get("/:slug", calcH.Detail)
	cal.Post("/:slug/compute", calcH.Compute)

	adm := v1.Group("/admin", protect, adminOnly)
	admin.Register(adm, admH)

	app.Use(func(c *fiber.Ctx) error {
		return httpx.New(404, "Resource not found")
	})

	addr := ":" + cfg.Port
	log.Printf("ATOZIKA API listening on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatal(err)
	}
}

func startTryout(h *exams.Handler, ujian bool) fiber.Handler {
	if ujian {
		return h.StartExamTryout
	}
	return h.StartTryout
}

func submitTryout(h *exams.Handler, ujian bool) fiber.Handler {
	if ujian {
		return h.SubmitExamTryout
	}
	return h.SubmitTryout
}

func submitPractice(h *exams.Handler, ujian bool) fiber.Handler {
	if ujian {
		return h.SubmitExamPractice
	}
	return h.SubmitPractice
}
