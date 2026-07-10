/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `RestList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RestList_userId_key" ON "RestList"("userId");
