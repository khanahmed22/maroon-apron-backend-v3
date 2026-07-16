/*
  Warnings:

  - You are about to drop the column `area_name` on the `AreaList` table. All the data in the column will be lost.
  - You are about to drop the column `city_name` on the `AreaList` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[areaId]` on the table `AreaList` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `areaId` to the `AreaList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryFee` to the `AreaList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minOrder` to the `AreaList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restId` to the `AreaList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `AreaList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AreaList" DROP COLUMN "area_name",
DROP COLUMN "city_name",
ADD COLUMN     "areaId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveryFee" BIGINT NOT NULL,
ADD COLUMN     "minOrder" BIGINT NOT NULL,
ADD COLUMN     "restId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AreaList_areaId_key" ON "AreaList"("areaId");

-- AddForeignKey
ALTER TABLE "AreaList" ADD CONSTRAINT "AreaList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
