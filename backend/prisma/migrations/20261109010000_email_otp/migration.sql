-- A 6-digit OTP is shared across accounts, so the token column can no longer be unique.
DROP INDEX IF EXISTS "User_emailVerificationToken_key";

ALTER TABLE "User" ADD COLUMN "emailOtpExpiresAt" TIMESTAMP(3);
