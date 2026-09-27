import { Router } from 'express'
import { registerMerchant,registerCustomer,loginMerchant,loginCustomer,googleRegisterMerchant, googleRegisterCustomer,
  googleLoginMerchant, googleLoginCustomer } from '../controllers/authController.js'
import { logout } from '../controllers/authController.js'
import { me } from '../controllers/authController.js'
import { verifyEmail } from '../controllers/authController.js'
import { protect } from '../authMiddleware/protect.js'

const authRouter = Router({
   mergeParams:true
})

// local

authRouter.post('/register-merchant', registerMerchant)

authRouter.post('/register-customer',registerCustomer)

authRouter.post('/login-merchant', loginMerchant)

authRouter.post('/login-customer', loginCustomer)

authRouter.post('/logout', logout)

authRouter.get("/verify-email/:role/:token", verifyEmail);

// google

authRouter.post('/register-merchant-google', googleRegisterMerchant)
authRouter.post('/register-customer-google', googleRegisterCustomer)
authRouter.post('/login-merchant-google', googleLoginMerchant)
authRouter.post('/login-customer-google', googleLoginCustomer)


authRouter.get('/me',protect, me) //

export default authRouter