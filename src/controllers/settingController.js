import prisma from "../db.js";
import cloudinary from "../../config/cloudinary.js";
import { redisClient } from "../../redis.js";

const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";

const isValidCustomDomain = (domain, subdomain) => {
  if (!domain || !subdomain) return false;
  const value = domain.trim().toLowerCase();
  const prefix = `${subdomain.toLowerCase()}.`;
  if (!value.startsWith(prefix)) return false;
  const suffix = value.slice(prefix.length);
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(suffix);
};

const updateRestaurantSettings = async (req, res, next) => {
  try {
    const {
      id,
      restName,
      restPhone,
      restEmail,
      restAddress,
      restAnnouncement,
      restLogo,
      restBanner,
      restTheme,
      customDomain,
      restInstagram,
      restFB,
      metaTitle,
      metaDesc,
      logoId,
      bannerId,
      preOrdersEnabled,
      preOrderMinHours,
      preOrderMaxDays,
      pickUpWindows,
      deliveryWindows,
      lat,
      long,
      crimsonBranding,
      subdomain,
      orderingDisabled,
      pickupEnabled,
      deliveryEnabled,
    } = req.body;

    // Get existing restaurant + plan in a single query now that the
    // RestList -> User relation exists
    const existingRestaurant = await prisma.restList.findUnique({
      where: { id },
      include: {
        user: {
          select: { plan: true },
        },
      },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    // Name + subdomain are set together during first-time setup and locked
    // afterwards. Presence of subdomain is the single source of truth for
    // "setup complete" — ignore incoming changes to either field once set.
    const isFirstTimeSetup = !existingRestaurant.subdomain;

    let finalRestName = existingRestaurant.restName;
    let finalSubdomain = existingRestaurant.subdomain;

    if (isFirstTimeSetup) {
      if (subdomain) {
        const subdomainOwner = await prisma.restList.findUnique({
          where: { subdomain },
        });

        if (subdomainOwner && subdomainOwner.id !== id) {
          return res.status(409).json({
            error: "Subdomain already taken",
          });
        }

        finalSubdomain = subdomain;
      }

      if (restName) {
        finalRestName = restName;
      }
    }

    // Custom domain must always be `{subdomain}.{tld}` — never trust the
    // raw client value once we know the locked subdomain.
    let finalCustomDomain = existingRestaurant.customDomain;

    if (customDomain !== undefined) {
      if (!customDomain) {
        finalCustomDomain = "";
      } else if (isValidCustomDomain(customDomain, finalSubdomain)) {
        const normalizedDomain = customDomain.trim().toLowerCase();

        // customDomain is @unique — check ownership before saving, same
        // as the subdomain check above.
        const domainOwner = await prisma.restList.findUnique({
          where: { customDomain: normalizedDomain },
        });

        if (domainOwner && domainOwner.id !== id) {
          return res.status(409).json({
            error: "Custom domain already taken",
          });
        }

        finalCustomDomain = normalizedDomain;
      } else {
        return res.status(400).json({
          error: `Custom domain must start with your subdomain (${finalSubdomain})`,
        });
      }
    }

    const isPro =
      existingRestaurant.user?.plan && existingRestaurant.user.plan !== "free";

    // restSite is the canonical "visit store" URL — custom domain when on
    // Pro and one is set, otherwise the crimsoncastle.shop subdomain.
    const restSite =
      isPro && finalCustomDomain
        ? `https://${finalCustomDomain}`
        : `https://${finalSubdomain}.${CRIMSON_BASE_DOMAIN}`;

    // Delete old logo only if a new one was uploaded
    if (
      logoId &&
      existingRestaurant.logoId &&
      logoId !== existingRestaurant.logoId
    ) {
      await cloudinary.uploader.destroy(existingRestaurant.logoId);
    }

    // Delete old banner only if a new one was uploaded
    if (
      bannerId &&
      existingRestaurant.bannerId &&
      bannerId !== existingRestaurant.bannerId
    ) {
      await cloudinary.uploader.destroy(existingRestaurant.bannerId);
    }

    // Update restaurant. On first-time setup, User.subdomain is written via a
    // nested update so both tables change in the same transaction.
    const restaurant = await prisma.restList.update({
      where: {
        id,
      },
      data: {
        restName: finalRestName,
        restPhone,
        restEmail,
        restAddress,
        restAnnouncement,
        restLogo,
        restBanner,
        restTheme,
        restInstagram,
        restFB,
        metaTitle,
        metaDesc,
        logoId,
        bannerId,
        customDomain: finalCustomDomain,
        restSite,
        preOrdersEnabled,
        preOrderMinHours,
        preOrderMaxDays,
        pickUpWindows,
        deliveryWindows,
        lat,
        long,
        crimsonBranding,
        subdomain: finalSubdomain,
        orderingDisabled,
        pickupEnabled,
        deliveryEnabled,

        // Keep User.subdomain in sync when setup completes
        ...(isFirstTimeSetup &&
          finalSubdomain && {
            user: { update: { subdomain: finalSubdomain } },
          }),
      },
    });

    await redisClient.del(`restId:${existingRestaurant.userId}`);
    await redisClient.del(`restDetails:merchant:${existingRestaurant.userId}`);
    await redisClient.del(`restDetails:customer:${finalSubdomain}`);

    // finalSubdomain is locked after first-time setup, but if this was the
    // setup call itself, existingRestaurant.subdomain (old, empty) differs
    // from finalSubdomain (new) — nothing to clean up there since it was
    // never cached under the old (empty) value. Guard anyway for safety.
    if (
      existingRestaurant.subdomain &&
      existingRestaurant.subdomain !== finalSubdomain
    ) {
      await redisClient.del(
        `restDetails:customer:${existingRestaurant.subdomain}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant,
    });
  } catch (err) {
    next(err);
  }
};

export { updateRestaurantSettings };