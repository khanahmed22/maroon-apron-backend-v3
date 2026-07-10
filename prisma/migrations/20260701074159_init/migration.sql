-- AlterTable
ALTER TABLE "User" ADD COLUMN     "merchant_verify" BOOLEAN,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "subscription_id" TEXT;
