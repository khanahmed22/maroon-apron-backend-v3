import prisma from "../db.js";

const deleteAccountController = async (req, res, next) => {
  const userId = req.user.id;
  const { userConfirm } = req.body;

  try {
    if (userConfirm !== "DELETE") {
  return res.status(400).json({
    status: "failed",
    message: "Account deletion not confirmed",
  });
}

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export { deleteAccountController };