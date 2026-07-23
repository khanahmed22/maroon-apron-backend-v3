-- AlterTable
ALTER TABLE "RestList" ADD COLUMN     "deliveryWindows" TEXT[],
ADD COLUMN     "pickUpWindows" TEXT[],
ADD COLUMN     "preOrderMaxDays" INTEGER,
ADD COLUMN     "preOrdersEnabled" BOOLEAN,
ADD COLUMN     "preoOrderMinHours" INTEGER;
