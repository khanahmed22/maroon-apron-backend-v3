import prisma from "../db.js"
import {z} from 'zod'

const couponValidator = z.object({
  code: z.string().min(1),

  discountPercentage: z.number().int().min(1).max(100),

  minOrder: z.number().nonnegative(),

  expiry: z.coerce.date(),

  maxUses: z.number().int().positive(),

  maxUsesPerUser: z.number().int().positive(),
});

const getCoupons=async(req,res,next)=> {
  const { restId } = req.params;

  try {
    const coupons = await prisma.coupon.findMany({
      where: { restId },
    });

    return res.json(coupons);
  } catch (err) {
    err.status= 404
    next(err)
    
  }
}

//create coupon
const createCoupon= async(req, res,next)=> {
  const { restId } = req.params;
  const {
    code,
    discountPercentage,
    minOrder,
    expiry,
    maxUses,
    maxUsesPerUser,
  } = couponValidator.parse(req.body);

  if (!code || discountPercentage === undefined || !expiry) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase(),
        discountPercentage: Number(discountPercentage),
        minOrder: minOrder ? Number(minOrder) : 0,
        expiry: new Date(expiry),
        maxUses: maxUses ? Number(maxUses) : 1,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
        restId,
        userId: req.user?.id ?? null,
      },
    });

    return res.status(201).json(coupon);
  } catch (err) {
   
    err.status = 500
    next(err)
   
  }
}

//delete coupon
const deleteCoupon=async(req, res,next)=> {
  const { restId } = req.params;
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing coupon id" });
  }

  try {
    
    const { count } = await prisma.coupon.deleteMany({
      where: { id, restId },
    });

    if (count === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    err.status = 400
    next(err)
   
  }
}

const checkCoupon=async(code, restId, userId, cartTotal)=> {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
 
  if (!coupon || coupon.restId !== restId) {
    return { error: "Invalid or unavailable coupon"  };
  }
  if (!coupon.isActive) {
    return { error: "Coupon inactive" };
  }
  if (new Date(coupon.expiry) < new Date()) {
    return { error: "Coupon expired"  };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { error: "Coupon usage limit reached" };
  }
 
  const userUses = await prisma.couponUsage.count({
    where: { couponId: coupon.id, userId },
  });
  if (userUses >= coupon.maxUsesPerUser) {
    return { error: "You already used this coupon"  };
  }
 
  const minOrder = Number(coupon.minOrder);
  if (cartTotal < minOrder) {
    return { error: `Minimum order Rs.${minOrder} required` };
  }
 
  let discount = (cartTotal * coupon.discountPercentage) / 100;
  discount = Math.min(discount, cartTotal);
 
  return { coupon, discount };
}
 

const validateCoupon=async(req, res,next)=> {
  const { code, cartTotal, userId, restId } = req.body;
 
  if (!code || !userId || cartTotal === undefined || !restId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
 
  try {
    const result = await checkCoupon(code, restId, userId, Number(cartTotal));
 
    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }
 
    return res.json({
      valid: true,
      discount: result.discount,
      couponId: result.coupon.id,
    });
  } catch (err) {
    err.status = 500
    next(err)
    
  }
}

export async function redeemCoupon(couponId, userId) {
  await prisma.$transaction([
    prisma.couponUsage.create({
      data: { couponId, userId },
    }),
    prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);
}

export {getCoupons,createCoupon,deleteCoupon,validateCoupon}