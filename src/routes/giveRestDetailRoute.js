import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import { customerFacingRestDetails,merchantFacingRestDetails } from "../controllers/restDetailsController.js";
const giveRestDetails = Router()

//customer

giveRestDetails.post("/", customerFacingRestDetails );

//merchant

giveRestDetails.get("/merchant",protect, merchantFacingRestDetails)



export default giveRestDetails