-- AlterTable
ALTER TABLE "RefreshSession" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "RefreshSession_deviceId_idx" ON "RefreshSession"("deviceId");
