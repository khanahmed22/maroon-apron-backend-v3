import prisma from '../db.js'


const publicOrderViewController = async (req, res,next) => {
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
    err.status = 500
    next(err)


    res.status(500).json({
      error: "Server error",
    });
  }
}

export  {publicOrderViewController}