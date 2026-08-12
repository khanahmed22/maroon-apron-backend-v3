import express, { Router } from 'express'
import { registerMerchant,register } from '../controllers/authController.js'
import { loginMerchant,loginCustomer } from '../controllers/authController.js'
import { logout } from '../controllers/authController.js'
import { me } from '../controllers/authController.js'
import { verifyEmail } from '../controllers/authController.js'
import { protect } from '../authMiddleware/protect.js'

const authRouter = Router({
   mergeParams:true
})

authRouter.post('/register-merchant', registerMerchant)

authRouter.post('/register',register)

authRouter.post('/login-merchant', loginMerchant)

authRouter.post('/login', loginCustomer)

authRouter.post('/logout', logout)

authRouter.get("/verify-email/:role/:token", verifyEmail);


authRouter.get('/me',protect, me) //

export default authRouter