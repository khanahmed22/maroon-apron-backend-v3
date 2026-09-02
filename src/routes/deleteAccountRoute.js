import { Router } from "express";
import { protect } from '../authMiddleware/protect.js';
import { deleteAccountController } from "../controllers/deleteAccountController.js";
const deleteAccountRouter = Router()

deleteAccountRouter.delete('/',protect, deleteAccountController )

export default deleteAccountRouter