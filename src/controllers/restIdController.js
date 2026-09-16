import prisma from "../db.js";
import { redisClient } from "../../redis.js";

export const restIdController = async (req, res, next) => {
  const userId = req.user.id;
  const cacheKey = `restId:${userId}`;

  try {
    const cachedRestId = await redisClient.get(cacheKey);

    if (cachedRestId) {
      return res.json({
        getId: JSON.parse(cachedRestId),
        source: "redis",
      });
    }

    const getId = await prisma.restList.findUnique({
      where: { userId: userId },
    });

    if (!getId) {
      return res.json({ getId: null });
    }

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(getId));

    return res.json({
      getId,
      source: "database",
    });
  } catch (err) {
    err.status = 404;
    next(err);
  }
};