import { Router } from "express";
import { merchantForgotPassWController,customerForgotPassWController } from "../controllers/forgotPasswordController.js";

const forgotPasswordRouter = Router();

//merchant

forgotPasswordRouter.post("/merchant", merchantForgotPassWController);


//customer

forgotPasswordRouter.post("/customer", customerForgotPassWController);

export default forgotPasswordRouter;