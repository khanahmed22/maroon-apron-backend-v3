import {Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import { paddleAccountController,createPaddleLink,paddleWebhook } from "../controllers/paddleController.js";
const paddleAccountRouter = Router()

//paddle

paddleAccountRouter.get("/paddle", protect, paddleAccountController);

paddleAccountRouter.post("/create-paddle-link", protect, createPaddleLink);

paddleAccountRouter.post("/paddle-webhook", paddleWebhook);





export default paddleAccountRouter