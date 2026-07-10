import { redisClient } from "../../redis.js";
export function rateLimiter(limit = 100, window = 60) {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id
        ? `user:${req.user.id}`
        : `ip:${req.ip}`;

      const key = `rate_limit:${req.baseUrl}:${identifier}`;

      const requests = await redisClient.incr(key);

      if (requests === 1) {
        await redisClient.expire(key, window);
        
      }

      if (requests > limit) {
        res.set("Retry-After", String(window));

        return res.status(429).json({
          message: `Too many requests. Please try again in ${window} seconds.`,
        });
      }

      next();
    } catch (err) {
      console.error(err);
      next();
    }
  };
}