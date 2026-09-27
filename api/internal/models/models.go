package models

import (
	"time"

	"gorm.io/datatypes"
)

type User struct {
	ID                     string     `gorm:"column:id;primaryKey" json:"id"`
	Name                   string     `gorm:"column:name" json:"name"`
	Email                  string     `gorm:"column:email;uniqueIndex" json:"email"`
	PasswordHash           string     `gorm:"column:passwordHash" json:"-"`
	Role                   string     `gorm:"column:role;default:MEMBER" json:"role"`
	IsActive               bool       `gorm:"column:isActive;default:true" json:"isActive"`
	IsEmailVerified        bool       `gorm:"column:isEmailVerified;default:false" json:"isEmailVerified"`
	EmailVerifiedAt        *time.Time `gorm:"column:emailVerifiedAt" json:"emailVerifiedAt"`
	EmailVerificationToken *string    `gorm:"column:emailVerificationToken" json:"-"`
	AvatarURL              *string    `gorm:"column:avatarUrl" json:"avatarUrl"`
	Phone                  *string    `gorm:"column:phone" json:"phone"`
	NationalID             *string    `gorm:"column:nationalId" json:"nationalId"`
	Address                *string    `gorm:"column:address" json:"address"`
	HeightCm               *int       `gorm:"column:heightCm" json:"heightCm"`
	WeightKg               *int       `gorm:"column:weightKg" json:"weightKg"`
	ParentName             *string    `gorm:"column:parentName" json:"parentName"`
	ParentPhone            *string    `gorm:"column:parentPhone" json:"parentPhone"`
	ParentOccupation       *string    `gorm:"column:parentOccupation" json:"parentOccupation"`
	ParentAddress          *string    `gorm:"column:parentAddress" json:"parentAddress"`
	HealthIssues           *string    `gorm:"column:healthIssues" json:"healthIssues"`
	SessionVersion         int        `gorm:"column:sessionVersion;default:0" json:"sessionVersion"`
	ReferralCode           string     `gorm:"column:referralCode;uniqueIndex" json:"referralCode"`
	Bio                    *string    `gorm:"column:bio" json:"bio"`
	BirthPlace             *string    `gorm:"column:birthPlace" json:"birthPlace"`
	BirthDate              *time.Time `gorm:"column:birthDate;type:date" json:"birthDate"`
	Gender                 *string    `gorm:"column:gender" json:"gender"`
	SchoolName             *string    `gorm:"column:schoolName" json:"schoolName"`
	SchoolGrade            *string    `gorm:"column:schoolGrade" json:"schoolGrade"`
	ParentIncome           *string    `gorm:"column:parentIncome" json:"parentIncome"`
	PrimaryTarget          *string    `gorm:"column:primaryTarget" json:"primaryTarget"`
	BackupTarget           *string    `gorm:"column:backupTarget" json:"backupTarget"`
	SurgeryHistory         *string    `gorm:"column:surgeryHistory" json:"surgeryHistory"`
	EyeCondition           *string    `gorm:"column:eyeCondition" json:"eyeCondition"`
	FullBodyURL            *string    `gorm:"column:fullBodyUrl" json:"fullBodyUrl"`
	CreatedAt              time.Time  `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt              time.Time  `gorm:"column:updatedAt" json:"updatedAt"`
}

func (User) TableName() string { return "User" }

type MemberArea struct {
	ID        string         `gorm:"column:id;primaryKey" json:"id"`
	UserID    string         `gorm:"column:userId" json:"userId"`
	Slug      string         `gorm:"column:slug;uniqueIndex" json:"slug"`
	Metadata  datatypes.JSON `gorm:"column:metadata" json:"metadata"`
	CreatedAt time.Time      `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updatedAt" json:"updatedAt"`
}

func (MemberArea) TableName() string { return "MemberArea" }

