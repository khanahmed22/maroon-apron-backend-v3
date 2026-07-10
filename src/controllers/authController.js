import prisma from "../db.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../utils/generateToken.js"
import jwt from "jsonwebtoken"
import { verificationToken } from "../utils/emailToken.js"
import { Resend } from "resend"
import {z} from 'zod'

const registerSchemaMerchant = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
    ),
  role: z.enum(["merchant"]),
});

const registerSchemaCustomer = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
    ),
  role: z.enum(["customer"]),
  subdomain: z.string().min(3),
});


const resend = new Resend(process.env.RESEND_API_KEY)

//register logic for merchant

const registerMerchant =async (req,res)=>{
  const {name,email,password,role} = registerSchemaMerchant.parse(req.body)

  //Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: {email: email},
    select:{
      id:true,
      email:true
    }
  })

  if(userExists){
    return res.status(400).json({error: 'User already exists with this email'})
  }

  //Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password,salt)

  //Create User

  const user = await prisma.user.create({
    data:{
      name,
      email,
      password: hashedPassword,
      role
    }
  })

  //create verification token
  
  const verifToken = verificationToken(user.id)

   
  const verificationUrl = `${process.env.CRIMSON_ADMIN_URL}/verify-email/${role}/${verifToken}`;

  await resend.emails.send({
  from: "team@pizzatown.lol",
  to: user.email,
  subject: "Verify your email",
  html: `
    <h2>Welcome Merchant</h2>
    <p>Click below to verify your email.</p>

    <a href="${verificationUrl}">
      Verify Email
    </a>
  `,

});
  

  return res.json({message: 'user created, email sent'})

  
}

//register logic for customer

const register =async (req,res)=>{
  const {name,email,password,role,subdomain} = registerSchemaCustomer.parse(req.body)

  //Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: {email: email},
    select:{
      id:true,
      email:true
    }
  })

  if(userExists){
    return res.status(400).json({error: 'User already exists with this email'})
  }

  //Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password,salt)

  //Create User

  const user = await prisma.user.create({
    data:{
      name,
      email,
      password: hashedPassword,
      role,
      subdomain

    }
  })

  //create verification token
  
  const verifToken = verificationToken(user.id)

  const verificationUrl = `http://${subdomain}.${process.env.CRIMSON_NEXT_URL}/verify-email/${role}/${verifToken}`;

  await resend.emails.send({
  from: "team@pizzatown.lol",
  to: user.email,
  subject: "Verify your email",
  html: `
    <h2>Welcome Customer</h2>
    <p>Click below to verify your email.</p>

    <a href="${verificationUrl}">
      Verify Email
    </a>
  `,

});
  

  return res.json({message: 'user created, email sent'})

  
}

//Verify Email

const verifyEmail = async(req,res)=>{
  try{
    const {token} = req.params

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
    id: true,
  },
    })

    if(!user){
      return res.status(400).json({error:"user not found"})
    }

    await prisma.user.update({
      where:{id:user.id},
      data:{
        isVerified:true
      }
    })

    res.json({status:'success',message:'email verified'})
  }
  catch(err){
    console.log(err)
    res.json({
      status:'failed',
      message:'Invalid or expired token'
    })
  }
}

//Login Logic for merchant

const loginMerchant = async(req,res)=>{
  const {email,password} = req.body



  //Check if user email already exists

  const user = await prisma.user.findUnique({
    where: {email: email },
     select: {
    id: true,
    email: true,
    password: true,
    isVerified: true,
    role: true,
  },
  })

  if(!user){
    return res.status(400).json({
      error: "Invalid email or password"
    })
  }

  if(!user.isVerified){
    return res.status(403).json({
      error:'email not verified'
    })
  }

  //verify password

  const isPasswordValid = await bcrypt.compare(password,user.password)

  if(!isPasswordValid){
    return res.status(401).json({error: 'Invalid email or password'})
  }

  //verify merchant status

  if(user.role !== 'merchant'){
    return res.status(401).json({error:'access denied, merchant account required'})
  }

 

  

  //Generate JWT Token

  const token = generateToken(user.id,res)

  res.status(201).json({
    status: 'success',
    data:{
      user:{
        id: user.id,
        email: email
      },
      token
    }
  })
}


//Login Logic for customer

const loginCustomer = async(req,res)=>{
  const {email,password} = req.body



  //Check if user email already exists

  const user = await prisma.user.findUnique({
    where: {email: email },
     select: {
    id: true,
    email: true,
    password: true,
    isVerified: true,
    role: true,
  },
  })

  if(!user){
    return res.status(400).json({
      error: "Invalid email or password"
    })
  }

  if(!user.isVerified){
    return res.status(403).json({
      error:'email not verified'
    })
  }

  //verify password

  const isPasswordValid = await bcrypt.compare(password,user.password)

  if(!isPasswordValid){
    return res.status(401).json({error: 'Invalid email or password'})
  }

  //verify merchant status

  if(user.role !== 'customer'){
    return res.status(401).json({error:'access denied, customer account required'})
  }

 

  

  //Generate JWT Token
  console.log("Customer login");

  const token = generateToken(user.id,res)
console.log("Cookie should be set");
  res.status(201).json({
    status: 'success',
    data:{
      user:{
        id: user.id,
        email: email
      },
      token
    }
  })
}

// logout user

const logout = async(req,res)=>{
  res.cookie("jwt","",{
    httpOnly: true,
    expires: new Date(0)
  })
  res.status(200).json({
    status: "success",
    message: "logged out successfully"
  })
}




//check if user is signed in or not

const me = async (req, res) => {
  res.json({
    user: req.user,
  });
};




export {registerMerchant,register,loginMerchant,loginCustomer,logout,me,verifyEmail}