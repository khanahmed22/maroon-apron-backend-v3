import prisma from "../db.js"
import { Resend } from "resend"
import { getIO } from "../utils/socket.js"
import { redisClient } from "../../redis.js"
import { messaging } from "../utils/firebaseAdmin.js" // adjust path if firebaseAdmin.js lives elsewhere
const resend = new Resend(process.env.RESEND_API_KEY)

const invalidateInventoryCache = async (userId, restId) => {
  const restaurant = await prisma.restList.findUnique({ where: { id: restId } });
  await redisClient.del(`viewItemMerchant:${userId}`);
  if (restaurant?.subdomain) {
    await redisClient.del(`viewItemCustomer:${restaurant.subdomain}`);
  }
};

// Sends a push notification to every device subscribed for a restaurant.
// Inlined here since addOrder is currently the only caller — pull it back
// out into its own file later if another controller needs to send pushes too.
const sendRestaurantNotification = async (restId, { title, body, link }) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { restId },
    select: { fcmToken: true },
  });

  if (subscriptions.length === 0) {
    console.log(`sendRestaurantNotification: no subscriptions found for restId ${restId}`);
    return;
  }

  const tokens = subscriptions.map((s) => s.fcmToken);

  const message = {
    notification: { title, body },
    data: link ? { link } : undefined,
    tokens,
  };

  const response = await messaging.sendEachForMulticast(message);

  console.log(
    `sendRestaurantNotification: ${response.successCount} succeeded, ${response.failureCount} failed`,
  );
  response.responses.forEach((r, i) => {
    if (!r.success) {
      console.log(`  token ${tokens[i].slice(0, 12)}...: ${r.error?.code} — ${r.error?.message}`);
    }
  });

  // Clean up tokens that are no longer valid (uninstalled, revoked, etc.)
  const deadTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success && (
      r.error?.code === "messaging/registration-token-not-registered" ||
      r.error?.code === "messaging/invalid-registration-token"
    )) {
      deadTokens.push(tokens[i]);
    }
  });

  if (deadTokens.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { fcmToken: { in: deadTokens } },
    });
  }

  return response;
};

const viewOrder = async(req,res,next)=>{
  const {restId} = req.params
  try{
    const vieworders = await prisma.orders.findMany({
      where:{restId:restId},
      orderBy:{
        createdAt:'desc'
      }
    })

    res.json(vieworders)
  }
  catch(err){
    err.status = 404
    next(err)
  }
}

