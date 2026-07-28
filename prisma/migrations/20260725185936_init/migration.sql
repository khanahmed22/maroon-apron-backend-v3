/*
  Warnings:

  - The `lat` column on the `RestList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `long` column on the `RestList` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RestList" DROP COLUMN "lat",
ADD COLUMN     "lat" INTEGER,
DROP COLUMN "long",
ADD COLUMN     "long" INTEGER;
