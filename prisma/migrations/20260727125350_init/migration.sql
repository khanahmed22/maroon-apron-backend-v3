/*
  Warnings:

  - You are about to drop the column `minOrder` on the `FixedRate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FixedRate" DROP COLUMN "minOrder",
ADD COLUMN     "FixMinOrder" INTEGER;
