import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { restIdController } from "../controllers/restIdController.js";


const restIdRouter = Router()

restIdRouter.post('/',protect, restIdController)

export default restIdRouter
