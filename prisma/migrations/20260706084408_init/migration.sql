/*
  Warnings:

  - Made the column `userId` on table `Inventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
