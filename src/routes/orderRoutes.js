import { Router } from 'express'
import { viewOrder,addOrder, updateOrder} from '../controllers/orderController.js'
import { protect } from '../authMiddleware/protect.js'
const orderRouter = Router()

orderRouter.get('/:restId',viewOrder)


orderRouter.post('/',addOrder)  // for customer and guest

orderRouter.put('/',protect,updateOrder)

export default orderRouter
