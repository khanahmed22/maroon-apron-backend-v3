import {Router} from "express";
import { getCustomerController } from "../controllers/getCustomersController.js";

const custRouter = Router()

custRouter.get('/:subdomain', getCustomerController)

export default custRouter