import express from "express";
import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";
const restIdRouter = Router()
const fetchRestId = async(req,res)=>{
  const userId = req.user.id
  const getId = await prisma.restList.findUnique({
    where:{userId:userId }
  })

  if(!getId){
    res.json('no restaurant owner found')
  }

  return res.json({
    getId
  })
}


restIdRouter.post('/',protect, fetchRestId)

export default restIdRouter
