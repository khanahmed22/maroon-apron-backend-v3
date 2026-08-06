import { Router } from "express";
import { Resend } from "resend";
import prisma from "../db.js";
import crypto from "crypto";

const forgotPasswordRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY);
//merchant
forgotPasswordRouter.post("/merchant", async (req, res,next) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, a password reset email has been sent.",
      });
    }

    // Delete any previous reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: user.id,
      },
    });

    const verificationUrl = `${process.env.CRIMSON_ADMIN_URL}/reset-password/${token}`;

    await resend.emails.send({
      from: "no-reply@crimsoncastle.shop",
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          
          <h2 style="color:#dc2626;">
            Reset your password
          </h2>

          <p>
            Hi ${user.name},
          </p>

          <p>
            We received a request to reset the password for your account.
          </p>

          <p>
            Click the button below to choose a new password.
          </p>

          <p style="margin:30px 0;">
            <a
              href="${verificationUrl}"
              style="
                background:#dc2626;
                color:white;
                padding:14px 24px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
                font-weight:bold;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <p>
            If you didn't request a password reset, you can safely ignore this email.
            Your password won't be changed.
          </p>

          <hr style="margin:30px 0;" />

          <p style="font-size:13px;color:#666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>

          <p style="font-size:13px;word-break:break-all;color:#666;">
            ${verificationUrl}
          </p>

        </div>
      `,
    });

    return res.json({
      success: true,
      message: "If an account exists, a password reset email has been sent.",
    });
  } catch (err) {
    err.status = 500
    next(err)

    
  }
});


//customer

forgotPasswordRouter.post("/customer", async (req, res,next) => {
  const { email,subdomain } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, a password reset email has been sent.",
      });
    }

    // Delete any previous reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: user.id,
      },
    });

    const verificationUrl = `http://${subdomain}.${process.env.CRIMSON_NEXT_URL}/reset-password/${token}`;

    await resend.emails.send({
      from: "no-reply@crimsoncastle.shop",
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          
          <h2 style="color:#dc2626;">
            Reset your password
          </h2>

          <p>
            Hi ${user.name},
          </p>

          <p>
            We received a request to reset the password for your account.
          </p>

          <p>
            Click the button below to choose a new password.
          </p>

          <p style="margin:30px 0;">
            <a
              href="${verificationUrl}"
              style="
                background:#dc2626;
                color:white;
                padding:14px 24px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
                font-weight:bold;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <p>
            If you didn't request a password reset, you can safely ignore this email.
            Your password won't be changed.
          </p>

          <hr style="margin:30px 0;" />

          <p style="font-size:13px;color:#666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>

          <p style="font-size:13px;word-break:break-all;color:#666;">
            ${verificationUrl}
          </p>

        </div>
      `,
    });

    return res.json({
      success: true,
      message: "If an account exists, a password reset email has been sent.",
    });
  } catch (err) {
    err.status = 404
    next(err)
  }
});

export default forgotPasswordRouter;