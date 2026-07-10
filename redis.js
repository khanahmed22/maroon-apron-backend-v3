import { createClient } from "redis"
export const redisClient = createClient({
  url: process.env.REDIS_PORT
})

redisClient.on('error',(err)=>{    
  console.error('Redis error',err)  
})

await redisClient.connect()