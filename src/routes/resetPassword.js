import { Router } from "express";
import prisma from "../db.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const resetPasswordRouter = Router();

/**
 * Verify reset token
 * GET /reset-password/:token
 */
resetPasswordRouter.get("/:token", async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        valid: false,
        error: "Invalid or expired token",
      });
    }

    return res.json({
      valid: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
});

/**
 * Reset password
 * POST /reset-password
 */
resetPasswordRouter.post("/", async (req, res) => {
  const { password, token } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        error: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
});

export default resetPasswordRouter;