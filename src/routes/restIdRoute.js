import express from "express";
import { Router } from "express";
import { protect } from "../authMiddleware/protect.js";
import prisma from "../db.js";
const restIdRouter = Router()
const fetchRestId = async(req,res,next)=>{

  
  const userId = req.user.id

  try{
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
  catch(err){
    err.status = 404
    next(err)

  }
 
}


restIdRouter.post('/',protect, fetchRestId)

export default restIdRouter
