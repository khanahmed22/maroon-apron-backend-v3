import prisma from "../db.js"
import admin from "../utils/firebaseAdmin.js"; // adjust path to wherever you saved firebaseAdmin.js

/**
 * Sends a push notification to every device subscribed for a restaurant.
 * Call this after successfully creating an order (or any other event
 * a merchant should be notified about).
 */
export const sendRestaurantNotification = async (restId, { title, body, link }) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { restId },
    select: { fcmToken: true },
  });

  if (subscriptions.length === 0) return;

  const tokens = subscriptions.map((s) => s.fcmToken);

  const message = {
    notification: { title, body },
    data: link ? { link } : undefined,
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up tokens that are no longer valid (uninstalled, revoked, etc.)
    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && (
        r.error?.code === "messaging/registration-token-not-registered" ||
        r.error?.code === "messaging/invalid-registration-token"
      )) {
        deadTokens.push(tokens[i]);
      }
    });

    if (deadTokens.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { fcmToken: { in: deadTokens } },
      });
    }

    return response;
  } catch (err) {
    console.error("sendRestaurantNotification error:", err);
  }
};