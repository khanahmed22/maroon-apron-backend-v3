import { Router } from "express";
import {updateRestaurantSettings } from "../controllers/settingController.js";
import { protect } from '../authMiddleware/protect.js'

const settingRouter = Router()

settingRouter.put('/',protect,updateRestaurantSettings)

export default settingRouter 