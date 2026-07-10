/*
  Warnings:

  - Made the column `merchant_verify` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "merchant_verify" SET NOT NULL,
ALTER COLUMN "merchant_verify" SET DEFAULT false;
