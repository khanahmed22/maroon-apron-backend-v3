import {Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import { orderByUserIdController } from "../controllers/getOrderByUserIdController.js";

const orderByUserIdRouter = Router({
  mergeParams: true,
})

orderByUserIdRouter.get("/", protect, orderByUserIdController);
export  default orderByUserIdRouter