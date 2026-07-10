-- CreateTable
CREATE TABLE "InventVariants" (
    "id" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "variantPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryId" TEXT NOT NULL,

    CONSTRAINT "InventVariants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventVariants" ADD CONSTRAINT "InventVariants_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
