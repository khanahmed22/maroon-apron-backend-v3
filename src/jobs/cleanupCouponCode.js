import cron from "node-cron";
import prisma from "../db.js";

cron.schedule("0 * * * *", async () => {  // 1 hour
  try {
    const result = await prisma.coupon.deleteMany({
      where: {
        expiry: {
          lt: new Date(),
        },
      },
    });

    console.log(`Deleted ${result.count} expired coupons`);
  } catch (error) {
    console.error("Failed to delete expired coupons:", error);
  }
});