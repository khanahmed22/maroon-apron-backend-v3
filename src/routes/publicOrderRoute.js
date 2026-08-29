import { Router } from 'express'
import { publicOrderViewController } from '../controllers/publicOrderController.js';
const publicOrderRouter = Router()

publicOrderRouter.get("/:orderNumber", publicOrderViewController);

export default publicOrderRouter