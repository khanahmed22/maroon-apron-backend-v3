/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `RestList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RestList_subdomain_key" ON "RestList"("subdomain");