type RefreshToken struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	TokenHash string    `gorm:"column:tokenHash" json:"-"`
	UserID    string    `gorm:"column:userId" json:"userId"`
	ExpiresAt time.Time `gorm:"column:expiresAt" json:"expiresAt"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (RefreshToken) TableName() string { return "RefreshToken" }

type Announcement struct {
	ID               string         `gorm:"column:id;primaryKey" json:"id"`
	Title            string         `gorm:"column:title" json:"title"`
	Body             string         `gorm:"column:body" json:"body"`
	PublishedAt      time.Time      `gorm:"column:publishedAt" json:"publishedAt"`
	ImageURL         *string        `gorm:"column:imageUrl" json:"imageUrl"`
	TargetAll        bool           `gorm:"column:targetAll;default:true" json:"targetAll"`
	TargetPackageIDs datatypes.JSON `gorm:"column:targetPackageIds" json:"targetPackageIds"`
	CreatedByID      *string        `gorm:"column:createdById" json:"createdById"`
}

func (Announcement) TableName() string { return "Announcement" }

type ExamControlConfig struct {
	ID               string         `gorm:"column:id;primaryKey" json:"id"`
	Enabled          bool           `gorm:"column:enabled" json:"enabled"`
	TargetAll        bool           `gorm:"column:targetAll" json:"targetAll"`
	TargetPackageIDs datatypes.JSON `gorm:"column:targetPackageIds" json:"targetPackageIds"`
	TryoutQuota      int            `gorm:"column:tryoutQuota" json:"tryoutQuota"`
	ExamQuota        int            `gorm:"column:examQuota" json:"examQuota"`
	StartAt          *time.Time     `gorm:"column:startAt" json:"startAt"`
	EndAt            *time.Time     `gorm:"column:endAt" json:"endAt"`
	CreatedAt        time.Time      `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt        time.Time      `gorm:"column:updatedAt" json:"updatedAt"`
}

func (ExamControlConfig) TableName() string { return "ExamControlConfig" }

type ExamQuotaUsage struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"`
	UserID      string    `gorm:"column:userId" json:"userId"`
	TryoutsUsed int       `gorm:"column:tryoutsUsed" json:"tryoutsUsed"`
	ExamsUsed   int       `gorm:"column:examsUsed" json:"examsUsed"`
	CreatedAt   time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (ExamQuotaUsage) TableName() string { return "ExamQuotaUsage" }

type Faq struct {
	ID       string `gorm:"column:id;primaryKey" json:"id"`
	Question string `gorm:"column:question" json:"question"`
	Answer   string `gorm:"column:answer" json:"answer"`
	Order    int    `gorm:"column:order" json:"order"`
}

func (Faq) TableName() string { return "Faq" }

type NewsArticle struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Title     string    `gorm:"column:title" json:"title"`
	Slug      string    `gorm:"column:slug;uniqueIndex" json:"slug"`
	Excerpt   string    `gorm:"column:excerpt" json:"excerpt"`
	Content   string    `gorm:"column:content" json:"content"`
	CoverURL  *string   `gorm:"column:coverUrl" json:"coverUrl"`
	Published time.Time `gorm:"column:published" json:"published"`
	Kind      string    `gorm:"column:kind" json:"kind"`
}

func (NewsArticle) TableName() string { return "NewsArticle" }

type LandingStat struct {
	ID    string `gorm:"column:id;primaryKey" json:"id"`
	Label string `gorm:"column:label" json:"label"`
	Value int    `gorm:"column:value" json:"value"`
}

func (LandingStat) TableName() string { return "LandingStat" }

type GalleryItem struct {
	ID       string `gorm:"column:id;primaryKey" json:"id"`
	Title    string `gorm:"column:title" json:"title"`
	ImageURL string `gorm:"column:imageUrl" json:"imageUrl"`
	Kind     string `gorm:"column:kind" json:"kind"`
}

func (GalleryItem) TableName() string { return "GalleryItem" }

type Testimonial struct {
	ID        string  `gorm:"column:id;primaryKey" json:"id"`
	Name      string  `gorm:"column:name" json:"name"`
	Message   string  `gorm:"column:message" json:"message"`
	Role      *string `gorm:"column:role" json:"role"`
	AvatarURL *string `gorm:"column:avatarUrl" json:"avatarUrl"`
	VideoURL  *string `gorm:"column:videoUrl" json:"videoUrl"`
}

func (Testimonial) TableName() string { return "Testimonial" }

type YoutubeVideo struct {
	ID          string  `gorm:"column:id;primaryKey" json:"id"`
	Title       string  `gorm:"column:title" json:"title"`
	EmbedURL    string  `gorm:"column:embedUrl" json:"embedUrl"`
	Thumbnail   *string `gorm:"column:thumbnail" json:"thumbnail"`
	Description *string `gorm:"column:description" json:"description"`
}

