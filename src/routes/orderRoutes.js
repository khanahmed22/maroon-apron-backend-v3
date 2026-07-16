import express from 'express'
import { Router } from 'express'
import { viewOrder,addOrder, updateOrder} from '../controllers/orderController.js'
import { protect } from '../authMiddleware/protect.js'
const orderRouter = Router()

orderRouter.get('/:restId',viewOrder)


orderRouter.post('/',addOrder)

orderRouter.put('/',protect,updateOrder)

export default orderRouter
