/*
  Warnings:

  - Added the required column `restId` to the `Inventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "restId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "RestList" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restName" TEXT NOT NULL,

    CONSTRAINT "RestList_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_restId_fkey" FOREIGN KEY ("restId") REFERENCES "RestList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
