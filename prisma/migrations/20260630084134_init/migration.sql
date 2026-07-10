/*
  Warnings:

  - You are about to drop the column `userId` on the `Orders` table. All the data in the column will be lost.
  - You are about to drop the column `restId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "restId",
ADD COLUMN     "subdomain" TEXT;
