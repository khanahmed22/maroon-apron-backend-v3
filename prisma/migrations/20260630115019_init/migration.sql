/*
  Warnings:

  - You are about to drop the column `restId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "restId",
ADD COLUMN     "subdomain" TEXT;
