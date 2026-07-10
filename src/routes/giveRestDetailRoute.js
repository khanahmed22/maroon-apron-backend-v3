import express from "express";
import { Router } from "express";
import prisma from "../db.js";
import { protect } from "../authMiddleware/protect.js";
const giveRestDetails = Router()
//customer
giveRestDetails.post("/",async(req,res)=>{
  const {subdomain} = req.body
  
  const getRest = await prisma.restList.findUnique({
    where:{subdomain:subdomain}
  }) 

  if(!getRest){
    return res.json({error:'no restaurant found'})
  }

  res.json({getRest})
  
})

//merchant

giveRestDetails.get("/merchant",protect,async(req,res)=>{
  const userId = req.user.id
  
  const getRest = await prisma.restList.findUnique({
    where:{userId:userId}
  }) 

  if(!getRest){
    return res.json({error:'merchant doesnt match'})
  }

  res.json({getRest})
  
})



export default giveRestDetails