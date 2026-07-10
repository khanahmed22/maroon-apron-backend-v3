/*
  Warnings:

  - Made the column `stockAmount` on table `Inventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "stockAmount" SET NOT NULL,
ALTER COLUMN "stockAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Orders" ALTER COLUMN "custPhone" SET DATA TYPE TEXT;
