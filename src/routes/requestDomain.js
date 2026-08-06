//under construction

import express, { Router } from "express"
import { Resend } from "resend"

const domainRouter = Router()

const resend = new Resend(process.env.RESEND_API_KEY)


const DOMAIN_REQUEST_INBOX = "ahmed.khans.mk@gmail.com"
const FROM_ADDRESS = "Crimson Castle <team@crimsoncastle.biz>"

domainRouter.post("/", async (req, res,next) => {
  const { restId, restName, requestedDomain, merchantEmail } = req.body

  if (!requestedDomain || !restId) {
    return res.status(400).json({ error: "restId and requestedDomain are required" })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: DOMAIN_REQUEST_INBOX,
      replyTo: merchantEmail || undefined,
      subject: `Custom domain request: ${requestedDomain}`,
      html: `
        <div style="font-family: sans-serif; font-size: 15px; color: #171717; line-height: 1.6;">
          <h2 style="margin-bottom: 4px;">New custom domain request</h2>
          <p style="color: #6B7280; margin-top: 0;">Submitted from the merchant settings page.</p>

          <table cellpadding="0" cellspacing="0" style="margin-top: 16px;">
            <tr>
              <td style="color: #6B7280; padding: 4px 12px 4px 0;">Restaurant</td>
              <td style="font-weight: 600;">${escapeHtml(restName ?? "Unknown")}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; padding: 4px 12px 4px 0;">Restaurant ID</td>
              <td style="font-weight: 600;">${escapeHtml(restId)}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; padding: 4px 12px 4px 0;">Requested domain</td>
              <td style="font-weight: 600; color: #D6293F;">${escapeHtml(requestedDomain)}</td>
            </tr>
            <tr>
              <td style="color: #6B7280; padding: 4px 12px 4px 0;">Merchant email</td>
              <td style="font-weight: 600;">${escapeHtml(merchantEmail ?? "Not provided")}</td>
            </tr>
          </table>
        </div>
      `,
    })

    if (error) {
      console.log(error)
      return res.status(502).json({ error: "Failed to send domain request email" })
    }

    return res.status(200).json({ success: true, id: data?.id })
  } catch (err) {
    err.status = 500
    next(err)

  }
})

// Minimal HTML escaping since these values are interpolated into an email body
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export default domainRouter