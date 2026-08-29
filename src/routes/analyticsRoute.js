import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { analyticsController } from "../controllers/analyticsController.js";

const analyticsRouter = Router();

analyticsRouter.get("/orders/:restId", protect, analyticsController );

export default analyticsRouter;