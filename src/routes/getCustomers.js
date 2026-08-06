import express,{Router} from "express";
import prisma from "../db.js";
const custRouter = Router()

custRouter.get('/:subdomain', async(req,res,next)=>{

  const {subdomain} = req.params

  try{
    const getCustomers = await prisma.user.findMany({
    where: {subdomain: subdomain},
    select:{
      email:true,
      name:true
    }
  })

  if(!getCustomers){
    res.json({error:'no customers found for this restaurant'})
  }

  res.json(getCustomers)

  }
  catch(err){
    err.status = 500
    next(err)

  }

  
})

export default custRouter