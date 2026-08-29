import {Router} from "express";
import { updateNetlifyDomainAlias } from "../controllers/netlifyController.js";
import { protect } from "../authMiddleware/protect.js";
const netlifyRouter = Router()

netlifyRouter.patch("/domain-alias",protect,updateNetlifyDomainAlias)

export default netlifyRouter;