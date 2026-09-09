import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { revenueCatWebhook, checkGooglePlayEligibility } from "../controllers/revenueCatController.js";

const revenueCatRouter = Router();

revenueCatRouter.get("/eligibility", protect, checkGooglePlayEligibility);
revenueCatRouter.post("/revenuecat-webhook", revenueCatWebhook);

export default revenueCatRouter;