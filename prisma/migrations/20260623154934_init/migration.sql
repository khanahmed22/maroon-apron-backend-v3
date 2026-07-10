/*
  Warnings:

  - Added the required column `userId` to the `RestList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RestList" ADD COLUMN     "userId" TEXT NOT NULL;
