import prisma from "../db.js";

const tourController =async (req,res,next)=>{
  const userId = req.user.id
  try{
    await prisma.user.update({
      where: {id:userId},
      data:{
        tourCompleted: true
      }
    })

    res.json({success:true})
  }
  catch(err){
    next(err)
  }
}



export { tourController}