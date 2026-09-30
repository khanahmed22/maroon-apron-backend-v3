import { Router } from "express";
import { protect } from '../authMiddleware/protect.js'
import { tourController } from "../controllers/tourController.js";

const tourRouter = Router()

tourRouter.patch('/',protect,tourController)

export default tourRouter