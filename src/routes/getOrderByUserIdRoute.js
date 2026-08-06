import express,{Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";
const orderByUserIdRouter = Router({
  mergeParams: true,
})


orderByUserIdRouter.get("/", protect, async (req, res,next) => {
  try {
    const { subdomain } = req.params;

    const restaurant = await prisma.restList.findUnique({
      where: {
        subdomain,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    const orders = await prisma.orders.findMany({
      where: {
        custEmail: req.user.email,
        restId: restaurant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (err) {
   err.status = 500
    next(err)

  }
});
export  default orderByUserIdRouter