import cron from "node-cron";
import prisma from "../db.js";

cron.schedule("0 * * * *", async () => { // 1 hour
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Deleted ${result.count} expired password reset tokens`);
  } catch (error) {
    console.error("Failed to clean up password reset tokens:", error);
  }
});