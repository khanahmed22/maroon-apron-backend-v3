/*
  Warnings:

  - Added the required column `areaName` to the `AreaList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cityName` to the `AreaList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AreaList" ADD COLUMN     "areaName" TEXT NOT NULL,
ADD COLUMN     "cityName" TEXT NOT NULL;
