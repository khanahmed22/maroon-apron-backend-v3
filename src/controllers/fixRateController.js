import prisma from "../db.js";


const getRestIdForUser = async (userId) => {
  const rest = await prisma.restList.findUnique({
    where: { userId },
    select: { id: true },
  });

  return rest?.id ?? null;
};

//view Fix Rate

const viewFixRateController = async (req, res,next) => {
  const { restId } = req.params;

  try {
    const viewRate = await prisma.fixedRate.findUnique({
      where: { restId },
      select: {
        rate: true,
        FixMinOrder: true,
        fixMode: true,
        restId: true,
      },
    });

    if (!viewRate) {
      return res.status(404).json({
        error: "Could not find fixed rate for restaurant",
      });
    }

    return res.json(viewRate);
  } catch (err) {
     err.status = 500
    next(err)
  }
} 

//update Fix Rate

const updateFixRateController = async (req, res,next) => {
  const userId = req.user.id;

  const {
    fixRate: rate,
    FixMinOrder,
  } = req.body;

  if (typeof rate !== "number" || Number.isNaN(rate)) {
    return res.status(400).json({
      error: "Rate must be a number",
    });
  }

  if (typeof FixMinOrder !== "number" || Number.isNaN(FixMinOrder)) {
    return res.status(400).json({
      error: "Minimum order must be a number",
    });
  }

  try {
    const restId = await getRestIdForUser(userId);

    if (!restId) {
      return res.status(404).json({
        error: "No restaurant found for this account",
      });
    }

    await prisma.fixedRate.upsert({
      where: {
        userId,
      },
      update: {
        rate,
        FixMinOrder,
      },
      create: {
        userId,
        restId,
        rate,
        FixMinOrder,
        fixMode: false,
      },
    });

    return res.json({
      success: "Rate updated",
    });
  } catch (err) {
     err.status = 404
    next(err)
  }
}

// enable fix rate

const enableFixRateController = async (req, res,next) => {
  const userId = req.user.id;

  try {
    const restId = await getRestIdForUser(userId);

    if (!restId) {
      return res.status(404).json({
        error: "No restaurant found for this account",
      });
    }

    await prisma.fixedRate.upsert({
      where: {
        userId,
      },
      update: {
        fixMode: true,
      },
      create: {
        userId,
        restId,
        rate: 0,
        FixMinOrder: 0,
        fixMode: true,
      },
    });

    return res.json({
      success: "Enabled fixed rate mode",
    });
  } catch (err) {
    err.status = 404
    next(err)
  }
}

//disable fix rate 

const disbleFixRateController = async (req, res,next) => {
  const userId = req.user.id;

  try {
    const restId = await getRestIdForUser(userId);

    if (!restId) {
      return res.status(404).json({
        error: "No restaurant found for this account",
      });
    }

    await prisma.fixedRate.upsert({
      where: {
        userId,
      },
      update: {
        fixMode: false,
      },
      create: {
        userId,
        restId,
        rate: 0,
        FixMinOrder: 0,
        fixMode: false,
      },
    });

    return res.json({
      success: "Disabled fixed rate mode",
    });
  } catch (err) {
     err.status = 404
    next(err)
  }
}

export {viewFixRateController,updateFixRateController,enableFixRateController,disbleFixRateController}