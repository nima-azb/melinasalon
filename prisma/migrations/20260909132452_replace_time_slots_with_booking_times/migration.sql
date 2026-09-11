/*
  Warnings:

  - The values [PENDING] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paymentStatus` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlotId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the `time_slots` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endsAt` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_timeSlotId_fkey";

-- DropIndex
DROP INDEX "bookings_timeSlotId_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "paymentStatus",
DROP COLUMN "timeSlotId",
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- DropTable
DROP TABLE "time_slots";

-- CreateTable
CREATE TABLE "blocked_times" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_times_startsAt_idx" ON "blocked_times"("startsAt");

-- CreateIndex
CREATE INDEX "blocked_times_endsAt_idx" ON "blocked_times"("endsAt");

-- CreateIndex
CREATE INDEX "bookings_startsAt_idx" ON "bookings"("startsAt");

-- CreateIndex
CREATE INDEX "bookings_endsAt_idx" ON "bookings"("endsAt");
