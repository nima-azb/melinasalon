-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'REGISTER');

-- AlterTable
ALTER TABLE "otp_codes" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT;

-- CreateIndex
CREATE INDEX "otp_codes_phoneNumber_purpose_idx" ON "otp_codes"("phoneNumber", "purpose");
