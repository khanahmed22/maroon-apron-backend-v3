import prisma from "../db.js"


export const subscribeToNotifications = async (req, res) => {
  try {
    // TODO: adjust to whatever your auth middleware attaches (req.user.id, req.merchantId, etc.)
    const userId = req.user?.id;
    const { fcmToken } = req.body ;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!fcmToken) return res.status(400).json({ error: "fcmToken is required" });

    const rest = await prisma.restList.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    // Upsert so re-subscribing (e.g. token refresh) doesn't create duplicates.
    await prisma.pushSubscription.upsert({
      where: { fcmToken },
      update: { restId: rest.id },
      create: { restId: rest.id, fcmToken },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("subscribeToNotifications error:", err);
    return res.status(500).json({ error: "Failed to subscribe" });
  }
};

/**
 * GET /api/notifications/status
 * Returns whether the current merchant has an active push subscription.
 */
export const getNotificationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rest = await prisma.restList.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!rest) return res.status(200).json({ enabled: false });

    const subscription = await prisma.pushSubscription.findFirst({
      where: { restId: rest.id },
      select: { id: true },
    });

    return res.status(200).json({ enabled: !!subscription });
  } catch (err) {
    console.error("getNotificationStatus error:", err);
    return res.status(500).json({ error: "Failed to fetch status" });
  }
};

// unsubscribe

export const unsubscribeFromNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { fcmToken } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!fcmToken) return res.status(400).json({ error: "fcmToken is required" });

    const rest = await prisma.restList.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    // Scoped to restId so a merchant can only delete their own subscription,
    // not an arbitrary token belonging to someone else.
    const { count } = await prisma.pushSubscription.deleteMany({
      where: { fcmToken, restId: rest.id },
    });

    if (count === 0) {
      // Already unsubscribed (or token didn't belong to this merchant) — not an error.
      return res.status(200).json({ success: true, alreadyUnsubscribed: true });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("unsubscribeFromNotifications error:", err);
    return res.status(500).json({ error: "Failed to unsubscribe" });
  }
};