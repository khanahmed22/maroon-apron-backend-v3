-- DropForeignKey
ALTER TABLE "InventVariants" DROP CONSTRAINT "InventVariants_inventoryId_fkey";

-- AddForeignKey
ALTER TABLE "InventVariants" ADD CONSTRAINT "InventVariants_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
