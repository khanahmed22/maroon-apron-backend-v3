import { Router } from "express";
import uploadImage from "../multerMiddleware/imageUpload.js";
import { uploadImageController } from "../controllers/uploadImgController.js";
import { protect } from '../authMiddleware/protect.js'

const imageUploadRouter = Router();

imageUploadRouter.post(
  "/upload",protect,
  uploadImage.single("image"),
  uploadImageController,
);

export default imageUploadRouter;
