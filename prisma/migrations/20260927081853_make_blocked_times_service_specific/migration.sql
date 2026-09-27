/*
  Warnings:

  - Added the required column `serviceId` to the `blocked_times` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "blocked_times_endsAt_idx";

-- DropIndex
DROP INDEX "blocked_times_startsAt_idx";

-- AlterTable
ALTER TABLE "blocked_times" ADD COLUMN     "serviceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "oneBookingPerDay" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "blocked_times_serviceId_idx" ON "blocked_times"("serviceId");

-- CreateIndex
CREATE INDEX "blocked_times_serviceId_startsAt_idx" ON "blocked_times"("serviceId", "startsAt");

-- CreateIndex
CREATE INDEX "blocked_times_serviceId_endsAt_idx" ON "blocked_times"("serviceId", "endsAt");

-- AddForeignKey
ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
