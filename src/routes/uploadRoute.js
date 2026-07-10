import express from "express";
import { uploadImage } from "../multerMiddleware/imageUpload.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";

const imageUploadRouter = express.Router();

imageUploadRouter.post(
  "/upload",
  uploadImage.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image selected",
        });
      }

      const folder = req.body.folder || 'inventory'
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      console.log(result)

      res.json({
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        message: "Upload failed",
      });
    }
  },
);

export default imageUploadRouter;
