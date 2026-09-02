-- AlterTable
ALTER TABLE "RestList" ADD COLUMN     "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pickupEnabled" BOOLEAN NOT NULL DEFAULT true;
