package admin

import (
	"strings"

	"atozika/internal/httpx"
	"atozika/internal/sitecontent"

	"github.com/gofiber/fiber/v2"
)

func (h *Handler) GetHomeContent(c *fiber.Ctx) error {
	return httpx.Success(c, sitecontent.LoadHome(h.DB))
}

func (h *Handler) PutHomeContent(c *fiber.Ctx) error {
	var body sitecontent.HomeCopy
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data beranda tidak valid")
	}
	body = normalizeHome(body)
	if strings.TrimSpace(body.Hero.Title) == "" {
		return httpx.New(400, "Judul hero wajib diisi")
	}
	if err := sitecontent.SaveHome(h.DB, body); err != nil {
		return httpx.New(500, "Gagal menyimpan beranda")
	}
	return httpx.Success(c, sitecontent.LoadHome(h.DB))
}

func (h *Handler) GetProfileContent(c *fiber.Ctx) error {
	return httpx.Success(c, sitecontent.LoadProfile(h.DB))
}

func (h *Handler) PutProfileContent(c *fiber.Ctx) error {
	var body sitecontent.ProfileCopy
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data profil tidak valid")
	}
	body.Title = strings.TrimSpace(body.Title)
	body.Body = strings.TrimSpace(body.Body)
	body.Highlights = cleanLines(body.Highlights)
	if body.Title == "" || body.Body == "" {
		return httpx.New(400, "Judul dan isi profil wajib diisi")
	}
	if err := sitecontent.SaveProfile(h.DB, body); err != nil {
		return httpx.New(500, "Gagal menyimpan profil")
	}
	return httpx.Success(c, sitecontent.LoadProfile(h.DB))
}

func (h *Handler) GetMemberContent(c *fiber.Ctx) error {
	return httpx.Success(c, sitecontent.LoadMember(h.DB))
}

func (h *Handler) PutMemberContent(c *fiber.Ctx) error {
	var body sitecontent.MemberCopy
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data tampilan member tidak valid")
	}
	body.GreetingMorning = strings.TrimSpace(body.GreetingMorning)
	body.Subtitle = strings.TrimSpace(body.Subtitle)
	if body.GreetingMorning == "" || len(body.SkillTiles) == 0 {
		return httpx.New(400, "Sapaan dan kartu keterampilan wajib diisi")
	}
	if err := sitecontent.SaveMember(h.DB, body); err != nil {
		return httpx.New(500, "Gagal menyimpan tampilan member")
	}
	return httpx.Success(c, sitecontent.LoadMember(h.DB))
}

func (h *Handler) GetBoards(c *fiber.Ctx) error {
	return httpx.Success(c, sitecontent.LoadBoards(h.DB))
}

func (h *Handler) PutBoards(c *fiber.Ctx) error {
	var body sitecontent.Boards
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data jadwal tidak valid")
	}
	if body.Schedules == nil {
		body.Schedules = sitecontent.DefaultBoards().Schedules
	}
	if body.Openings == nil {
		body.Openings = sitecontent.DefaultBoards().Openings
	}
	if err := sitecontent.SaveBoards(h.DB, body); err != nil {
		return httpx.New(500, "Gagal menyimpan jadwal")
	}
	return httpx.Success(c, sitecontent.LoadBoards(h.DB))
}

func (h *Handler) GetFitness(c *fiber.Ctx) error {
	return httpx.Success(c, sitecontent.LoadFitness(h.DB))
}

func (h *Handler) PutFitness(c *fiber.Ctx) error {
	var body sitecontent.FitnessCopy
	if err := c.BodyParser(&body); err != nil {
		return httpx.New(400, "Data kalkulator jasmani tidak valid")
	}
	if strings.TrimSpace(body.AgeTitle) == "" || len(body.Items) == 0 {
		return httpx.New(400, "Judul dan item jasmani wajib diisi")
	}
	if body.BmiMin <= 0 || body.BmiMax <= body.BmiMin {
		return httpx.New(400, "Rentang BMI tidak valid")
	}
	if err := sitecontent.SaveFitness(h.DB, body); err != nil {
		return httpx.New(500, "Gagal menyimpan kalkulator jasmani")
	}
	return httpx.Success(c, sitecontent.LoadFitness(h.DB))
}

func normalizeHome(body sitecontent.HomeCopy) sitecontent.HomeCopy {
	body.Hero.Title = strings.TrimSpace(body.Hero.Title)
	body.Hero.Subtitle = strings.TrimSpace(body.Hero.Subtitle)
	body.Hero.CtaPrimary.Label = strings.TrimSpace(body.Hero.CtaPrimary.Label)
	body.Hero.CtaPrimary.Href = strings.TrimSpace(body.Hero.CtaPrimary.Href)
	body.Hero.CtaSecondary.Label = strings.TrimSpace(body.Hero.CtaSecondary.Label)
	body.Hero.CtaSecondary.Href = strings.TrimSpace(body.Hero.CtaSecondary.Href)
	body.About.Paragraphs = cleanLines(body.About.Paragraphs)
	body.About.Advantages = cleanLines(body.About.Advantages)
	body.Challenges.Items = cleanLines(body.Challenges.Items)
	body.Reasons = cleanLines(body.Reasons)
	for i := range body.Programs.Tiers {
		body.Programs.Tiers[i].Features = cleanLines(body.Programs.Tiers[i].Features)
	}
	return body
}

func cleanLines(items []string) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}
