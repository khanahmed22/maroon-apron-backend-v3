import express from "express";
import { Router } from "express";
import prisma from "../db.js";
import { protect } from "../authMiddleware/protect.js";
const giveRestDetails = Router()
//customer
giveRestDetails.post("/",async(req,res,next)=>{
  const {subdomain} = req.body

  try{
    const getRest = await prisma.restList.findUnique({
    where:{subdomain:subdomain},
    select: {
    id: true,
    createdAt: true,
    restName: true,
    restPhone: true,
    restEmail: true,
    restAddress: true,
    restAnnouncement:true,
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
    preOrdersEnabled:true,
    preoOrderMinHours: true,
    preOrderMaxDays:true,
    pickUpWindows:true,
    deliveryWindows:true,
    lat:true,
    long:true,
    crimsonBranding:true
    
  }}) 

  if(!getRest){
    return res.json({error:'no restaurant found'})
  }

  res.json({getRest})
  }
  catch(err){
    err.status = 500
    next(err)

  }
  
  
  
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
    restAnnouncement:true,
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
    preOrdersEnabled:true,
    preoOrderMinHours: true,
    preOrderMaxDays:true,
    pickUpWindows:true,
    deliveryWindows:true,
    lat:true,
    long:true,
    crimsonBranding:true
  },
  }) 

  if(!getRest){
    return res.json({error:'merchant doesnt match'})
  }

  res.json({getRest})
  
})



export default giveRestDetails