import express from 'express'
import { Router } from 'express'
import prisma from '../db.js'

const publicOrderRouter = Router()

publicOrderRouter.get("/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.orders.findUnique({
      where: {
        orderNumber,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "No matching order found",
      });
    }

    res.json(order);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

export default publicOrderRouter