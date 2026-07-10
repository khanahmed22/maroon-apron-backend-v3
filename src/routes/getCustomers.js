import express,{Router} from "express";
import prisma from "../db.js";
const custRouter = Router()

custRouter.get('/:subdomain', async(req,res)=>{
  const {subdomain} = req.params

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

})

export default custRouter