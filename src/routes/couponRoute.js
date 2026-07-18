import express,{Router} from 'express'
import { getCoupons,createCoupon,deleteCoupon,validateCoupon } from '../controllers/CouponController.js';
import { protect } from '../authMiddleware/protect.js';
const couponRouter = Router();


couponRouter.get("/:restId/view",protect, getCoupons);
couponRouter.post("/:restId/add",protect, createCoupon);
couponRouter.delete("/:restId/delete",protect, deleteCoupon);


couponRouter.post("/validate", validateCoupon);

export default couponRouter;