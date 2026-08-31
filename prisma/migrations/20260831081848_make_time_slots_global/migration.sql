/*
  Warnings:

  - You are about to drop the column `serviceId` on the `time_slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[startsAt]` on the table `time_slots` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "time_slots" DROP CONSTRAINT "time_slots_serviceId_fkey";

-- DropIndex
DROP INDEX "time_slots_serviceId_startsAt_key";

-- AlterTable
ALTER TABLE "time_slots" DROP COLUMN "serviceId";

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_startsAt_key" ON "time_slots"("startsAt");
