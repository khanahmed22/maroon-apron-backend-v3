import prisma from "../db.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../utils/generateToken.js"
import jwt from "jsonwebtoken"
import { verificationToken } from "../utils/emailToken.js"
import { Resend } from "resend"
import {z} from 'zod'
import { OAuth2Client } from "google-auth-library"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

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

const registerMerchant = async (req, res, next) => {
  try {
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
        role,
        authProvider: "local", 
      }
    })

    //create verification token

    const verifToken = verificationToken(user.id)


    const verificationUrl = `${process.env.CRIMSON_ADMIN_URL}/verify-email/${role}/${verifToken}`;

    await resend.emails.send({
      from: "team@maroonapron.com",
      to: user.email,
      subject: "Verify your email",
      html: ` <div style="margin:0; padding:40px 20px; background:#FBF7F6; font-family:Arial, Helvetica, sans-serif;"> <div style="max-width:560px; margin:0 auto;"> <div style="background:#D6293F; padding:28px 32px; border-radius:16px 16px 0 0; text-align:center;"> <div style="font-size:24px; font-weight:700; color:#FFFFFF; letter-spacing:-0.5px;"> Maroon Apron </div> </div> <div style="background:#FFFFFF; padding:40px 36px; border-radius:0 0 16px 16px; border:1px solid #E7E5E4; border-top:none;"> <h1 style="margin:0 0 16px; color:#171717; font-size:26px; line-height:1.3; font-weight:700;"> Welcome to Maroon Apron </h1> <p style="margin:0 0 28px; color:#6B7280; font-size:16px; line-height:1.6;"> You're almost ready to start running your food business online. Please verify your email address to activate your merchant account. </p> <div style="text-align:center; margin:32px 0;"> <a href="${verificationUrl}" style="display:inline-block; padding:14px 28px; background:#D6293F; color:#FFFFFF; text-decoration:none; font-size:15px; font-weight:700; border-radius:8px;" > Verify Email </a> </div> <p style="margin:28px 0 0; color:#6B7280; font-size:13px; line-height:1.6;"> If you didn't create a Maroon Apron account, you can safely ignore this email. </p> </div> <p style="margin:24px 0 0; text-align:center; color:#9CA3AF; font-size:12px;"> © Maroon Apron · Helping home chefs run their food business online </p> </div> </div> `,
    });

  // notify admin of new merchant sign up

  await resend.emails.send({
    from: "alert@maroonapron.com",
    to: `${process.env.ADMIN_EMAIL}`,
    subject: "NEW MERCHANT SIGNED UP",
    html: `
      <h2>A new merchant signed up at Maroon Apron</h2>
      <p>Merchant ID: ${user.id}</p>
      <p>Merchant Name: ${user.name}</p>
      <p>Merchant Email: ${user.email}</p>
      <p>Signed up at time: ${user.createdAt}</p>
      




      
    `,

  });

  


    return res.json({message: 'user created, email sent'})

  } catch(err){
    err.status = 400
    next(err)
  }
}


//register logic for customer

const registerCustomer = async (req, res, next) => {
  try {
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
        subdomain,
        authProvider: "local", 

      }
    })

    //create verification token

    const verifToken = verificationToken(user.id)

    const verificationUrl = `https://${subdomain}.${process.env.CRIMSON_NEXT_URL}/verify-email/${role}/${verifToken}`;

    await resend.emails.send({
    from: "team@maroonapron.com",
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

  } catch(err){
    err.status = 400
    next(err)
  }
}

//Verify Email

const verifyEmail = async (req, res, next) => {
  try {
    const { token, role } = req.params;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        role: true,
        isVerified: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found"
      });
    }

    // Make sure the role in URL matches the actual user role
    if (user.role !== role) {
      return res.status(403).json({
        error: "Invalid verification request"
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: "Email already verified"
      });
    }

    // Verify email + create restaurant in one transaction
    await prisma.$transaction(async (tx) => {

      await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          isVerified: true
        }
      });

      // Only merchants get a restaurant
      if (user.role === "merchant") {
        await tx.restList.create({
          data: {
            userId: user.id
          }
        });
      }
    });

    // Send welcome email AFTER verification succeeds
    if(user.role === "merchant"){
       try {
      await resend.emails.send({
        from: "onboarding@maroonapron.com",
        to: user.email,
        subject: "Welcome to Maroon Apron",
        html: `
  <h2>Welcome ${user.name}! 🎉</h2>

  <p>
    Your email has been successfully verified and your
    Maroon Apron account is now ready.
  </p>

  <p>
    We're glad to have you here. To get started with Maroon Apron,
    check out our Knowledge Base for helpful guides and information
    on getting the most out of your account.
  </p>

  <a
    href="${process.env.CRIMSON_ADMIN_URL}/login"
    style="
      display:inline-block;
      padding:12px 20px;
      background:#000;
      color:#fff;
      text-decoration:none;
      border-radius:6px;
      margin-right:8px;
    "
  >
    Login to Maroon Apron
  </a>

  <a
    href="${process.env.CRIMSON_ADMIN_URL}/knowledge-base"
    style="
      display:inline-block;
      padding:12px 20px;
      background:#f3f4f6;
      color:#000;
      text-decoration:none;
      border-radius:6px;
    "
  >
    Knowledge Base
  </a>

  <p style="margin-top:24px;">
    If you didn't create this account, you can safely ignore this email.
  </p>
`


      });
    } catch (emailError) {
      // Don't undo successful email verification just because
      // the welcome email failed.
      console.error("Failed to send welcome email:", emailError);
    }
    }
   

    return res.json({
      status: "success",
      message: "Email verified"
    });

  } catch (err) {
    err.status = 400;
    next(err);
  }
};

//Login Logic for merchant

