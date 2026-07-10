/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `MerchantApps` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `MerchantApps` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MerchantApps" ALTER COLUMN "status" SET DEFAULT 'submitted';

-- CreateIndex
CREATE UNIQUE INDEX "MerchantApps_userId_key" ON "MerchantApps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantApps_email_key" ON "MerchantApps"("email");
