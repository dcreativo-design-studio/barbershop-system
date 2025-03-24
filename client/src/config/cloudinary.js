import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (file) => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: 'profile-images',
        transformation: [
          // Ritaglio automatico a 400x400px mantenendo le proporzioni del viso
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          // Ottimizzazione automatica della qualità
          { quality: "auto:best", fetch_format: "auto" },
          // Rimozione metadati per privacy e dimensioni ridotte
          { flags: "strip_profile" }
        ]
      });
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

export const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export default cloudinary;
