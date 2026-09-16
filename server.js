import express from 'express'
import prisma from './src/db.js'
import authRouter from './src/routes/authRoute.js'
import inventRouter from './src/routes/inventRoutes.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import imageUploadRouter from './src/routes/uploadRoute.js'
import orderRouter from './src/routes/orderRoutes.js'
import restIdRouter from './src/routes/restIdRoute.js'
import giveRestDetails from './src/routes/giveRestDetailRoute.js'
import settingRouter from './src/routes/settingRoute.js'
import publicOrderRouter from './src/routes/publicOrderRoute.js'
import orderByUserIdRouter from './src/routes/getOrderByUserIdRoute.js'
import custRouter from './src/routes/getCustomers.js'
import http from 'http'
import { initSocket } from './src/utils/socket.js'
import paddleAccountRouter from './src/routes/paddleAccountRoute.js'
import forgotPasswordRouter from './src/routes/forgotPassword.js'
import resetPasswordRouter from './src/routes/resetPassword.js'
import subRouter from './src/routes/subdomainRoute.js'
import { rateLimiter } from './src/redisLimitware/redisLimit.js'
import deliveryRouter from './src/routes/deliveryZoneRoute.js'
import analyticsRouter from './src/routes/analyticsRoute.js'
import couponRouter from './src/routes/couponRoute.js'
import fixRouter from './src/routes/fixRateRoute.js'
import errorMiddleware from './src/errorMiddleware/errorMiddleware.js'
import netlifyRouter from './src/routes/netlifyRoute.js'
import menuScanRouter from './src/routes/menuScanRoute.js'
import firebaseNotif from './src/routes/firebaseRoute.js'
import deleteAccountRouter from './src/routes/deleteAccountRoute.js'
import revenueCatRouter from './src/routes/revenueCatRoute.js'

import "./src/jobs/cleanupPasswordResetTokens.js";
import "./src/jobs/cleanupCouponCode.js"

dotenv.config()

async function isAllowedOrigin(origin) {
  const url = new URL(origin)

  if (origin === process.env.CRIMSON_ADMIN_URL) return true

   // Capacitor Android app
if (origin === "https://android.maroonapron.com") {
  return callback(null, true);
}
  if (
    url.hostname.endsWith('.localhost') &&
    url.port === '3001'
  ) {
    return true
  }

  if (url.hostname.endsWith(".crimsoncastle.shop")) {
    return true
  }

  const merchant = await prisma.restList.findFirst({
    where: {
      customDomain: url.hostname,
    },
  })

  return !!merchant
}

const app = express()

app.set('trust proxy', 1)

app.use(
  cors({
    origin: async (origin, callback) => {
      if (!origin) return callback(null, true)

      callback(null, await isAllowedOrigin(origin))
    },
    credentials: true,
  })
)

const server = http.createServer(app)
initSocket(server)


app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



// Uploads
app.use('/assets', rateLimiter(100, 60), imageUploadRouter)

// Auth
app.use('/auth', rateLimiter(20, 60), authRouter)

// General 
app.use('/inventory', rateLimiter(200, 60), inventRouter)
app.use('/orders', rateLimiter(50, 60), orderRouter)
app.use('/:subdomain/my-orders', rateLimiter(30, 60), orderByUserIdRouter)
app.use('/restId', rateLimiter(100, 60), restIdRouter)
app.use('/restDetails', rateLimiter(100, 60), giveRestDetails)
app.use('/settings', rateLimiter(50, 60), settingRouter)
app.use('/order-placed', rateLimiter(20, 60), publicOrderRouter)
app.use('/customers', rateLimiter(50, 60), custRouter)

app.use('/account', rateLimiter(300, 60), paddleAccountRouter)
app.use('/account-google',rateLimiter(300, 60),revenueCatRouter)
app.use('/area-list',rateLimiter(100, 60),deliveryRouter)

app.use('/analytics', rateLimiter(50, 60), analyticsRouter)
app.use("/coupons", rateLimiter(80, 60),couponRouter);




app.use(
  '/forgot-password',
  rateLimiter(3, 300),
  forgotPasswordRouter
)

app.use(
  '/reset-password',
  rateLimiter(5, 300),
  resetPasswordRouter
)

app.use('/restaurant', rateLimiter(100, 60), subRouter)





app.use(
  '/fix-rate',
  rateLimiter(200, 60),
  fixRouter
)
app.use("/menu-scan",menuScanRouter);

app.use("/delete-account", rateLimiter(30, 60),deleteAccountRouter);



app.use("/api/netlify",rateLimiter(300, 60), netlifyRouter);

app.use("/notifications",firebaseNotif)


//health for uptime robot
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//error middleware

app.use(errorMiddleware)


server.listen(3000, () => {
  console.log('Server running')
})