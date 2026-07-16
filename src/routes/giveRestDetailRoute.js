import express from "express";
import { Router } from "express";
import prisma from "../db.js";
import { protect } from "../authMiddleware/protect.js";
const giveRestDetails = Router()
//customer
giveRestDetails.post("/",async(req,res)=>{
  const {subdomain} = req.body
  
  const getRest = await prisma.restList.findUnique({
    where:{subdomain:subdomain},
    select: {
    id: true,
    createdAt: true,
    restName: true,
    restPhone: true,
    restEmail: true,
    restAddress: true,
    restLogo: true,
    restBanner: true,
    logoId: true,
    bannerId: true,
    subdomain: true,
    restSite: true,
    restInstagram: true,
    restTheme:true,
    restFB: true,
    metaTitle: true,
    metaDesc: true,
    customDomain: true,
    
  }}) 

  if(!getRest){
    return res.json({error:'no restaurant found'})
  }

  res.json({getRest})
  
})

//merchant

giveRestDetails.get("/merchant",protect,async(req,res)=>{
  const userId = req.user.id
  
  const getRest = await prisma.restList.findUnique({
    where:{userId:userId},
    select: {
    id: true,
    createdAt: true,
    restName: true,
    restPhone: true,
    restEmail: true,
    restAddress: true,
    restLogo: true,
    restBanner: true,
    logoId: true,
    bannerId: true,
    subdomain: true,
    restSite: true,
    restInstagram: true,
    restTheme:true,
    restFB: true,
    metaTitle: true,
    metaDesc: true,
    customDomain: true,
  },
  }) 

  if(!getRest){
    return res.json({error:'merchant doesnt match'})
  }

  res.json({getRest})
  
})



export default giveRestDetails