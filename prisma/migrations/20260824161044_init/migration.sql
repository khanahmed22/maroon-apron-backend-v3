/*
  Warnings:

  - You are about to drop the column `preoOrderMinHours` on the `RestList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RestList" DROP COLUMN "preoOrderMinHours",
ADD COLUMN     "preOrderMinHours" INTEGER;
