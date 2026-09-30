-- AlterTable
ALTER TABLE "MembershipPackage" ADD COLUMN "cermatQuota" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "cermatQuota" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Transaction" ADD COLUMN "cermatUsed" INTEGER NOT NULL DEFAULT 0;
