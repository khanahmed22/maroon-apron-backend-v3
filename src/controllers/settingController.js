import prisma from "../db.js";
import cloudinary from "../../config/cloudinary.js";

const updateRestaurantSettings = async (req, res) => {
  try {
    const {
      id,
      restName,
      restPhone,
      restEmail,
      restAddress,
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
    } = req.body;

    // Get existing restaurant
    const existingRestaurant = await prisma.restList.findUnique({
      where: { id },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

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

    // Update restaurant
    const restaurant = await prisma.restList.update({
      where: {
        id,
      },
      data: {
        restName,
        restPhone,
        restEmail,
        restAddress,
        restLogo,
        restBanner,
        restTheme,
        restInstagram,
        restFB,
        metaTitle,
        metaDesc,
        logoId,
        bannerId,
        customDomain
      },
    });

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      error: "Failed to update restaurant",
    });
  }
};

export { updateRestaurantSettings };