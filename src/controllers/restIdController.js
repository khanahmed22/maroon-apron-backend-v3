import prisma from "../db.js";

export const restIdController = async(req,res,next)=>{

  
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