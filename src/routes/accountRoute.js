import express,{Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";
const accountRouter = Router()

accountRouter.get("/account", protect, async (req, res,next) => {
  try {

    const user = await prisma.user.findUnique({

      where: {
        id: req.user.id,
      },

      select: {
        email: true,
        merchant_verify: true,
        plan: true,
        subscription_id: true,
        
      },

    });

    res.json(user);

  } catch (err) {
 err.status = 404
    next(err)

    
  }
});

accountRouter.post("/create-paddle-link", protect, async (req, res,next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        paddleCustomerId: true,
      },
    });

    if (!user?.paddleCustomerId) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const paddleBase =
      process.env.PADDLE_ENV === "sandbox"
        ? "https://sandbox-api.paddle.com"
        : "https://api.paddle.com";

    const paddleRes = await fetch(
      `${paddleBase}/customers/${user.paddleCustomerId}/portal-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
          "Paddle-Version": "1",
        },
        body: JSON.stringify({}),
      }
    );

    const result = await paddleRes.json();

    if (!paddleRes.ok) {
      console.error(result);

      return res.status(500).json({
        error: "Failed to create portal session",
      });
    }

    const url = result.data?.urls?.general?.overview;

    if (!url) {
      return res.status(500).json({
        error: "Invalid Paddle response",
      });
    }

    res.json({ url });
  } catch (err) {
     err.status = 404
    next(err)

  }
});

accountRouter.post("/webhook", async (req, res,next) => {
  try {
    console.log("🔥 WEBHOOK RECEIVED");
    console.log(JSON.stringify(req.body, null, 2));

    const event = req.body.event_type;
    const data = req.body.data;

    // Ignore everything except subscription events
    if (!event?.startsWith("subscription.")) {
      return res.sendStatus(200);
    }

    const userId = data.custom_data?.userId;

    if (!userId) {
      console.log("❌ Missing userId in custom_data");
      return res.sendStatus(400);
    }

    switch (event) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            plan: "pro",
            subscription_id: data.id,
            paddleCustomerId: data.customer_id,
          },
        });

        console.log(`✅ User ${userId} upgraded to Pro`);
        break;

      case "subscription.canceled":
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            plan: "free",
          },
        });

        console.log(`⚠️ User ${userId} downgraded to Free`);
        break;

      default:
        console.log(`ℹ️ Ignored event: ${event}`);
    }

    res.sendStatus(200);
  } catch (err) {
     err.status = 404
    next(err)
  }
});

export default accountRouter