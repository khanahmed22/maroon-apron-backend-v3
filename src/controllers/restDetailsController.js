import prisma from "../db.js";

const customerFacingRestDetails = async (req, res, next) => {
  const { subdomain } = req.body;

  try {
    const getRest = await prisma.restList.findFirst({
      where: {
        OR: [{ subdomain }, { customDomain: subdomain }],
      },
      select: {
        id: true,
        createdAt: true,
        restName: true,
        restPhone: true,
        restEmail: true,
        restAddress: true,
        restAnnouncement: true,
        restLogo: true,
        restBanner: true,
        logoId: true,
        bannerId: true,
        subdomain: true,
        restSite: true,
        restInstagram: true,
        restTheme: true,
        restFB: true,
        metaTitle: true,
        metaDesc: true,
        customDomain: true,
        preOrdersEnabled: true,
        preOrderMinHours: true,
        preOrderMaxDays: true,
        pickUpWindows: true,
        deliveryWindows: true,
        lat: true,
        long: true,
        crimsonBranding: true,
        orderingDisabled:true,
      },
    });

    if (!getRest) {
      return res.json({ error: "no restaurant found" });
    }

    res.json({ getRest });
  } catch (err) {
    err.status = 500;
    next(err);
  }
}

const merchantFacingRestDetails = async(req,res)=>{
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
    preOrderMinHours: true,
    preOrderMaxDays:true,
    pickUpWindows:true,
    deliveryWindows:true,
    lat:true,
    long:true,
    crimsonBranding:true,
    orderingDisabled:true

  },
  }) 

  if(!getRest){
    return res.json({error:'merchant doesnt match'})
  }

  res.json({getRest})
  
}

export {customerFacingRestDetails,merchantFacingRestDetails}