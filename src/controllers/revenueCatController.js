import prisma from "../db.js";

const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

// Duplicated from accountController.js — pull into a shared services/netlify.js
// if you want to de-dupe later.
const removeNetlifyAlias = async (domain) => {
  try {
    const siteId = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteId || !token) return;

    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const siteData = await siteResponse.json();
    if (!siteResponse.ok) return;

    const currentAliases = siteData.domain_aliases || [];
    const domainAliases = currentAliases.filter((d) => d !== domain);
    if (domainAliases.length === currentAliases.length) return;

    await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ domain_aliases: domainAliases }),
    });
  } catch (err) {
    console.error("Error removing Netlify alias", err);
  }
};

const checkGooglePlayEligibility = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { billingProvider: true },
    });

    if (user?.billingProvider === "paddle") {
      return res.status(409).json({
        eligible: false,
        error: "Already subscribed through Paddle. Cancel that subscription first to switch billing methods.",
      });
    }

    res.json({ eligible: true });
  } catch (err) {
    next(err);
  }
};

const revenueCatWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return res.sendStatus(401);
    }

    const event = req.body.event;
    if (!event) return res.sendStatus(400);

    const userId = event.app_user_id;
    if (!userId) {
      console.log("❌ Missing app_user_id in RevenueCat event");
      return res.sendStatus(400);
    }

    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "PRODUCT_CHANGE": {
        const existing = await prisma.user.findUnique({
          where: { id: userId },
          select: { billingProvider: true },
        });

        if (existing?.billingProvider === "paddle") {
          console.error(`🚨 User ${userId} paid via Google Play but billingProvider is "paddle" — needs manual reconciliation`);
          return res.sendStatus(200);
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            revenueCatAppUserId: userId,
            billingProvider: "googleplay",
          },
        });
        console.log(`✅ User ${userId} upgraded to Pro (RevenueCat)`);
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "free",
            billingProvider: null,
          },
        });
        console.log(`⚠️ User ${userId} downgraded to Free (RevenueCat)`);

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
        console.log(`ℹ️ Ignored RevenueCat event: ${event.type}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("RevenueCat webhook error:", err);
    next(err);
  }
};

export { revenueCatWebhook, checkGooglePlayEligibility };