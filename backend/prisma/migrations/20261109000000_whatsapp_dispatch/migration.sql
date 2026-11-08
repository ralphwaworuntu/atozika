-- Queue of parent WhatsApp reports. Rows stay when credentials are not set yet.
CREATE TABLE "WhatsAppDispatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "parentPhone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "WhatsAppDispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppDispatch_kind_refId_key" ON "WhatsAppDispatch"("kind", "refId");
CREATE INDEX "WhatsAppDispatch_createdAt_idx" ON "WhatsAppDispatch"("createdAt");

ALTER TABLE "WhatsAppDispatch" ADD CONSTRAINT "WhatsAppDispatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
