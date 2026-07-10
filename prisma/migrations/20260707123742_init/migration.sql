/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `RestList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RestList_customDomain_key" ON "RestList"("customDomain");
