import  { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { viewFixRateController,updateFixRateController,enableFixRateController,disbleFixRateController } from "../controllers/fixRateController.js";

const fixRouter = Router();


// View fixed rate
fixRouter.get("/:restId/view", viewFixRateController);

// Update fixed rate + minimum order
fixRouter.put("/:restId/update", protect, updateFixRateController);

// Enable fixed rate mode
fixRouter.put("/enableFixRate", protect, enableFixRateController);

// Disable fixed rate mode
fixRouter.put("/disableFixRate", protect, disbleFixRateController);

export default fixRouter;