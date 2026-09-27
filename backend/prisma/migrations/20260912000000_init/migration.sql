-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('MEMBERSHIP', 'ADDON');

-- CreateEnum
CREATE TYPE "NewsKind" AS ENUM ('NEWS', 'INSIGHT');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PDF', 'VIDEO', 'LINK');

-- CreateEnum
CREATE TYPE "CalculatorType" AS ENUM ('ANGKA_HILANG', 'GENERAL');

-- CreateEnum
CREATE TYPE "ExamBlockType" AS ENUM ('TRYOUT', 'PRACTICE', 'CERMAT');

-- CreateEnum
CREATE TYPE "CermatMode" AS ENUM ('NUMBER', 'LETTER', 'IMAGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "address" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentOccupation" TEXT,
    "parentAddress" TEXT,
    "healthIssues" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "targetAll" BOOLEAN NOT NULL DEFAULT true,
    "targetPackageIds" JSONB,
    "createdById" TEXT,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamControlConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "targetAll" BOOLEAN NOT NULL DEFAULT true,
    "targetPackageIds" JSONB,
    "tryoutQuota" INTEGER NOT NULL DEFAULT 0,
    "examQuota" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamControlConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuotaUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutsUsed" INTEGER NOT NULL DEFAULT 0,
    "examsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "published" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "NewsKind" NOT NULL DEFAULT 'NEWS',

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingStat" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "LandingStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "role" TEXT,
    "avatarUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "description" TEXT,

    CONSTRAINT "YoutubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryoutCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryoutSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tryout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 90,
    "totalQuestions" INTEGER NOT NULL DEFAULT 100,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "freeForNewMembers" BOOLEAN NOT NULL DEFAULT true,
    "freePackageIds" JSONB NOT NULL DEFAULT '[]',
    "sessionOrder" INTEGER,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "subCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tryout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutQuestion" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "explanation" TEXT,
    "explanationImageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "multipleCorrect" BOOLEAN NOT NULL DEFAULT false,
    "tryoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryoutQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryoutOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryoutResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryoutAnswer" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "selectedOptionIds" JSONB,
    "userId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryoutAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSubSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSubSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "level" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "freeForNewMembers" BOOLEAN NOT NULL DEFAULT true,
    "freePackageIds" JSONB NOT NULL DEFAULT '[]',
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "subSubCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "explanation" TEXT,
    "explanationImageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "multipleCorrect" BOOLEAN NOT NULL DEFAULT false,
    "setId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAnswer" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "selectedOptionIds" JSONB,
    "isCorrect" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CermatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT,
    "sessionIndex" INTEGER NOT NULL DEFAULT 1,
    "totalQuestions" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "durationSeconds" INTEGER NOT NULL,
    "baseSet" TEXT NOT NULL DEFAULT '[]',
    "mode" "CermatMode" NOT NULL DEFAULT 'NUMBER',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CermatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CermatAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "CermatMode" NOT NULL DEFAULT 'NUMBER',
    "totalSessions" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "breakSeconds" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "averageScore" DOUBLE PRECISION,
    "totalAnswered" INTEGER,

    CONSTRAINT "CermatAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CermatAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sequence" TEXT NOT NULL,
    "userAnswer" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "CermatAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "badgeLabel" TEXT,
    "features" JSONB NOT NULL,
    "tryoutQuota" INTEGER NOT NULL DEFAULT 0,
    "moduleQuota" INTEGER NOT NULL DEFAULT 0,
    "allowTryout" BOOLEAN NOT NULL DEFAULT true,
    "allowPractice" BOOLEAN NOT NULL DEFAULT true,
    "allowCermat" BOOLEAN NOT NULL DEFAULT true,
    "accessAllPackages" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MembershipPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "addonId" TEXT,
    "targetTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'MEMBERSHIP',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "description" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "tryoutQuota" INTEGER NOT NULL DEFAULT 0,
    "tryoutUsed" INTEGER NOT NULL DEFAULT 0,
    "moduleQuota" INTEGER NOT NULL DEFAULT 0,
    "moduleUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageMaterial" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "PackageMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "tryoutBonus" INTEGER NOT NULL DEFAULT 0,
    "moduleBonus" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AddonPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonPackageMaterial" (
    "id" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "AddonPackageMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSetting" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberOverviewSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaLink" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberOverviewSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ExamBlockType" NOT NULL,
    "reason" TEXT,
    "code" TEXT NOT NULL,
    "violationCount" INTEGER NOT NULL DEFAULT 1,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychCalculatorTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CalculatorType" NOT NULL DEFAULT 'ANGKA_HILANG',
    "config" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "categoryLabel" TEXT NOT NULL DEFAULT 'Kalkulator',
    "section" TEXT,
    "sectionLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sectionOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PsychCalculatorTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychCalculatorSubmission" (
    "id" TEXT NOT NULL,
    "calculatorId" TEXT NOT NULL,
    "userId" TEXT,
    "score" INTEGER NOT NULL,
    "interpretation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychCalculatorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "MemberArea_userId_key" ON "MemberArea"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberArea_slug_key" ON "MemberArea"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuotaUsage_userId_key" ON "ExamQuotaUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TryoutCategory_slug_key" ON "TryoutCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TryoutSubCategory_slug_key" ON "TryoutSubCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tryout_slug_key" ON "Tryout"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tryout_subCategoryId_sessionOrder_key" ON "Tryout"("subCategoryId", "sessionOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeCategory_slug_key" ON "PracticeCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSubCategory_slug_key" ON "PracticeSubCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSubSubCategory_slug_key" ON "PracticeSubSubCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSet_slug_key" ON "PracticeSet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPackage_slug_key" ON "MembershipPackage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_code_key" ON "Transaction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PackageMaterial_packageId_materialId_key" ON "PackageMaterial"("packageId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "AddonPackage_slug_key" ON "AddonPackage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AddonPackageMaterial_addonId_materialId_key" ON "AddonPackageMaterial"("addonId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PsychCalculatorTemplate_slug_key" ON "PsychCalculatorTemplate"("slug");

-- AddForeignKey
ALTER TABLE "MemberArea" ADD CONSTRAINT "MemberArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuotaUsage" ADD CONSTRAINT "ExamQuotaUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutSubCategory" ADD CONSTRAINT "TryoutSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TryoutCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tryout" ADD CONSTRAINT "Tryout_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "TryoutSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutQuestion" ADD CONSTRAINT "TryoutQuestion_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutOption" ADD CONSTRAINT "TryoutOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TryoutQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutResult" ADD CONSTRAINT "TryoutResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutResult" ADD CONSTRAINT "TryoutResult_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutAnswer" ADD CONSTRAINT "TryoutAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "TryoutResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutAnswer" ADD CONSTRAINT "TryoutAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TryoutQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutAnswer" ADD CONSTRAINT "TryoutAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "TryoutOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryoutAnswer" ADD CONSTRAINT "TryoutAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSubCategory" ADD CONSTRAINT "PracticeSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PracticeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSubSubCategory" ADD CONSTRAINT "PracticeSubSubCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "PracticeSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_subSubCategoryId_fkey" FOREIGN KEY ("subSubCategoryId") REFERENCES "PracticeSubSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_setId_fkey" FOREIGN KEY ("setId") REFERENCES "PracticeSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeOption" ADD CONSTRAINT "PracticeOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeResult" ADD CONSTRAINT "PracticeResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeResult" ADD CONSTRAINT "PracticeResult_setId_fkey" FOREIGN KEY ("setId") REFERENCES "PracticeSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "PracticeResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PracticeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CermatSession" ADD CONSTRAINT "CermatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CermatSession" ADD CONSTRAINT "CermatSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CermatAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CermatAttempt" ADD CONSTRAINT "CermatAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CermatAnswer" ADD CONSTRAINT "CermatAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CermatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MembershipPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "AddonPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_targetTransactionId_fkey" FOREIGN KEY ("targetTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageMaterial" ADD CONSTRAINT "PackageMaterial_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "MembershipPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageMaterial" ADD CONSTRAINT "PackageMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPackageMaterial" ADD CONSTRAINT "AddonPackageMaterial_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "AddonPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPackageMaterial" ADD CONSTRAINT "AddonPackageMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamBlock" ADD CONSTRAINT "ExamBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychCalculatorSubmission" ADD CONSTRAINT "PsychCalculatorSubmission_calculatorId_fkey" FOREIGN KEY ("calculatorId") REFERENCES "PsychCalculatorTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychCalculatorSubmission" ADD CONSTRAINT "PsychCalculatorSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
