import { Router } from "express";
import { subdomainController } from "../controllers/subdomainController.js";

const subRouter = Router();

subRouter.get("/", subdomainController);

export default subRouter;