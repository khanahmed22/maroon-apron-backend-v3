import {Router} from "express";
import { getCustomerController } from "../controllers/getCustomersController.js";
import { protect } from '../authMiddleware/protect.js'

const custRouter = Router()

custRouter.get('/:subdomain', protect,getCustomerController)

export default custRouter