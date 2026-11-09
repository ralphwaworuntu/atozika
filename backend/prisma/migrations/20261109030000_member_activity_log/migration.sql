-- CreateTable
CREATE TABLE "MemberActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberActivityLog_userId_createdAt_idx" ON "MemberActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MemberActivityLog_kind_createdAt_idx" ON "MemberActivityLog"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "MemberActivityLog" ADD CONSTRAINT "MemberActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