const addOrder = async(req,res,next)=>{
  
  const {custDetails,cart,coupon} = req.body

  try{
   
    const [add] = await prisma.$transaction([
      prisma.orders.create({
        data: {
          orderNumber: custDetails.orderNumber,
          custName: custDetails.custName,
          custEmail: custDetails.custEmail,
          custAddress: custDetails.custAddress,
          custPhone: custDetails.custPhone,
          recieveMethod: custDetails.recieveMethod,
          createdAt: custDetails.createdAt,
          orderDetails: cart,
          restId: custDetails.restId,
          orderTotal: custDetails.orderTotal,
          restName: custDetails.restName,
          deliveryArea: custDetails.deliveryArea,
          deliveryFee: custDetails.deliveryFee,

          couponId: coupon?.couponId ?? null,
          couponCode: coupon?.code ?? null,
          discountAmount: coupon?.discount ?? 0,
          isPreOrder: custDetails.isPreOrder,
          scheduledDate:
            custDetails.isPreOrder && custDetails.scheduledDate
              ? new Date(custDetails.scheduledDate)
              : null,
          scheduledWindow:
            custDetails.isPreOrder && custDetails.scheduledWindow
              ? custDetails.scheduledWindow
              : null,
        },
      }),
      ...(coupon?.couponId
        ? [
            prisma.couponUsage.create({
              data: {
                couponId: coupon.couponId,
                userId: custDetails.custEmail,
              },
            }),
            prisma.coupon.update({
              where: { id: coupon.couponId },
              data: { usedCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

  const io = getIO();

io.to(add.restId).emit("newOrder", {
  id: add.id,
  orderNumber: add.orderNumber,
  customer: add.custName,
  total: add.orderTotal,
  createdAt: add.createdAt,
});

// Push notification is best-effort — never let it break order placement.
try {
  await sendRestaurantNotification(add.restId, {
    title: "New Order",
    body: `${add.custName} placed an order for Rs. ${add.orderTotal}`,
    link: "/orders",
  });
} catch (err) {
  console.error("Failed to send push notification for new order:", err);
}

  res.json({message:'order placed'})
  const orderItems = cart
  .map(
    (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">
          <strong>${item.name}</strong>
          ${item.variantName ? `<br><small>${item.variantName}</small>` : ""}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
          Rs. ${item.price}
        </td>
      </tr>
    `
  )
  .join("");
  await resend.emails.send({
  from: "orders@crimsoncastle.shop",
  to: custDetails.custEmail,
  subject: `Order Confirmation #${custDetails.orderNumber}`,
  html: `
  <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">

    <div style="background:#dc2626;padding:24px;text-align:center;color:white;">
      <h1 style="margin:0;">${custDetails.restName}</h1>
      <p style="margin:8px 0 0;">Thank you for your order!</p>
    </div>

    <div style="padding:24px;">

      <h2 style="margin-top:0;">Order Confirmed ✅</h2>

      <p>Hi <strong>${custDetails.custName}</strong>, we've received your order.</p>

      <p>
        <strong>Order Number:</strong> ${custDetails.orderNumber}<br>
        <strong>Receive Method:</strong> ${custDetails.recieveMethod}
      </p>

      <h3>Order Items</h3>

      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th align="left" style="padding:10px;">Item</th>
            <th align="right" style="padding:10px;">Price</th>
          </tr>
        </thead>

        <tbody>
          ${orderItems}
        </tbody>

        <tfoot>
          ${
            coupon?.discount
              ? `
          <tr>
            <td style="padding:10px;text-align:right;color:#16a34a;">
              Discount (${coupon.code})
            </td>
            <td style="padding:10px;text-align:right;color:#16a34a;">
              - Rs. ${coupon.discount}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding:14px;font-weight:bold;">
              Total
            </td>

            <td style="padding:14px;text-align:right;font-weight:bold;">
              Rs. ${custDetails.orderTotal}
            </td>
          </tr>
        </tfoot>
      </table>

      ${
        custDetails.recieveMethod === "delivery"
          ? `
        <h3 style="margin-top:30px;">Delivery Address</h3>
        <p>${custDetails.custAddress}</p>
      `
          : ""
      }

      <hr style="margin:30px 0;">

      <p style="font-size:14px;color:#666;">
        If you have any questions about your order, simply reply to this email .
      </p>

      <p style="margin-top:30px;">
        Thank you for choosing <strong>${custDetails.restName}</strong> ❤️
      </p>

    </div>

  </div>
  `,
});
  
  }
  catch(err){
     err.status = 404
    next(err)
  }
  

  
}
const updateOrder = async (req, res,next) => {
  const { id, status } = req.body;

  try {
    // Get existing order
    const order = await prisma.orders.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Update status
    await prisma.orders.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

   if (status === "confirmed") {
  const items =
    typeof order.orderDetails === "string"
      ? JSON.parse(order.orderDetails)
      : order.orderDetails;

  if (Array.isArray(items)) {
    for (const item of items) {
      await prisma.inventory.update({
        where: {
          id: item.dbId,
        },
        data: {
          stockAmount: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
  try {
  await invalidateInventoryCache(req.user.id, order.restId);
} catch (err) {
   err.status = 404
    next(err)
}
  
}


    // Send cancellation email
    if (status === "cancelled") {
      await resend.emails.send({
        from: "orders@crimsoncastle.shop",
        to: order.custEmail,
        subject: `Order #${order.orderNumber} Cancelled`,
        html: `
        <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">

          <div style="background:#dc2626;color:white;padding:24px;text-align:center;">
            <h1>${order.restName}</h1>
          </div>

          <div style="padding:24px;">

            <h2>Order Cancelled</h2>

            <p>Hi <strong>${order.custName}</strong>,</p>

            <p>Unfortunately, your order has been <strong>cancelled</strong>.</p>

            <p>
              <strong>Order Number:</strong> ${order.orderNumber}
            </p>

            <p>
              If you have already made a payment, any applicable refund will be processed according to our refund policy.
            </p>

            <p>
              If you believe this cancellation was made in error, please contact us.
            </p>

            <hr>

            <p>
              Thank you,<br>
              <strong>${order.restName}</strong>
            </p>

          </div>

        </div>
        `,
      });
    }

    res.json({
      message: "Order status updated",
    });
  } catch (err) {
  err.status = 404
    next(err)

 
}
};

export {viewOrder,addOrder,updateOrder}