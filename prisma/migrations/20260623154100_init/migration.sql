/*
  Warnings:

  - Added the required column `restId` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "restId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_restId_fkey" FOREIGN KEY ("restId") REFERENCES "RestList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
