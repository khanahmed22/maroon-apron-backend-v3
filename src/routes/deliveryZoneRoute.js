import {Router} from 'express'
import { protect } from '../authMiddleware/protect.js';
import { addArea, viewAreas,deleteArea, updateArea } from '../controllers/deliveryController.js';

const deliveryRouter = Router({
  mergeParams:true
})


deliveryRouter.get("/:restId/view", viewAreas);

deliveryRouter.post("/:restId/add",protect,addArea)

deliveryRouter.delete("/:restId/delete",protect,deleteArea)

deliveryRouter.put("/:restId/update",protect,updateArea)



export default deliveryRouter
