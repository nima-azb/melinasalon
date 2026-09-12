-- CreateEnum
CREATE TYPE "AiWorkflowType" AS ENUM ('CUSTOM', 'RECOMMENDATION');

-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "workflowType" "AiWorkflowType" NOT NULL DEFAULT 'CUSTOM';

-- CreateIndex
CREATE INDEX "generations_userId_workflowType_idx" ON "generations"("userId", "workflowType");
