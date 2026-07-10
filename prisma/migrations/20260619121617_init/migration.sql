/*
  Warnings:

  - You are about to drop the `Movie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Movie";

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "custName" TEXT NOT NULL,
    "custEmail" TEXT NOT NULL,
    "custPhone" INTEGER NOT NULL,
    "custAddress" TEXT NOT NULL,
    "orderDetails" JSONB,
    "recieveMethod" TEXT NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);
