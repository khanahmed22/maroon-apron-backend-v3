import jwt from "jsonwebtoken";

export const verificationToken =(userId)=>{
  return jwt.sign(
  {
    userId: userId,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1h",
  },
)}
;