func (YoutubeVideo) TableName() string { return "YoutubeVideo" }

type ContactMessage struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Name      string    `gorm:"column:name" json:"name"`
	Email     string    `gorm:"column:email" json:"email"`
	Phone     *string   `gorm:"column:phone" json:"phone"`
	Message   string    `gorm:"column:message" json:"message"`
	Status    string    `gorm:"column:status;default:NEW" json:"status"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (ContactMessage) TableName() string { return "ContactMessage" }

type TryoutCategory struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Name      string    `gorm:"column:name" json:"name"`
	Slug      string    `gorm:"column:slug;uniqueIndex" json:"slug"`
	Thumbnail *string   `gorm:"column:thumbnail" json:"thumbnail"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (TryoutCategory) TableName() string { return "TryoutCategory" }

type TryoutSubCategory struct {
	ID         string         `gorm:"column:id;primaryKey" json:"id"`
	Name       string         `gorm:"column:name" json:"name"`
	Slug       string         `gorm:"column:slug;uniqueIndex" json:"slug"`
	CategoryID string         `gorm:"column:categoryId" json:"categoryId"`
	ImageURL   *string        `gorm:"column:imageUrl" json:"imageUrl"`
	CreatedAt  time.Time      `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"column:updatedAt" json:"updatedAt"`
	Category   TryoutCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (TryoutSubCategory) TableName() string { return "TryoutSubCategory" }

type Tryout struct {
	ID                string            `gorm:"column:id;primaryKey" json:"id"`
	Name              string            `gorm:"column:name" json:"name"`
	Slug              string            `gorm:"column:slug;uniqueIndex" json:"slug"`
	Summary           string            `gorm:"column:summary" json:"summary"`
	Description       string            `gorm:"column:description" json:"description"`
	CoverImageURL     *string           `gorm:"column:coverImageUrl" json:"coverImageUrl"`
	DurationMinutes   int               `gorm:"column:durationMinutes" json:"durationMinutes"`
	TotalQuestions    int               `gorm:"column:totalQuestions" json:"totalQuestions"`
	IsPublished       bool              `gorm:"column:isPublished" json:"isPublished"`
	IsFree            bool              `gorm:"column:isFree" json:"isFree"`
	FreeForNewMembers bool              `gorm:"column:freeForNewMembers" json:"freeForNewMembers"`
	FreePackageIDs    datatypes.JSON    `gorm:"column:freePackageIds" json:"freePackageIds"`
	SessionOrder      *int              `gorm:"column:sessionOrder" json:"sessionOrder"`
	OpenAt            *time.Time        `gorm:"column:openAt" json:"openAt"`
	CloseAt           *time.Time        `gorm:"column:closeAt" json:"closeAt"`
	SubCategoryID     string            `gorm:"column:subCategoryId" json:"subCategoryId"`
	CreatedAt         time.Time         `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt         time.Time         `gorm:"column:updatedAt" json:"updatedAt"`
	SubCategory       TryoutSubCategory `gorm:"foreignKey:SubCategoryID" json:"subCategory,omitempty"`
	Questions         []TryoutQuestion  `gorm:"foreignKey:TryoutID" json:"questions,omitempty"`
}

func (Tryout) TableName() string { return "Tryout" }

type TryoutQuestion struct {
	ID                  string         `gorm:"column:id;primaryKey" json:"id"`
	Prompt              string         `gorm:"column:prompt" json:"prompt"`
	ImageURL            *string        `gorm:"column:imageUrl" json:"imageUrl"`
	Explanation         *string        `gorm:"column:explanation" json:"explanation"`
	ExplanationImageURL *string        `gorm:"column:explanationImageUrl" json:"explanationImageUrl"`
	Order               int            `gorm:"column:order" json:"order"`
	MultipleCorrect     bool           `gorm:"column:multipleCorrect" json:"multipleCorrect"`
	TryoutID            string         `gorm:"column:tryoutId" json:"tryoutId"`
	CreatedAt           time.Time      `gorm:"column:createdAt" json:"createdAt"`
	Options             []TryoutOption `gorm:"foreignKey:QuestionID" json:"options,omitempty"`
}

func (TryoutQuestion) TableName() string { return "TryoutQuestion" }

type TryoutOption struct {
	ID         string    `gorm:"column:id;primaryKey" json:"id"`
	Label      string    `gorm:"column:label" json:"label"`
	ImageURL   *string   `gorm:"column:imageUrl" json:"imageUrl"`
	IsCorrect  bool      `gorm:"column:isCorrect" json:"isCorrect"`
	QuestionID string    `gorm:"column:questionId" json:"questionId"`
	CreatedAt  time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (TryoutOption) TableName() string { return "TryoutOption" }

type TryoutResult struct {
	ID              string         `gorm:"column:id;primaryKey" json:"id"`
	UserID          string         `gorm:"column:userId" json:"userId"`
	TryoutID        string         `gorm:"column:tryoutId" json:"tryoutId"`
	StartedAt       time.Time      `gorm:"column:startedAt" json:"startedAt"`
	CompletedAt     *time.Time     `gorm:"column:completedAt" json:"completedAt"`
	DurationSeconds *int           `gorm:"column:durationSeconds" json:"durationSeconds"`
	Score           *float64       `gorm:"column:score" json:"score"`
	CreatedAt       time.Time      `gorm:"column:createdAt" json:"createdAt"`
	Tryout          Tryout         `gorm:"foreignKey:TryoutID" json:"tryout,omitempty"`
	User            User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Answers         []TryoutAnswer `gorm:"foreignKey:ResultID" json:"answers,omitempty"`
}

func (TryoutResult) TableName() string { return "TryoutResult" }

type TryoutAnswer struct {
	ID                string         `gorm:"column:id;primaryKey" json:"id"`
	ResultID          string         `gorm:"column:resultId" json:"resultId"`
	QuestionID        string         `gorm:"column:questionId" json:"questionId"`
	OptionID          *string        `gorm:"column:optionId" json:"optionId"`
	SelectedOptionIDs datatypes.JSON `gorm:"column:selectedOptionIds" json:"selectedOptionIds"`
	UserID            string         `gorm:"column:userId" json:"userId"`
	IsCorrect         bool           `gorm:"column:isCorrect" json:"isCorrect"`
	CreatedAt         time.Time      `gorm:"column:createdAt" json:"createdAt"`
}

func (TryoutAnswer) TableName() string { return "TryoutAnswer" }

type PracticeCategory struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Name      string    `gorm:"column:name" json:"name"`
	Slug      string    `gorm:"column:slug;uniqueIndex" json:"slug"`
	ImageURL  *string   `gorm:"column:imageUrl" json:"imageUrl"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (PracticeCategory) TableName() string { return "PracticeCategory" }

type PracticeSubCategory struct {
	ID         string           `gorm:"column:id;primaryKey" json:"id"`
	Name       string           `gorm:"column:name" json:"name"`
	Slug       string           `gorm:"column:slug;uniqueIndex" json:"slug"`
	CategoryID string           `gorm:"column:categoryId" json:"categoryId"`
	ImageURL   *string          `gorm:"column:imageUrl" json:"imageUrl"`
	CreatedAt  time.Time        `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt  time.Time        `gorm:"column:updatedAt" json:"updatedAt"`
	Category   PracticeCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (PracticeSubCategory) TableName() string { return "PracticeSubCategory" }

type PracticeSubSubCategory struct {
	ID            string              `gorm:"column:id;primaryKey" json:"id"`
	Name          string              `gorm:"column:name" json:"name"`
	Slug          string              `gorm:"column:slug;uniqueIndex" json:"slug"`
	SubCategoryID string              `gorm:"column:subCategoryId" json:"subCategoryId"`
	ImageURL      *string             `gorm:"column:imageUrl" json:"imageUrl"`
	CreatedAt     time.Time           `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt     time.Time           `gorm:"column:updatedAt" json:"updatedAt"`
	SubCategory   PracticeSubCategory `gorm:"foreignKey:SubCategoryID" json:"subCategory,omitempty"`
}

func (PracticeSubSubCategory) TableName() string { return "PracticeSubSubCategory" }

type PracticeSet struct {
	ID                string                 `gorm:"column:id;primaryKey" json:"id"`
	Title             string                 `gorm:"column:title" json:"title"`
	Slug              string                 `gorm:"column:slug;uniqueIndex" json:"slug"`
	Description       string                 `gorm:"column:description" json:"description"`
	CoverImageURL     *string                `gorm:"column:coverImageUrl" json:"coverImageUrl"`
	Level             *string                `gorm:"column:level" json:"level"`
	DurationMinutes   int                    `gorm:"column:durationMinutes" json:"durationMinutes"`
	TotalQuestions    int                    `gorm:"column:totalQuestions" json:"totalQuestions"`
	IsFree            bool                   `gorm:"column:isFree" json:"isFree"`
	FreeForNewMembers bool                   `gorm:"column:freeForNewMembers" json:"freeForNewMembers"`
	FreePackageIDs    datatypes.JSON         `gorm:"column:freePackageIds" json:"freePackageIds"`
	OpenAt            *time.Time             `gorm:"column:openAt" json:"openAt"`
	CloseAt           *time.Time             `gorm:"column:closeAt" json:"closeAt"`
	SubSubCategoryID  string                 `gorm:"column:subSubCategoryId" json:"subSubCategoryId"`
	CreatedAt         time.Time              `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt         time.Time              `gorm:"column:updatedAt" json:"updatedAt"`
	SubSubCategory    PracticeSubSubCategory `gorm:"foreignKey:SubSubCategoryID" json:"subSubCategory,omitempty"`
	Questions         []PracticeQuestion     `gorm:"foreignKey:SetID" json:"questions,omitempty"`
}

func (PracticeSet) TableName() string { return "PracticeSet" }

type PracticeQuestion struct {
	ID                  string           `gorm:"column:id;primaryKey" json:"id"`
	Prompt              string           `gorm:"column:prompt" json:"prompt"`
	ImageURL            *string          `gorm:"column:imageUrl" json:"imageUrl"`
	Explanation         *string          `gorm:"column:explanation" json:"explanation"`
	ExplanationImageURL *string          `gorm:"column:explanationImageUrl" json:"explanationImageUrl"`
	Order               int              `gorm:"column:order" json:"order"`
	MultipleCorrect     bool             `gorm:"column:multipleCorrect" json:"multipleCorrect"`
	SetID               string           `gorm:"column:setId" json:"setId"`
	CreatedAt           time.Time        `gorm:"column:createdAt" json:"createdAt"`
	Options             []PracticeOption `gorm:"foreignKey:QuestionID" json:"options,omitempty"`
}

func (PracticeQuestion) TableName() string { return "PracticeQuestion" }

type PracticeOption struct {
	ID         string    `gorm:"column:id;primaryKey" json:"id"`
	Label      string    `gorm:"column:label" json:"label"`
	ImageURL   *string   `gorm:"column:imageUrl" json:"imageUrl"`
	IsCorrect  bool      `gorm:"column:isCorrect" json:"isCorrect"`
	QuestionID string    `gorm:"column:questionId" json:"questionId"`
	CreatedAt  time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (PracticeOption) TableName() string { return "PracticeOption" }

type PracticeResult struct {
	ID          string      `gorm:"column:id;primaryKey" json:"id"`
	UserID      string      `gorm:"column:userId" json:"userId"`
	SetID       string      `gorm:"column:setId" json:"setId"`
	Score       *float64    `gorm:"column:score" json:"score"`
	CompletedAt *time.Time  `gorm:"column:completedAt" json:"completedAt"`
	CreatedAt   time.Time   `gorm:"column:createdAt" json:"createdAt"`
	Set         PracticeSet `gorm:"foreignKey:SetID" json:"set,omitempty"`
	User        User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (PracticeResult) TableName() string { return "PracticeResult" }

type PracticeAnswer struct {
	ID                string         `gorm:"column:id;primaryKey" json:"id"`
	ResultID          string         `gorm:"column:resultId" json:"resultId"`
	QuestionID        string         `gorm:"column:questionId" json:"questionId"`
	OptionID          *string        `gorm:"column:optionId" json:"optionId"`
	SelectedOptionIDs datatypes.JSON `gorm:"column:selectedOptionIds" json:"selectedOptionIds"`
	IsCorrect         bool           `gorm:"column:isCorrect" json:"isCorrect"`
	UserID            string         `gorm:"column:userId" json:"userId"`
	CreatedAt         time.Time      `gorm:"column:createdAt" json:"createdAt"`
}

func (PracticeAnswer) TableName() string { return "PracticeAnswer" }

type CermatAttempt struct {
	ID              string          `gorm:"column:id;primaryKey" json:"id"`
	UserID          string          `gorm:"column:userId" json:"userId"`
	Mode            string          `gorm:"column:mode" json:"mode"`
	TotalSessions   int             `gorm:"column:totalSessions" json:"totalSessions"`
	QuestionCount   int             `gorm:"column:questionCount" json:"questionCount"`
	DurationSeconds int             `gorm:"column:durationSeconds" json:"durationSeconds"`
	BreakSeconds    int             `gorm:"column:breakSeconds" json:"breakSeconds"`
	StartedAt       time.Time       `gorm:"column:startedAt" json:"startedAt"`
	FinishedAt      *time.Time      `gorm:"column:finishedAt" json:"finishedAt"`
	AverageScore    *float64        `gorm:"column:averageScore" json:"averageScore"`
	TotalAnswered   *int            `gorm:"column:totalAnswered" json:"totalAnswered"`
	Sessions        []CermatSession `gorm:"foreignKey:AttemptID" json:"sessions,omitempty"`
	User            User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (CermatAttempt) TableName() string { return "CermatAttempt" }

type CermatSession struct {
	ID              string         `gorm:"column:id;primaryKey" json:"id"`
	UserID          string         `gorm:"column:userId" json:"userId"`
	AttemptID       *string        `gorm:"column:attemptId" json:"attemptId"`
	SessionIndex    int            `gorm:"column:sessionIndex" json:"sessionIndex"`
	TotalQuestions  int            `gorm:"column:totalQuestions" json:"totalQuestions"`
	CorrectCount    int            `gorm:"column:correctCount" json:"correctCount"`
	Score           *float64       `gorm:"column:score" json:"score"`
	DurationSeconds int            `gorm:"column:durationSeconds" json:"durationSeconds"`
	BaseSet         string         `gorm:"column:baseSet" json:"baseSet"`
	Mode            string         `gorm:"column:mode" json:"mode"`
	StartedAt       time.Time      `gorm:"column:startedAt" json:"startedAt"`
	FinishedAt      *time.Time     `gorm:"column:finishedAt" json:"finishedAt"`
	CreatedAt       time.Time      `gorm:"column:createdAt" json:"createdAt"`
	Answers         []CermatAnswer `gorm:"foreignKey:SessionID" json:"answers,omitempty"`
}

func (CermatSession) TableName() string { return "CermatSession" }

type CermatAnswer struct {
	ID            string  `gorm:"column:id;primaryKey" json:"id"`
	SessionID     string  `gorm:"column:sessionId" json:"sessionId"`
	Order         int     `gorm:"column:order" json:"order"`
	Sequence      string  `gorm:"column:sequence" json:"sequence"`
	UserAnswer    *string `gorm:"column:userAnswer" json:"userAnswer"`
	CorrectAnswer string  `gorm:"column:correctAnswer" json:"correctAnswer"`
	IsCorrect     bool    `gorm:"column:isCorrect" json:"isCorrect"`
}

func (CermatAnswer) TableName() string { return "CermatAnswer" }

type Material struct {
	ID           string    `gorm:"column:id;primaryKey" json:"id"`
	Title        string    `gorm:"column:title" json:"title"`
	Category     string    `gorm:"column:category" json:"category"`
	Type         string    `gorm:"column:type" json:"type"`
	Description  *string   `gorm:"column:description" json:"description"`
	FileURL      string    `gorm:"column:fileUrl" json:"fileUrl"`
	UploadedByID *string   `gorm:"column:uploadedById" json:"uploadedById"`
	CreatedAt    time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (Material) TableName() string { return "Material" }

type MembershipPackage struct {
	ID                string            `gorm:"column:id;primaryKey" json:"id"`
	Name              string            `gorm:"column:name" json:"name"`
	Slug              string            `gorm:"column:slug;uniqueIndex" json:"slug"`
	Category          string            `gorm:"column:category" json:"category"`
	Tagline           *string           `gorm:"column:tagline" json:"tagline"`
	Description       string            `gorm:"column:description" json:"description"`
	Price             int               `gorm:"column:price" json:"price"`
	DurationDays      int               `gorm:"column:durationDays" json:"durationDays"`
	BadgeLabel        *string           `gorm:"column:badgeLabel" json:"badgeLabel"`
	Features          datatypes.JSON    `gorm:"column:features" json:"features"`
	TryoutQuota       int               `gorm:"column:tryoutQuota" json:"tryoutQuota"`
	ModuleQuota       int               `gorm:"column:moduleQuota" json:"moduleQuota"`
	AllowTryout       bool              `gorm:"column:allowTryout" json:"allowTryout"`
	AllowPractice     bool              `gorm:"column:allowPractice" json:"allowPractice"`
	AllowCermat       bool              `gorm:"column:allowCermat" json:"allowCermat"`
	AccessAllPackages bool              `gorm:"column:accessAllPackages" json:"accessAllPackages"`
	IsActive          bool              `gorm:"column:isActive" json:"isActive"`
	Materials         []PackageMaterial `gorm:"foreignKey:PackageID" json:"materials,omitempty"`
}

func (MembershipPackage) TableName() string { return "MembershipPackage" }

type Transaction struct {
	ID                  string            `gorm:"column:id;primaryKey" json:"id"`
	Code                string            `gorm:"column:code;uniqueIndex" json:"code"`
	UserID              string            `gorm:"column:userId" json:"userId"`
	PackageID           string            `gorm:"column:packageId" json:"packageId"`
	AddonID             *string           `gorm:"column:addonId" json:"addonId"`
	TargetTransactionID *string           `gorm:"column:targetTransactionId" json:"targetTransactionId"`
	Amount              int               `gorm:"column:amount" json:"amount"`
	Method              string            `gorm:"column:method" json:"method"`
	Type                string            `gorm:"column:type" json:"type"`
	Status              string            `gorm:"column:status" json:"status"`
	ProofURL            *string           `gorm:"column:proofUrl" json:"proofUrl"`
	Description         *string           `gorm:"column:description" json:"description"`
	ActivatedAt         *time.Time        `gorm:"column:activatedAt" json:"activatedAt"`
	ExpiresAt           *time.Time        `gorm:"column:expiresAt" json:"expiresAt"`
	TryoutQuota         int               `gorm:"column:tryoutQuota" json:"tryoutQuota"`
	TryoutUsed          int               `gorm:"column:tryoutUsed" json:"tryoutUsed"`
	ModuleQuota         int               `gorm:"column:moduleQuota" json:"moduleQuota"`
	ModuleUsed          int               `gorm:"column:moduleUsed" json:"moduleUsed"`
	CreatedAt           time.Time         `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt           time.Time         `gorm:"column:updatedAt" json:"updatedAt"`
	Package             MembershipPackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	Addon               *AddonPackage     `gorm:"foreignKey:AddonID" json:"addon,omitempty"`
	User                User              `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Transaction) TableName() string { return "Transaction" }

type PackageMaterial struct {
	ID         string   `gorm:"column:id;primaryKey" json:"id"`
	PackageID  string   `gorm:"column:packageId" json:"packageId"`
	MaterialID string   `gorm:"column:materialId" json:"materialId"`
	Material   Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
}

func (PackageMaterial) TableName() string { return "PackageMaterial" }

type AddonPackage struct {
	ID          string                 `gorm:"column:id;primaryKey" json:"id"`
	Name        string                 `gorm:"column:name" json:"name"`
	Slug        string                 `gorm:"column:slug;uniqueIndex" json:"slug"`
	Description *string                `gorm:"column:description" json:"description"`
	Price       int                    `gorm:"column:price" json:"price"`
	TryoutBonus int                    `gorm:"column:tryoutBonus" json:"tryoutBonus"`
	ModuleBonus int                    `gorm:"column:moduleBonus" json:"moduleBonus"`
	IsActive    bool                   `gorm:"column:isActive" json:"isActive"`
	Materials   []AddonPackageMaterial `gorm:"foreignKey:AddonID" json:"materials,omitempty"`
}

func (AddonPackage) TableName() string { return "AddonPackage" }

type AddonPackageMaterial struct {
	ID         string   `gorm:"column:id;primaryKey" json:"id"`
	AddonID    string   `gorm:"column:addonId" json:"addonId"`
	MaterialID string   `gorm:"column:materialId" json:"materialId"`
	Material   Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
}

func (AddonPackageMaterial) TableName() string { return "AddonPackageMaterial" }

type PaymentSetting struct {
	ID            string    `gorm:"column:id;primaryKey" json:"id"`
	BankName      string    `gorm:"column:bankName" json:"bankName"`
	AccountNumber string    `gorm:"column:accountNumber" json:"accountNumber"`
	AccountHolder string    `gorm:"column:accountHolder" json:"accountHolder"`
	UpdatedAt     time.Time `gorm:"column:updatedAt" json:"updatedAt"`
	CreatedAt     time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (PaymentSetting) TableName() string { return "PaymentSetting" }

type SiteSetting struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Key       string    `gorm:"column:key;uniqueIndex" json:"key"`
	Value     string    `gorm:"column:value" json:"value"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (SiteSetting) TableName() string { return "SiteSetting" }

type Referral struct {
	ID             string    `gorm:"column:id;primaryKey" json:"id"`
	ReferrerID     string    `gorm:"column:referrerId" json:"referrerId"`
	ReferredUserID string    `gorm:"column:referredUserId" json:"referredUserId"`
	Status         string    `gorm:"column:status" json:"status"`
	CreatedAt      time.Time `gorm:"column:createdAt" json:"createdAt"`
	Referred       User      `gorm:"foreignKey:ReferredUserID" json:"referred,omitempty"`
}

func (Referral) TableName() string { return "Referral" }

type HeroSlide struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	ImageURL  string    `gorm:"column:imageUrl" json:"imageUrl"`
	Order     int       `gorm:"column:order" json:"order"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (HeroSlide) TableName() string { return "HeroSlide" }

type MemberOverviewSlide struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`
	Title     *string   `gorm:"column:title" json:"title"`
	Subtitle  *string   `gorm:"column:subtitle" json:"subtitle"`
	ImageURL  string    `gorm:"column:imageUrl" json:"imageUrl"`
	CTALabel  *string   `gorm:"column:ctaLabel" json:"ctaLabel"`
	CTALink   *string   `gorm:"column:ctaLink" json:"ctaLink"`
	Order     int       `gorm:"column:order" json:"order"`
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (MemberOverviewSlide) TableName() string { return "MemberOverviewSlide" }

type ExamBlock struct {
	ID             string     `gorm:"column:id;primaryKey" json:"id"`
	UserID         string     `gorm:"column:userId" json:"userId"`
	Type           string     `gorm:"column:type" json:"type"`
	Reason         *string    `gorm:"column:reason" json:"reason"`
	Code           string     `gorm:"column:code" json:"code"`
	ViolationCount int        `gorm:"column:violationCount" json:"violationCount"`
	BlockedAt      time.Time  `gorm:"column:blockedAt" json:"blockedAt"`
	ResolvedAt     *time.Time `gorm:"column:resolvedAt" json:"resolvedAt"`
	CreatedAt      time.Time  `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt      time.Time  `gorm:"column:updatedAt" json:"updatedAt"`
	User           User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (ExamBlock) TableName() string { return "ExamBlock" }

type PsychCalculatorTemplate struct {
	ID            string         `gorm:"column:id;primaryKey" json:"id"`
	Title         string         `gorm:"column:title" json:"title"`
	Slug          string         `gorm:"column:slug;uniqueIndex" json:"slug"`
	Description   string         `gorm:"column:description" json:"description"`
	Type          string         `gorm:"column:type" json:"type"`
	Config        datatypes.JSON `gorm:"column:config" json:"config"`
	Category      string         `gorm:"column:category" json:"category"`
	CategoryLabel string         `gorm:"column:categoryLabel" json:"categoryLabel"`
	Section       *string        `gorm:"column:section" json:"section"`
	SectionLabel  *string        `gorm:"column:sectionLabel" json:"sectionLabel"`
	Order         int            `gorm:"column:order" json:"order"`
	SectionOrder  int            `gorm:"column:sectionOrder" json:"sectionOrder"`
}

func (PsychCalculatorTemplate) TableName() string { return "PsychCalculatorTemplate" }

type PsychCalculatorSubmission struct {
	ID             string         `gorm:"column:id;primaryKey" json:"id"`
	CalculatorID   string         `gorm:"column:calculatorId" json:"calculatorId"`
	UserID         *string        `gorm:"column:userId" json:"userId"`
	Score          int            `gorm:"column:score" json:"score"`
	Interpretation string         `gorm:"column:interpretation" json:"interpretation"`
	Payload        datatypes.JSON `gorm:"column:payload" json:"payload"`
	CreatedAt      time.Time      `gorm:"column:createdAt" json:"createdAt"`
}

func (PsychCalculatorSubmission) TableName() string { return "PsychCalculatorSubmission" }
