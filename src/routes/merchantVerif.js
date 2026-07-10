import express,{Router} from 'express'
import prisma from "../db.js";
import { protect } from '../authMiddleware/protect.js';

const merchantVerifRouter = Router()
merchantVerifRouter.post("/",protect, async (req, res) => {

  const userId = req.user.id
  const {
   
    email,
    full_name,
    phone,
    business_name,
    address,
    category,
    description,
    social_links,
    cnic,
  } = req.body;

  const checkUserExists = await prisma.user.findUnique({
    where:{id:userId}
  })

  if(!checkUserExists){
    return res.json({error:'sign up first'})
  }

  const checkSubmission = await prisma.merchantApps.findUnique({
    where:{userId:userId}
  })

  if(checkSubmission){
    return res.json({error:'application already submitted'})
  }

  try{
    const application = await prisma.merchantApps.create({
    data:{
      userId: userId,
      email:email,
      full_name:full_name,
      phone:phone,
    business_name:business_name,
    address:address,
    category:category,
    description:description,
    social_links:social_links,
    cnic:cnic,


    }
  })

  res.json({success:'application submitted'})
  }   
  catch(err){
    return res.json({error:'unable to submit application',err})
  }

  
});

merchantVerifRouter.get('/submitted-application',protect,async(req,res)=>{

  const userId = req.user.id

  try{
    const checkSubmission = await prisma.merchantApps.findUnique({
    where:{userId:userId},
    select:{status:true}
  })

  res.json(checkSubmission)
  }
  catch(err){
    return res.json({error:'application not found'})
  }

  
})

export default  merchantVerifRouter