const loginMerchant = async (req, res, next) => {
  try {
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
      authProvider:true
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

    if(user.authProvider !== 'local' || !user.password){
      return res.status(400).json({error: `This account was created with Google. Please use "Sign in with Google" instead.`})
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
  } catch(err){
    err.status = 500
    next(err)
  }
}


//Login Logic for customer

const loginCustomer = async (req, res, next) => {
  try {
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
      authProvider: true
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

    if(user.authProvider !== 'local' || !user.password){
      return res.status(400).json({error: `This account was created with Google. Please use "Sign in with Google" instead.`})
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
  } catch(err){
    err.status = 500
    next(err)
  }
}

// Google 

// Register

const googleRegisterMerchant = async (req, res, next) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload.email_verified) {
      return res.status(400).json({ error: "Google account email is not verified" })
    }

    const { sub: googleId, email, name } = payload

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, authProvider: true }
    })

    if (existing) {
      const message = existing.authProvider === "local"
        ? "This email already has a password account. Please log in with your email and password instead."
        : "An account with this email already exists. Please log in with Google instead."
      return res.status(409).json({ error: message })
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          role: "merchant",
          authProvider: "google",
          googleId,
          isVerified: true,
          password: null,
        }
      })

      await tx.restList.create({ data: { userId: newUser.id } })

      return newUser
    })

     await resend.emails.send({
        from: "onboarding@maroonapron.com",
        to: user.email,
        subject: "Welcome to Maroon Apron",
        html: `
  <h2>Welcome ${user.name}! 🎉</h2>

  <p>
    Your email has been successfully verified and your
    Maroon Apron account is now ready.
  </p>

  <p>
    We're glad to have you here. To get started with Maroon Apron,
    check out our Knowledge Base for helpful guides and information
    on getting the most out of your account.
  </p>

  <a
    href="${process.env.CRIMSON_ADMIN_URL}/login"
    style="
      display:inline-block;
      padding:12px 20px;
      background:#000;
      color:#fff;
      text-decoration:none;
      border-radius:6px;
      margin-right:8px;
    "
  >
    Login to Maroon Apron
  </a>

  <a
    href="${process.env.CRIMSON_ADMIN_URL}/knowledge-base"
    style="
      display:inline-block;
      padding:12px 20px;
      background:#f3f4f6;
      color:#000;
      text-decoration:none;
      border-radius:6px;
    "
  >
    Knowledge Base
  </a>

  <p style="margin-top:24px;">
    If you didn't create this account, you can safely ignore this email.
  </p>
`


      });

    const token = generateToken(user.id, res)
    return res.status(201).json({
      status: "success",
      data: { user: { id: user.id, email: user.email }, token }
    })

  } catch (err) {
    err.status = 400
    next(err)
  }
}



const googleRegisterCustomer = async (req, res, next) => {
  try {
    const { idToken, subdomain } = req.body

    if (!idToken || !subdomain) {
      return res.status(400).json({ error: "idToken and subdomain are required" })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload.email_verified) {
      return res.status(400).json({ error: "Google account email is not verified" })
    }

    const { sub: googleId, email, name } = payload

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, authProvider: true }
    })

    if (existing) {
      const message = existing.authProvider === "local"
        ? "This email already has a password account. Please log in with your email and password instead."
        : "An account with this email already exists. Please log in with Google instead."
      return res.status(409).json({ error: message })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "customer",
        subdomain,
        authProvider: "google",
        googleId,
        isVerified: true,
        password: null,
      }
    })

    const token = generateToken(user.id, res)
    return res.status(201).json({
      status: "success",
      data: { user: { id: user.id, email: user.email }, token }
    })

  } catch (err) {
    err.status = 400
    next(err)
  }
}

// Login

const googleLoginMerchant = async (req, res, next) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const { email } = ticket.getPayload()

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, authProvider: true }
    })

    if (!user) {
      return res.status(400).json({ error: "No account found with this email. Please sign up first." })
    }

    if (user.authProvider !== "google") {
      return res.status(400).json({
        error: "This email is registered with a password. Please log in with your email and password instead."
      })
    }

    if (user.role !== "merchant") {
      return res.status(401).json({ error: "access denied, merchant account required" })
    }

    const token = generateToken(user.id, res)
    return res.status(200).json({
      status: "success",
      data: { user: { id: user.id, email: user.email }, token }
    })

  } catch (err) {
    err.status = 400
    next(err)
  }
}

const googleLoginCustomer = async (req, res, next) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const { email } = ticket.getPayload()

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, authProvider: true }
    })

    if (!user) {
      return res.status(400).json({ error: "No account found with this email. Please sign up first." })
    }

    if (user.authProvider !== "google") {
      return res.status(400).json({
        error: "This email is registered with a password. Please log in with your email and password instead."
      })
    }

    if (user.role !== "customer") {
      return res.status(401).json({ error: "access denied, customer account required" })
    }

    const token = generateToken(user.id, res)
    return res.status(200).json({
      status: "success",
      data: { user: { id: user.id, email: user.email }, token }
    })

  } catch (err) {
    err.status = 400
    next(err)
  }
}



// logout user

const logout = async (req, res, next) => {
  try {
    res.cookie("jwt","",{
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0)
    })
    return res.status(200).json({
      status: "success",
      message: "logged out successfully"
    })
  } catch(err){
    err.status = 500
    next(err)
  }
}




//check if user is signed in or not

const me = async (req, res, next) => {
  try {
    res.json({
      user: req.user,
    });
  } catch(err){
    err.status = 500
    next(err)
  }
};




export {registerMerchant,registerCustomer,loginMerchant,loginCustomer,logout,me,verifyEmail,googleRegisterMerchant, googleRegisterCustomer,googleLoginMerchant, googleLoginCustomer}