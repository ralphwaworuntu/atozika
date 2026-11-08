package sitecontent

import (
	"encoding/json"
	"strings"
	"time"

	"atozika/internal/id"
	"atozika/internal/models"

	"gorm.io/gorm"
)

const (
	KeyHome    = "site_home"
	KeyProfile = "site_profile"
	KeyMember  = "site_member"
	KeyBoards  = "site_boards"
	KeyFitness = "site_fitness"
)

type Link struct {
	Label string `json:"label"`
	Href  string `json:"href"`
}

type HomeCopy struct {
	Hero struct {
		Title        string `json:"title"`
		Subtitle     string `json:"subtitle"`
		CtaPrimary   Link   `json:"ctaPrimary"`
		CtaSecondary Link   `json:"ctaSecondary"`
	} `json:"hero"`
	About struct {
		Eyebrow          string   `json:"eyebrow"`
		Title            string   `json:"title"`
		Paragraphs       []string `json:"paragraphs"`
		AdvantagesTitle  string   `json:"advantagesTitle"`
		Advantages       []string `json:"advantages"`
	} `json:"about"`
	Challenges struct {
		Eyebrow string   `json:"eyebrow"`
		Title   string   `json:"title"`
		Items   []string `json:"items"`
	} `json:"challenges"`
	ReasonsEyebrow string   `json:"reasonsEyebrow"`
	ReasonsTitle   string   `json:"reasonsTitle"`
	Reasons        []string `json:"reasons"`
	Pillars        struct {
		Eyebrow     string `json:"eyebrow"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Items       []struct {
			Number      string `json:"number"`
			Title       string `json:"title"`
			Description string `json:"description"`
			CtaLabel    string `json:"ctaLabel"`
			CtaHref     string `json:"ctaHref"`
			Icon        string `json:"icon"`
		} `json:"items"`
	} `json:"pillars"`
	Promo struct {
		Enabled        bool   `json:"enabled"`
		Eyebrow        string `json:"eyebrow"`
		Badge          string `json:"badge"`
		Title          string `json:"title"`
		Description    string `json:"description"`
		CtaLabel       string `json:"ctaLabel"`
		CtaHref        string `json:"ctaHref"`
		EndsAt         string `json:"endsAt"`
		QuotaTotal     int    `json:"quotaTotal"`
		QuotaRemaining int    `json:"quotaRemaining"`
	} `json:"promo"`
	Programs struct {
		Title    string `json:"title"`
		Subtitle string `json:"subtitle"`
		Tiers    []struct {
			Tier          string   `json:"tier"`
			Name          string   `json:"name"`
			Price         int      `json:"price"`
			OriginalPrice int      `json:"originalPrice"`
			Features      []string `json:"features"`
			CtaLabel      string   `json:"ctaLabel"`
			CtaHref       string   `json:"ctaHref"`
			CtaVariant    string   `json:"ctaVariant"`
			Featured      bool     `json:"featured"`
			Badge         string   `json:"badge"`
		} `json:"tiers"`
	} `json:"programs"`
	Faq struct {
		Eyebrow     string `json:"eyebrow"`
		Title       string `json:"title"`
		Description string `json:"description"`
	} `json:"faq"`
	Videos struct {
		Eyebrow string `json:"eyebrow"`
		Title   string `json:"title"`
	} `json:"videos"`
}

type ProfileCopy struct {
	Title      string   `json:"title"`
	Body       string   `json:"body"`
	Highlights []string `json:"highlights"`
}

type MenuItem struct {
	To     string `json:"to"`
	Label  string `json:"label"`
	Hidden bool   `json:"hidden"`
}

type LearningTopic struct {
	Key  string `json:"key"`
	Name string `json:"name"`
	Icon string `json:"icon"`
	Tint string `json:"tint"`
	Bar  string `json:"bar"`
	Practice struct {
		Soal        int      `json:"soal"`
		Paket       int      `json:"paket"`
		Description string   `json:"description"`
		Groups      []string `json:"groups"`
	} `json:"practice"`
	Material struct {
		Count    int `json:"count"`
		Progress int `json:"progress"`
	} `json:"material"`
}

type MemberCopy struct {
	GreetingMorning   string `json:"greetingMorning"`
	GreetingAfternoon string `json:"greetingAfternoon"`
	GreetingEvening   string `json:"greetingEvening"`
	GreetingNight     string `json:"greetingNight"`
	Subtitle          string `json:"subtitle"`
	InactiveBadge     string `json:"inactiveBadge"`
	SkillsTitle       string `json:"skillsTitle"`
	ContinueTitle     string `json:"continueTitle"`
	CtaReview         string `json:"ctaReview"`
	CtaStart          string `json:"ctaStart"`
	CtaInactive       string `json:"ctaInactive"`
	CtaPayment        string `json:"ctaPayment"`
	PillarTitle       string `json:"pillarTitle"`
	PillarDescription string `json:"pillarDescription"`
	SkillTiles        []struct {
		Label string `json:"label"`
		Hint  string `json:"hint"`
		To    string `json:"to"`
	} `json:"skillTiles"`
	NewsSections []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
		Title string `json:"title"`
	} `json:"newsSections"`
	Menu   []MenuItem       `json:"menu"`
	Topics []LearningTopic  `json:"topics"`
}

type Boards struct {
	Schedules []struct {
		ID       string `json:"id"`
		Category string `json:"category"`
		Kind     string `json:"kind"`
		Title    string `json:"title"`
		Time     string `json:"time"`
	} `json:"schedules"`
	Openings []struct {
		ID       string `json:"id"`
		Category string `json:"category"`
		Agency   string `json:"agency"`
		Title    string `json:"title"`
		Window   string `json:"window"`
	} `json:"openings"`
}

type FitnessCopy struct {
	AgeTitle         string  `json:"ageTitle"`
	AgeDescription   string  `json:"ageDescription"`
	BmiTitle         string  `json:"bmiTitle"`
	BmiDescription   string  `json:"bmiDescription"`
	BmiMin           float64 `json:"bmiMin"`
	BmiMax           float64 `json:"bmiMax"`
	PhysicalTitle    string  `json:"physicalTitle"`
	PhysicalDescription string `json:"physicalDescription"`
	Items            []struct {
		Key     string  `json:"key"`
		Label   string  `json:"label"`
		Unit    string  `json:"unit"`
		Higher  bool    `json:"higher"`
		TargetL float64 `json:"targetL"`
		TargetP float64 `json:"targetP"`
		FloorL  float64 `json:"floorL"`
		FloorP  float64 `json:"floorP"`
	} `json:"items"`
}

func DefaultHome() HomeCopy {
	var home HomeCopy
	home.Hero.Title = "Menempa Intelektual, Mengunci Kelulusan."
	home.Hero.Subtitle = "Akademi Taktis Optimasi Integritas, Intelektual, dan Kepemimpinan. Persiapan elit, berstandar tinggi, dan terstruktur."
	home.Hero.CtaPrimary = Link{Label: "Gabung Sekarang", Href: "/auth/register"}
	home.Hero.CtaSecondary = Link{Label: "Paket Bimbel", Href: "/paket-bimbel"}
	home.About.Eyebrow = "Apa itu ATOZIKA?"
	home.About.Title = "Akademi untuk karakter, intelektualitas, dan kelulusan"
	home.About.Paragraphs = []string{
		"ATOZIKA menempa peserta untuk posisi strategis di pemerintahan, perbankan nasional, dan panggung politik. Bukan bimbel biasa — ini zona latihan berstandar tinggi: terukur, terstruktur, dan elit.",
		"Tryout CAT, latihan soal, tes kecermatan, materi, dan laporan orang tua berada dalam satu PWA. Setiap sesi dirancang untuk mengunci kelulusan.",
	}
	home.About.AdvantagesTitle = "Keunggulan Komando"
	home.About.Advantages = []string{
		"Simulasi ujian berdisiplin dengan anti-cheat",
		"Tracking skor, kuota, dan rekomendasi latihan",
		"Akses PWA lintas perangkat — premium multi-device",
		"Afiliasi member get member tanpa komisi rumit",
	}
	home.Challenges.Eyebrow = "Tantangan Seleksi"
	home.Challenges.Title = "Persaingan elit membutuhkan standar elit"
	home.Challenges.Items = []string{
		"Kuota sempit di TNI, Polri, kedinasan, dan BUMN",
		"Pola soal CAT yang berubah dan semakin ketat",
		"Kurang disiplin latihan, evaluasi, dan ketahanan mental",
		"Belum terbiasa dengan sistem ujian berintegritas tinggi",
	}
	home.ReasonsEyebrow = "Kenapa ATOZIKA?"
	home.ReasonsTitle = "Taktis, tegas, disiplin, berintegritas"
	home.Reasons = []string{
		"Pembentukan karakter kepemimpinan dan integritas, bukan sekadar hapalan soal.",
		"Bank soal terstandardisasi CAT untuk TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.",
		"Kurikulum taktis sesuai kisi resmi dan pola seleksi institusi elit.",
		"Simulasi ujian berdisiplin: timer, anti-cheat, dan evaluasi berkala.",
		"Laporan progres untuk orang tua serta pendampingan mentor berpengalaman.",
	}
	home.Pillars.Eyebrow = "Keunggulan Utama"
	home.Pillars.Title = "4 Pilar Seleksi Terpadu"
	home.Pillars.Description = "Empat komponen seleksi dalam satu sistem: akademik, psikotes, jasmani, dan medis."
	home.Pillars.Items = []struct {
		Number      string `json:"number"`
		Title       string `json:"title"`
		Description string `json:"description"`
		CtaLabel    string `json:"ctaLabel"`
		CtaHref     string `json:"ctaHref"`
		Icon        string `json:"icon"`
	}{
		{"01", "Akademik & SKD", "Real CAT Engine. Sistem CAT yang dibangun 1:1 dengan CAT real.", "Coba Demo Mini CAT 5 Soal", "/auth/register", "monitor"},
		{"02", "Psikotes & Kecermatan", "Tes Kecermatan dengan real timer dan live scoring. Paling canggih di NTT saat ini.", "Penjelasan Psikotes POLRI/Kedinasan", "/profil", "timer"},
		{"03", "Jasmani & Fisik", "Live Scoring terhubung dengan Mobile Coach Portal. Menampilkan dokumentasi foto/video latihan fisik.", "Dokumentasi Latihan Fisik Oepoi", "/galeri", "activity"},
		{"04", "Medis & Rikkes", "Screening Kesehatan Awal & Decision Support System (DSS) pemicu filter kelulusan.", "Pemeriksaan Gigi, Mata, BMI & Postur", "/profil", "heart"},
	}
	home.Promo.Enabled = true
	home.Promo.Eyebrow = "Pengumuman"
	home.Promo.Badge = "Soft Launching"
	home.Promo.Title = "Kuota early access ATOZIKA dibuka"
	home.Promo.Description = "Gelombang pertama pembinaan elit dengan harga soft launching, akses dashboard penuh, dan pendampingan prioritas. Kuota terbatas — amankan kursi sebelum timer habis."
	home.Promo.CtaLabel = "Ambil Kuota Sekarang"
	home.Promo.CtaHref = "/auth/register"
	home.Promo.EndsAt = "2026-10-01T23:59:59+07:00"
	home.Promo.QuotaTotal = 50
	home.Promo.QuotaRemaining = 19
	home.Programs.Title = "Katalog Program & Biaya Bimbingan"
	home.Programs.Subtitle = "Pilihan paket fleksibel disesuaikan kebutuhan calon prajurit & taruna se-NTT."
	home.Programs.Tiers = []struct {
		Tier          string   `json:"tier"`
		Name          string   `json:"name"`
		Price         int      `json:"price"`
		OriginalPrice int      `json:"originalPrice"`
		Features      []string `json:"features"`
		CtaLabel      string   `json:"ctaLabel"`
		CtaHref       string   `json:"ctaHref"`
		CtaVariant    string   `json:"ctaVariant"`
		Featured      bool     `json:"featured"`
		Badge         string   `json:"badge"`
	}{
		{"Tier 1", "Paket Starter (Tryout Only)", 79000, 129000, []string{"Akses Platform 30 Hari", "5x Simulasi CAT & Tes Kecermatan", "Masuk Leaderboard Regional NTT"}, "Checkout QRIS / E-Wallet", "/auth/register", "outline", false, ""},
		{"Tier 2", "Paket Live Class / Intensive", 499000, 699000, []string{"Akses Kelas Zoom Interaktif", "Modul Pembelajaran PDF Lengkap", "Tryout CAT Unlimited & WA Group"}, "Pilih Paket Intensive", "/auth/register", "primary", true, "Paling Populer"},
		{"Tier 3", "Paket Platinum / Offline Kupang", 2500000, 4500000, []string{"Tatap Muka Luring di Kupang", "Bimbingan Fisik Stadion Oepoi Kupang", "Audit Medis & Rikkes Awal"}, "Konsultasi WA & Booking Seat", "whatsapp", "whatsapp", false, ""},
	}
	home.Faq.Eyebrow = "FAQ"
	home.Faq.Title = "Pertanyaan yang sering diajukan"
	home.Faq.Description = "Seputar bimbel ATOZIKA, laporan orang tua, WA Magic Link, dan Garansi Sistem."
	home.Videos.Eyebrow = "Video"
	home.Videos.Title = "Cuplikan kelas dan alumni"
	return home
}

func DefaultProfile() ProfileCopy {
	return ProfileCopy{
		Title: "Profil Lembaga",
		Body:  "ATOZIKA (Akademi Taktis Optimasi Zona Integritas, Kepemimpinan & Aparatur) berfokus pada pembentukan karakter kepemimpinan, daya saing intelektual, dan persiapan ujian kompetensi tinggi untuk posisi strategis di institusi pemerintahan, perbankan nasional, hingga panggung politik.\n\nKami menempa peserta dengan standar elit: disiplin, tegas, taktis, dan berintegritas tinggi — tepat untuk lulusan yang mengejar karier di Bank Indonesia, BUMN, sekolah kedinasan favorit, TNI, Polri, dan CPNS.",
		Highlights: []string{
			"Citra taktis, tegas, disiplin, dan berintegritas tinggi.",
			"Kurikulum terstruktur untuk seleksi TNI, Polri, Kedinasan, CPNS, BUMN, dan Bank Indonesia.",
			"Satu dashboard: tryout, latihan soal, tes kecermatan, materi, dan transaksi.",
		},
	}
}

func DefaultMember() MemberCopy {
	var member MemberCopy
	member.GreetingMorning = "Selamat Pagi"
	member.GreetingAfternoon = "Selamat Siang"
	member.GreetingEvening = "Selamat Sore"
	member.GreetingNight = "Selamat Malam"
	member.Subtitle = "Satu sesi lagi lebih dekat ke kelulusan kamu."
	member.InactiveBadge = "Membership belum aktif"
	member.SkillsTitle = "Build Your Skills"
	member.ContinueTitle = "Lanjut Belajar"
	member.CtaReview = "Lanjut Belajar"
	member.CtaStart = "Mulai Tryout"
	member.CtaInactive = "Aktifkan Membership"
	member.CtaPayment = "Konfirmasi Pembayaran"
	member.PillarTitle = "4 Pilar"
	member.PillarDescription = "Rata-rata skor tryout tiap pilar. Klik untuk detail."
	member.SkillTiles = []struct {
		Label string `json:"label"`
		Hint  string `json:"hint"`
		To    string `json:"to"`
	}{
		{"Tryout", "Simulasi CAT", "/app/latihan/tryout"},
		{"Latihan Soal", "Bank soal", "/app/latihan-soal"},
		{"Kecermatan", "Timer live", "/app/tes-kecermatan"},
		{"Materi", "Modul & video", "/app/materi"},
	}
	member.NewsSections = []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
		Title string `json:"title"`
	}{
		{"edukasi", "Edukasi & Strategi", "Artikel Edukatif, Tips & Trik Lulus Fisik, Strategi HOTS"},
		{"kuota", "Kuota & Formasi", "Informasi Kuota & Formasi Penerimaan TNI, POLRI, KEDINASAN, BUMN"},
		{"alumni", "Alumni", "Kisah Inspiratif & Testimoni Kelulusan Alumni Atozika"},
	}
	member.Menu = []MenuItem{}
	member.Topics = []LearningTopic{}
	return member
}

func DefaultBoards() Boards {
	var boards Boards
	boards.Schedules = []struct {
		ID       string `json:"id"`
		Category string `json:"category"`
		Kind     string `json:"kind"`
		Title    string `json:"title"`
		Time     string `json:"time"`
	}{
		{"s1", "Akademik", "Tryout Akbar", "Simulasi CAT POLRI", "Sabtu, 27 Sep 2026 • 08.00–11.30 WITA"},
		{"s2", "Akademik", "Jam Kelas", "Kelas TWK & TIU", "Senin & Rabu • 19.00–20.30 WITA"},
		{"s3", "Jasmani", "Sesi Jasmani", "Tes fisik baku stadion", "Minggu, 28 Sep 2026 • 06.00–08.00 WITA"},
		{"s4", "Akademik", "Jam Kelas", "Bahasa Inggris kedinasan", "Jumat • 16.00–17.30 WITA"},
	}
	boards.Openings = []struct {
		ID       string `json:"id"`
		Category string `json:"category"`
		Agency   string `json:"agency"`
		Title    string `json:"title"`
		Window   string `json:"window"`
	}{
		{"o1", "Administrasi", "POLRI", "Pendaftaran Bintara & Akpol", "Dibuka 1–20 Oktober 2026"},
		{"o2", "Administrasi", "TNI", "Pendaftaran Taruna & Bintara", "Dibuka 5–25 Oktober 2026"},
		{"o3", "Urgent", "Kedinasan", "Pendaftaran IPDN, STAN, dan sekolah kedinasan", "Pantau portal resmi mulai 1 November 2026"},
	}
	return boards
}

func DefaultFitness() FitnessCopy {
	var fit FitnessCopy
	fit.AgeTitle = "Kalkulator Usia Presisi"
	fit.AgeDescription = "Usia dihitung sampai tanggal pembukaan pendidikan resmi."
	fit.BmiTitle = "Kalkulator BMI & Berat Badan Ideal"
	fit.BmiDescription = "Target penyesuaian berat badan memakai rentang BMI 18,5–24,9."
	fit.BmiMin = 18.5
	fit.BmiMax = 24.9
	fit.PhysicalTitle = "Kalkulator Skor Jasmani Baku POLRI/TNI"
	fit.PhysicalDescription = "Push-up, sit-up, pull-up, lari 12 menit, shuttle run, dan renang. Skor 0–100 adalah estimasi latihan."
	fit.Items = []struct {
		Key     string  `json:"key"`
		Label   string  `json:"label"`
		Unit    string  `json:"unit"`
		Higher  bool    `json:"higher"`
		TargetL float64 `json:"targetL"`
		TargetP float64 `json:"targetP"`
		FloorL  float64 `json:"floorL"`
		FloorP  float64 `json:"floorP"`
	}{
		{"pushup", "Push-up", "kali", true, 45, 30, 0, 0},
		{"situp", "Sit-up", "kali", true, 42, 35, 0, 0},
		{"pullup", "Pull-up", "kali", true, 14, 8, 0, 0},
		{"run", "Lari 12 menit", "meter", true, 3000, 2600, 1500, 1200},
		{"shuttle", "Shuttle Run", "detik", false, 15.5, 17, 22, 24},
		{"swim", "Renang 50 m", "detik", false, 35, 45, 90, 110},
	}
	return fit
}

func LoadHome(db *gorm.DB) HomeCopy    { return load(db, KeyHome, DefaultHome()) }
func LoadProfile(db *gorm.DB) ProfileCopy { return load(db, KeyProfile, DefaultProfile()) }
func LoadMember(db *gorm.DB) MemberCopy { return load(db, KeyMember, DefaultMember()) }
func LoadBoards(db *gorm.DB) Boards     { return load(db, KeyBoards, DefaultBoards()) }
func LoadFitness(db *gorm.DB) FitnessCopy { return load(db, KeyFitness, DefaultFitness()) }

func SaveHome(db *gorm.DB, value HomeCopy) error    { return save(db, KeyHome, value) }
func SaveProfile(db *gorm.DB, value ProfileCopy) error { return save(db, KeyProfile, value) }
func SaveMember(db *gorm.DB, value MemberCopy) error { return save(db, KeyMember, value) }
func SaveBoards(db *gorm.DB, value Boards) error     { return save(db, KeyBoards, value) }
func SaveFitness(db *gorm.DB, value FitnessCopy) error { return save(db, KeyFitness, value) }

func load[T any](db *gorm.DB, key string, fallback T) T {
	var row models.SiteSetting
	if err := db.Where("key = ?", key).First(&row).Error; err != nil || strings.TrimSpace(row.Value) == "" {
		return fallback
	}
	out := fallback
	if err := json.Unmarshal([]byte(row.Value), &out); err != nil {
		return fallback
	}
	return out
}

func save(db *gorm.DB, key string, value any) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	now := time.Now()
	var row models.SiteSetting
	if err := db.Where("key = ?", key).First(&row).Error; err != nil {
		return db.Create(&models.SiteSetting{ID: id.New(), Key: key, Value: string(raw), CreatedAt: now, UpdatedAt: now}).Error
	}
	return db.Model(&row).Updates(map[string]any{"value": string(raw), "updatedAt": now}).Error
}
