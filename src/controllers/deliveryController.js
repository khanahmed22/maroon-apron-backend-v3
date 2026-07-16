import prisma from "../db.js";

//view areas

const viewAreas = async (req, res) => {
 
  const restId = req.params.restId

  try {
    const result = await prisma.areaList.findMany({
      where:{restId},
      select:{
        minOrder:true,
        areaName:true,
        cityName:true,
        areaId:true,
        id:true,
        restId:true,
        deliveryFee:true
        

      }
    });

    

    return res.json(result);
  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

// add areas

const addArea = async(req,res)=>{
  const restId = req.params.restId
  const userId = req.user.id
  const {deliveryFee,minOrder,areaName,cityName} = req.body

  try{
    const add = await prisma.areaList.create({
      data:{
        areaName,
        cityName,
        deliveryFee,
        minOrder,
        userId:userId,
        restId:restId
      }
    })

    if(add.userId !== userId){
      return res.json({error:'something went wrong'})
    }

    if(add.restId !== restId){
       return res.json({error:'something went wrong'})
    }

    return res.json({status:'success',message:'area added'})
  }
  catch(err){
    res.json({error:'could not add area',err})
  }

}

//delete area

const deleteArea = async (req, res) => {
  try {
    const { restId } = req.params;
    const { areaId } = req.body;
    const userId = req.user.id;

    if (!areaId) {
      return res.status(400).json({
        error: "Area ID is required",
      });
    }

    const area = await prisma.areaList.findUnique({
      where: { areaId },
      select: {
        userId: true,
        restId: true,
      },
    });

    if (!area) {
      return res.status(404).json({
        error: "Area not found",
      });
    }

    if (area.userId !== userId || area.restId !== restId) {
      return res.status(403).json({
        error: "Not authorized",
      });
    }

    await prisma.areaList.delete({
      where: { areaId },
    });

    return res.json({
      status: "success",
      message: "Area deleted successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete area",
    });
  }
};

//update area

const updateArea = async (req, res) => {
  const { areaId, cityName, areaName } = req.body;
  const { restId } = req.params;
  const userId = req.user.id;

  try {
    if (!areaId) {
      return res.status(400).json({
        error: "Area ID is required",
      });
    }

    const area = await prisma.areaList.findUnique({
      where: { areaId },
      select: {
        userId: true,
        restId: true,
      },
    });

    if (!area) {
      return res.status(404).json({
        error: "Area not found",
      });
    }

    if (area.userId !== userId || area.restId !== restId) {
      return res.status(403).json({
        error: "Not authorized",
      });
    }

    await prisma.areaList.update({
      where: { areaId },
      data: {
        areaName,
        cityName,
      },
    });

    return res.json({
      status: "success",
      message: "Area updated successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update area",
    });
  }
};
export {viewAreas,addArea,deleteArea,updateArea}