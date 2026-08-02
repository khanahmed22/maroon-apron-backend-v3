/*
  Warnings:

  - Made the column `crimsonBranding` on table `RestList` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RestList" ALTER COLUMN "crimsonBranding" SET NOT NULL,
ALTER COLUMN "crimsonBranding" SET DEFAULT true;
