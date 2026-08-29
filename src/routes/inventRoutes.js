import { Router } from "express";
import { addItem, deleteItem, viewItem,updateItem,viewPublicItem } from "../controllers/inventController.js";
import { protect } from "../authMiddleware/protect.js";

const inventRouter = Router()


inventRouter.post('/',protect, addItem)

inventRouter.get('/',protect,viewItem)

inventRouter.get("/:subdomain", viewPublicItem);

inventRouter.delete('/',protect,deleteItem)

inventRouter.put('/',protect,updateItem)


export default inventRouter 