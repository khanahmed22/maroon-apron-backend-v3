-- CreateTable
CREATE TABLE "FixedRate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rate" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "restId" TEXT NOT NULL,
    "fixMode" BOOLEAN NOT NULL,

    CONSTRAINT "FixedRate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FixedRate" ADD CONSTRAINT "FixedRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
