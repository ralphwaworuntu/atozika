-- News categories follow the admin-configured member news sections.
ALTER TABLE "NewsArticle" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "NewsArticle" ALTER COLUMN "kind" TYPE TEXT USING "kind"::text;
ALTER TABLE "NewsArticle" ALTER COLUMN "kind" SET DEFAULT 'NEWS';
DROP TYPE IF EXISTS "NewsKind";

-- Regular practice and Ujian attempts are stored separately.
ALTER TABLE "TryoutResult" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "PracticeResult" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'REGULAR';
CREATE INDEX "TryoutResult_userId_mode_idx" ON "TryoutResult"("userId", "mode");
CREATE INDEX "PracticeResult_userId_mode_idx" ON "PracticeResult"("userId", "mode");

-- Module quota consumption: one row per material opened under a membership.
CREATE TABLE "MaterialAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaterialAccess_userId_materialId_transactionId_key" ON "MaterialAccess"("userId", "materialId", "transactionId");
CREATE INDEX "MaterialAccess_userId_idx" ON "MaterialAccess"("userId");
ALTER TABLE "MaterialAccess" ADD CONSTRAINT "MaterialAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialAccess" ADD CONSTRAINT "MaterialAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialAccess" ADD CONSTRAINT "MaterialAccess_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
