/*
  Warnings:

  - You are about to alter the column `orderTotal` on the `Orders` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Orders" ALTER COLUMN "orderTotal" SET DATA TYPE INTEGER;
