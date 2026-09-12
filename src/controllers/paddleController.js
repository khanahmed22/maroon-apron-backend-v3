import prisma from "../db.js";
import { removeNetlifyAlias } from "../services/netlify.js";

const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";

const paddleAccountController = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        email: true,
        plan: true,
        paddleSubscription_id: true,
        billingProvider: true,
      },
    });

    res.json(user);
  } catch (err) {
    err.status = 404;
    next(err);
  }
};

const createPaddleLink = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        paddleCustomerId: true,
        billingProvider: true,
      },
    });

    if (user?.billingProvider === "googleplay") {
      return res.status(409).json({
        error: "Already subscribed through Google Play. Cancel that subscription first to switch billing methods.",
      });
    }

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
      },
    );

    const result = await paddleRes.json();

    if (!paddleRes.ok) {
      console.error("❌ Paddle portal session failed");
      console.error("Status:", paddleRes.status);
      console.error("Response:", JSON.stringify(result, null, 2));

      return res.status(paddleRes.status).json({
        error: "Failed to create portal session",
        paddle: result,
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
    err.status = 404;
    next(err);
  }
};

const paddleWebhook = async (req, res, next) => {
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
            paddleSubscription_id: data.id,
            paddleCustomerId: data.customer_id,
            billingProvider: "paddle",
          },
        });

        console.log(`✅ User ${userId} upgraded to Pro`);
        break;

      case "subscription.canceled": {
        // Guard against a stale/duplicate cancellation arriving after the
        // user already switched to Google Play — don't let it clobber an
        // active subscription on the other provider.
        const existing = await prisma.user.findUnique({
          where: { id: userId },
          select: { billingProvider: true },
        });

        if (existing?.billingProvider !== "paddle") {
          console.log(
            `ℹ️ Ignoring stale Paddle cancellation for ${userId} — current provider is ${existing?.billingProvider}`
          );
          return res.sendStatus(200);
        }

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            plan: "free",
            billingProvider: null,
          },
        });

        console.log(`⚠️ User ${userId} downgraded to Free`);

        // Custom domains are a Pro-only feature. On downgrade, clear the
        // saved customDomain, remove its Netlify alias, and fall back
        // restSite to the crimsoncastle.shop subdomain.
        const restList = await prisma.restList.findUnique({
          where: { userId },
          select: { id: true, subdomain: true, customDomain: true },
        });

        if (restList?.customDomain) {
          await removeNetlifyAlias(restList.customDomain);

          await prisma.restList.update({
            where: { id: restList.id },
            data: {
              customDomain: "",
              restSite: restList.subdomain
                ? `https://${restList.subdomain}.${CRIMSON_BASE_DOMAIN}`
                : null,
            },
          });

          console.log(`🧹 Cleared custom domain for restaurant ${restList.id}`);
        }

        break;
      }

      default:
        console.log(`ℹ️ Ignored event: ${event}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Paddle webhook error:", err);
    next(err);
  }
};

export { paddleAccountController, createPaddleLink, paddleWebhook };