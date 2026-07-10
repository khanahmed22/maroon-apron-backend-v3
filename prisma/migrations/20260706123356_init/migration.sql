/*
  Warnings:

  - The `stockAmount` column on the `Inventory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "stockAmount",
ADD COLUMN     "stockAmount" INTEGER;
