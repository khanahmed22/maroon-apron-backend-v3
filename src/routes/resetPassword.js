import { Router } from "express";
import { verifyTokenController,resetPasswordController } from "../controllers/resetPasswordController.js";

const resetPasswordRouter = Router();


resetPasswordRouter.get("/:token", verifyTokenController);


resetPasswordRouter.post("/", resetPasswordController );

export default resetPasswordRouter;