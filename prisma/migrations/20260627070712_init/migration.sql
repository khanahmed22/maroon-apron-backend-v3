/*
  Warnings:

  - Made the column `role` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RestList" ADD COLUMN     "metaDesc" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "restAddress" TEXT,
ADD COLUMN     "restBanner" TEXT,
ADD COLUMN     "restEmail" TEXT,
ADD COLUMN     "restFB" TEXT,
ADD COLUMN     "restInstagram" TEXT,
ADD COLUMN     "restLogo" TEXT,
ADD COLUMN     "restPhone" INTEGER,
ADD COLUMN     "restSite" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
