/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `FixedRate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[restId]` on the table `FixedRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FixedRate_userId_key" ON "FixedRate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedRate_restId_key" ON "FixedRate"("restId");
