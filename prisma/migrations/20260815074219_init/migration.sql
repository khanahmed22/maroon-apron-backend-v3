/*
  Warnings:

  - You are about to drop the `MerchantApps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MerchantApps" DROP CONSTRAINT "MerchantApps_userId_fkey";

-- DropTable
DROP TABLE "MerchantApps";
