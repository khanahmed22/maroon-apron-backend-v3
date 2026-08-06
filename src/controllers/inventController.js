import prisma from "../db.js"
import { z} from 'zod'
import cloudinary from "../../config/cloudinary.js"
import { redisClient } from "../../redis.js"

//cache invalidator

const invalidateInventoryCache = async (userId, restId) => {
  const restaurant = await prisma.restList.findUnique({ where: { id: restId } });
  await redisClient.del(`viewItemMerchant:${userId}`);
  if (restaurant?.subdomain) {
    await redisClient.del(`viewItemCustomer:${restaurant.subdomain}`);
  }
};

//inventory limit checker 

const InventLimitChecker = async (userId, currentItems) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.plan === "free" && currentItems >= 5) {
    throw new Error("Only 5 items allowed in the free plan");
  }

  if (user.plan === "pro" && currentItems >= 100) {
    throw new Error("Only 100 items allowed in the pro plan");
  }
};


//add item

const addItemSchema = z.object({
  name: z.number().min(3),
  price: z.number().min(0).default(0),
  costPrice: z.string(),
  imageUrl: z.string().optional(),
  restId: z.string(),
   publicId:z.string(),
  stockAmount: z.number().int().nonnegative(),
  restName: z.string(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  variants: z
    .array(
      z.object({
        variantName: z.string().min(1),
        variantPrice: z.number().nonnegative(),
        variantCostPrice:z.number().nonnegative()
      })
    )
    .optional(),
});

//add item

const addItem = async (req, res,next) => {
  try {
    const {
      name,
      price,
      variants,
      imageUrl,
      publicId,
      restId,
      restName,
      category,
      stockAmount,
      costPrice,
      description,
    } = addItemSchema.parse(req.body);

    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        error: "Not Authorized",
      });
    }

    const currentItems = await prisma.inventory.count({
      where: {
        userId,
      },
    });

    await InventLimitChecker(userId, currentItems);

    const item = await prisma.inventory.create({
      data: {
        name,
        price,
        category,
        costPrice,
        description,
        userId,
        variants: {
          create: variants || [],
        },
        imageUrl,
        publicId,
        restId,
        restName,
        stockAmount,
      },
      include: {
        variants: true,
      },
    });

    await invalidateInventoryCache(userId, restId);

    return res.status(201).json({
      status: "success",
      message: "Item added successfully",
      data: item,
    });
  } catch (err) {
    err.status = 400
    next(err)
  }
};

//view item as merchant

const viewItem = async (req, res,next) => {
  const userId = req.user.id
  const cacheKey = `viewItemMerchant:${userId}`
  const cachedInventoryMerchant = await redisClient.get(cacheKey)

  if(cachedInventoryMerchant){
    return res.json({
      status:'success',
      data:JSON.parse(cachedInventoryMerchant),
      source:'redis'
    })
  }
  try {
    const restaurant = await prisma.restList.findUnique({
      where: {
        userId: userId
      },
      
      
    });

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    const items = await prisma.inventory.findMany({
      where: {
        restId: restaurant.id,
      },
      orderBy:{
        createdAt:'desc'
      },
      include: {
        variants: true,
      },
    });

  
    await redisClient.setEx(
    cacheKey,
    3600,
    JSON.stringify(items)
  )
  res.json({
    status: 'success',
    data: items,
    source: 'database'
  })
  } catch (err) {
    err.status = 500
    next(err)

  
  }
   
};

//view as customer

const viewPublicItem = async (req, res) => {
  const { subdomain } = req.params;
 
  const cacheKey = `viewItemCustomer:${subdomain}`
  const cachedInventoryCustomer = await redisClient.get(cacheKey)

  if(cachedInventoryCustomer){
    return res.json({
      status:'success',
      data:JSON.parse(cachedInventoryCustomer),
      source:'redis'
    })
  }


  const restaurant = await prisma.restList.findUnique({
    where: { subdomain },
    omit: {
    userId:true
  },
    
    
  });

  if (!restaurant) {
    return res.status(404).json({
      error: "Restaurant not found",
    });
  }

  const items = await prisma.inventory.findMany({
    where: {
      restId: restaurant.id,
    },
    omit: {
    userId:true
  },
    include: {
      variants: true,
    },
  });

 
  
    await redisClient.setEx(
    cacheKey,
    3600,
    JSON.stringify(items)
  )
  res.json({
    status: 'success',
    data: items,
    source: 'database'
  })
};

//delete item 

const deleteItem = async(req,res,next)=>{
  const {id} = req.body

  try{
    const item = await prisma.inventory.findUnique({
    where: {id:id}

    
  })
  if(!item){
      return res.json({error:'item does not exist'})
    }

  if(item.userId !== req.user.id){
    return res.json({error:'user does not exist'})
  }


  const deleteItem = await prisma.inventory.delete({
    where: {id:id}
  })
  

    // 2. if new image uploaded → delete old one
    if (item.imageUrl && item.publicId) {
      await cloudinary.uploader.destroy(item.publicId);
    }

    await invalidateInventoryCache(req.user.id, item.restId)
   res.json({
    status: 'success',message:'item deleted'
  })


  }
  catch(err){
    err.status = 400
    next(err)
  }

  
}


// update item

const updateItem = async (req, res,next) => {
  const { id, name, price, imageUrl, publicId, variants,restId,restName,category,stockAmount,costPrice,description } = req.body;
  try {
    // 1. get existing item
    const existingItem = await prisma.inventory.findUnique({
      where: { id:id },
    });
    if (!existingItem) {
      return res.json({ error: "Item not found" });
    }

    if (existingItem.userId !== req.user.id) {
  return res.status(403).json({
    error: "Not Authorized",
  });
}
    // 2. if new image uploaded → delete old one
    if (existingItem.imageUrl && existingItem.publicId) {
      await cloudinary.uploader.destroy(existingItem.publicId);
    }
    // 3. update DB
    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        name,
        price,
        description,
        category,
        restId,
        restName,
        stockAmount,
        costPrice,
        ...(imageUrl && { imageUrl }),
        ...(publicId && { publicId }),
        ...(variants && {
          variants: {
            deleteMany: {},
            create: variants.map((v) => ({
              variantName: v.variantName,
              variantPrice: v.variantPrice,
              variantCostPrice:v.variantCostPrice
            })),
          },
        }),
      },
      include: { variants: true },
    });
    await invalidateInventoryCache(req.user.id, updated.restId)
    res.json({
      status: "success",
      message: "item updated",
      data: updated,
    });
  } catch (err) {
    err.status = 400
    next(err)
  }
};


export {addItem,viewItem,viewPublicItem,deleteItem,updateItem}