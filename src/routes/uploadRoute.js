import { Router } from "express";
import uploadImage from "../multerMiddleware/imageUpload.js";
import { uploadImageController } from "../controllers/uploadImgController.js";

const imageUploadRouter = Router();

imageUploadRouter.post(
  "/upload",
  uploadImage.single("image"),
  uploadImageController,
);

export default imageUploadRouter;
