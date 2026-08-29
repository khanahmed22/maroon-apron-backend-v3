import {Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import { accountController,createPaddleLink,paddleWebhook } from "../controllers/accountController.js";
const accountRouter = Router()


accountRouter.get("/account", protect, accountController);

accountRouter.post("/create-paddle-link", protect, createPaddleLink);

accountRouter.post("/webhook", paddleWebhook);

export default accountRouter