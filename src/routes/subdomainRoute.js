import { Router } from "express";
import prisma from "../db.js";

const subRouter = Router();

subRouter.get("/", async (req, res) => {
  try {
    // Prefer the original host forwarded by Next.js.
    const forwardedHost = req.headers["x-forwarded-host"];

    const host =
      typeof forwardedHost === "string"
        ? forwardedHost.split(":")[0].toLowerCase()
        : req.headers.host?.split(":")[0].toLowerCase();

    if (!host) {
      return res.status(400).json({
        success: false,
        message: "Host header missing",
      });
    }

    let identifier = host;

    // localhost => pizzatown
    if (host.endsWith(".localhost")) {
      identifier = host.split(".")[0];
    }

    // pizzatown.crimsoncastle.shop => pizzatown
    else if (host.endsWith(".crimsoncastle.shop")) {
      identifier = host.split(".")[0];
    }

    // For custom domains (burgerhouse.pk, shop.burgerhouse.com),
    // identifier stays as the full hostname.

    const restaurant = await prisma.restList.findFirst({
      where: {
        OR: [
          {
            subdomain: identifier,
          },
          {
            customDomain: host,
          },
        ],
      },
      include: {
        inventories: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default subRouter;