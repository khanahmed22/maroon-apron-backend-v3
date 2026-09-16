import prisma from "../db.js";
import { redisClient } from "../../redis.js";

const customerFacingRestDetails = async (req, res, next) => {
  const { subdomain } = req.body;
  const cacheKey = `restDetails:customer:${subdomain}`;

  try {
    const cachedRest = await redisClient.get(cacheKey);

    if (cachedRest) {
      return res.json({
        getRest: JSON.parse(cachedRest),
        source: "redis",
      });
    }

    const getRest = await prisma.restList.findFirst({
      where: {
        OR: [{ subdomain }, { customDomain: subdomain }],
      },
      select: {
        id: true,
        createdAt: true,
        restName: true,
        restPhone: true,
        restEmail: true,
        restAddress: true,
        restAnnouncement: true,
        restLogo: true,
        restBanner: true,
        logoId: true,
        bannerId: true,
        subdomain: true,
        restSite: true,
        restInstagram: true,
        restTheme: true,
        restFB: true,
        metaTitle: true,
        metaDesc: true,
        customDomain: true,
        preOrdersEnabled: true,
        preOrderMinHours: true,
        preOrderMaxDays: true,
        pickUpWindows: true,
        deliveryWindows: true,
        lat: true,
        long: true,
        crimsonBranding: true,
        orderingDisabled: true,
        pickupEnabled: true,
        deliveryEnabled: true
      },
    });

    if (!getRest) {
      return res.json({ error: "no restaurant found" });
    }

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(getRest));

    res.json({ getRest, source: "database" });
  } catch (err) {
    err.status = 500;
    next(err);
  }
}

const merchantFacingRestDetails = async (req, res, next) => {
  const userId = req.user.id;
  const cacheKey = `restDetails:merchant:${userId}`;

  try {
    const cachedRest = await redisClient.get(cacheKey);

    if (cachedRest) {
      return res.json({
        getRest: JSON.parse(cachedRest),
        source: "redis",
      });
    }

    const getRest = await prisma.restList.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        createdAt: true,
        restName: true,
        restPhone: true,
        restEmail: true,
        restAnnouncement: true,
        restAddress: true,
        restLogo: true,
        restBanner: true,
        logoId: true,
        bannerId: true,
        subdomain: true,
        restSite: true,
        restInstagram: true,
        restTheme: true,
        restFB: true,
        metaTitle: true,
        metaDesc: true,
        customDomain: true,
        preOrdersEnabled: true,
        preOrderMinHours: true,
        preOrderMaxDays: true,
        pickUpWindows: true,
        deliveryWindows: true,
        lat: true,
        long: true,
        crimsonBranding: true,
        orderingDisabled: true,
        pickupEnabled: true,
        deliveryEnabled: true
      },
    });

    if (!getRest) {
      return res.json({ error: "merchant doesnt match" });
    }

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(getRest));

    res.json({ getRest, source: "database" });
  } catch (err) {
    err.status = 500;
    next(err);
  }
}

export { customerFacingRestDetails, merchantFacingRestDetails };