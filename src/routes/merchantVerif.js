import express,{Router} from 'express'
import prisma from "../db.js";
import { protect } from '../authMiddleware/protect.js';
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY)
const merchantVerifRouter = Router()
merchantVerifRouter.post("/",protect, async (req, res,next) => {

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

  await resend.emails.send({
  from: "no-reply@crimsoncastle.shop",
  to: process.env.ADMIN_EMAIL,
  subject: "Merchant Application",
  html: `
   <h2>New Merchant Application</h2>

<p><strong>Name:</strong> ${full_name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone}</p>
<p><strong>Business:</strong> ${business_name}</p>
<p><strong>Category:</strong> ${category}</p>
<p><strong>Address:</strong> ${address}</p>
<p><strong>Description:</strong> ${description}</p>
<p><strong>Social:</strong> ${social_links ?? "N/A"}</p>
<p><strong>CNIC:</strong> ${cnic}</p>

    
  `,

});
  

  return res.json({success:'application submitted'})
  }   
  catch(err){
   err.status = 500
    next(err)

  }

  
});

merchantVerifRouter.get('/submitted-application',protect,async(req,res,next)=>{

  const userId = req.user.id

  try{
    const checkSubmission = await prisma.merchantApps.findUnique({
    where:{userId:userId},
    select:{status:true}
  })

  return res.json(checkSubmission)
  }
  catch(err){
    err.status = 500
    next(err)

  }

  
})

export default  merchantVerifRouter