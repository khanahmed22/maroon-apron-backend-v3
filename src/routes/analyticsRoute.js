import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";

const analyticsRouter = Router();

// GET /analytics/orders/:restId?from=ISO&to=ISO
analyticsRouter.get("/orders/:restId", protect, async (req, res) => {
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
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default analyticsRouter;