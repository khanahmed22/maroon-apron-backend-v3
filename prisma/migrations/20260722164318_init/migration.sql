-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "isPreOrder" BOOLEAN,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "scheduledWindow" TEXT;
