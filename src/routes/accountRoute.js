import express,{Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";
const accountRouter = Router()

const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";

accountRouter.get("/account", protect, async (req, res,next) => {
  try {

    const user = await prisma.user.findUnique({

      where: {
        id: req.user.id,
      },

      select: {
        email: true,
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

// Removes a domain alias from the Netlify site. Best-effort — logs on
// failure rather than throwing, since we never want a Netlify hiccup to
// break webhook processing (Paddle will retry the whole webhook otherwise).
const removeNetlifyAlias = async (domain) => {
  try {
    const siteId = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteId || !token) {
      console.error("Netlify configuration is missing, skipping alias removal");
      return;
    }

    const siteResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const siteData = await siteResponse.json();

    if (!siteResponse.ok) {
      console.error("Failed to fetch Netlify site for alias removal", siteData);
      return;
    }

    const currentAliases = siteData.domain_aliases || [];
    const domainAliases = currentAliases.filter((d) => d !== domain);

    if (domainAliases.length === currentAliases.length) {
      // domain wasn't in the alias list, nothing to do
      return;
    }

    const updateResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain_aliases: domainAliases }),
      }
    );

    if (!updateResponse.ok) {
      const updatedSite = await updateResponse.json();
      console.error("Failed to remove Netlify alias", updatedSite);
    }
  } catch (err) {
    console.error("Error removing Netlify alias", err);
  }
};

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