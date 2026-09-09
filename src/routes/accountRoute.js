import {Router} from "express";
import { protect } from "../authMiddleware/protect.js";
import { paddleAccountController,createPaddleLink,paddleWebhook } from "../controllers/accountController.js";
const accountRouter = Router()

//paddle

accountRouter.get("/paddle", protect, paddleAccountController);

accountRouter.post("/create-paddle-link", protect, createPaddleLink);

accountRouter.post("/paddle-webhook", paddleWebhook);

//google play



export default accountRouter