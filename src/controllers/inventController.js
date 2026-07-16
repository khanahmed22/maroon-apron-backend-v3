import prisma from "../db.js"
import {positive, z} from 'zod'
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


//add item

const addItemSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  costPrice: z.string(),
  imageUrl: z.string().optional(),
  restId: z.string(),
  stockAmount: z.number().int().nonnegative(),
  restName: z.string(),
  category: z.string().nullable().optional(),
  variants: z
    .array(
      z.object({
        variantName: z.string().min(1),
        variantPrice: z.number().nonnegative(),
      })
    )
    .optional(),
});

//add item

const addItem =async(req,res)=>{
  const {name,price,variants,imageUrl, publicId,restId,restName,category,stockAmount,costPrice} = addItemSchema.parse(req.body)

  try{
    const addItem = await prisma.inventory.create({
    data:{
      name,
      price,
      category,
      costPrice,
      userId: req.user.id,
      
      variants:{
        create: variants || []
      },
      imageUrl, 
      publicId,
      restId,
      restName,
      stockAmount,
   

    },
    include: {
      variants: true
    }

  })

  await invalidateInventoryCache(req.user.id, restId)

  res.json({status: 201,message: 'item added successfully'})
  }
  catch(err){
    console.error(err)
    res.json({status:400,message: 'could not add item',err})
  }

  


}


//view item as merchant

const viewItem = async (req, res) => {
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
    console.log(err);

    res.status(500).json({
      error: "Failed to fetch inventory",
    });
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

const deleteItem = async(req,res)=>{
  const {id} = req.body

  try{
    const item = await prisma.inventory.findUnique({
    where: {id:id}

    
  })
  if(!item){
      return res.json({error:'item does not exist'})
    }

  if(item.userId !== req.user.id){
    res.json({error:'user does not exist'})
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
    console.log(err)
    res.json({
      status:'failed', message:'item could not be deleted',err
    })
  }

  
}


// update item

const updateItem = async (req, res) => {
  const { id, name, price, imageUrl, publicId, variants,restId,restName,category,stockAmount,costPrice } = req.body;
  try {
    // 1. get existing item
    const existingItem = await prisma.inventory.findUnique({
      where: { id:id },
    });
    if (!existingItem) {
      return res.json({ error: "Item not found" });
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
    console.log(err);
    res.json({ status: "failed", message: "failed to update item" });
  }
};


export {addItem,viewItem,viewPublicItem,deleteItem,updateItem}