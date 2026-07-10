/*
  Warnings:

  - You are about to drop the column `subdomain` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "subdomain",
ADD COLUMN     "restId" TEXT;
