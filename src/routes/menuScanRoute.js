import  { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { menuScanController } from "../controllers/menuScanController.js";

const menuScanRouter = Router();

menuScanRouter.post("/parse", protect, menuScanController);

export default menuScanRouter;