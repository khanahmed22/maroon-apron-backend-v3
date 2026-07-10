-- CreateTable
CREATE TABLE "MerchantApps" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "address" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "social_links" TEXT,
    "cnic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "MerchantApps_pkey" PRIMARY KEY ("id")
);
