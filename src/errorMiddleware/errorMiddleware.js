import Sentry from "../../src/utils/sentryConfig.js"
const errorMiddleware = (err,req,res,next)=>{
  console.error(err)

  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(err);
  }

  const status = err.status || 500
  const message = err.message || 'Backend Error'

  return res.status(status).json({message,source:'from error middleware'})
}

export default errorMiddleware