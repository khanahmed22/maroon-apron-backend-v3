import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";

const analyticsRouter = Router();


analyticsRouter.get("/orders/:restId", protect, async (req, res,next) => {
  const { restId } = req.params;
  const { from, to } = req.query;

  try {
    const restaurant = await prisma.restList.findUnique({
      where: { id: restId },
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (restaurant.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized for this restaurant" });
    }

    const where = { restId };

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const orders = await prisma.orders.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(orders);
  } catch (err) {
    err.status = 404
    next(err)
  }
});

export default analyticsRouter;