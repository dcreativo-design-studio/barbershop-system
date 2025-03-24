import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Non serve configurare manualmente - la stringa CLOUDINARY_URL contiene già tutto
// cloudinary.config viene chiamato automaticamente quando trova CLOUDINARY_URL

export const uploadImage = async (fileData) => {
  try {
    console.log('Cloudinary configuration check:', {
      url_exists: !!process.env.CLOUDINARY_URL,
      configured: !!cloudinary.config().cloud_name
    });

    // Se è un buffer, carica usando promise e stream
    if (Buffer.isBuffer(fileData)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'profile-images',
            transformation: [
              { width: 400, height: 400, crop: "fill" },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload stream error:', error);
              return reject(error);
            }
            console.log('Upload successful:', {
              public_id: result.public_id,
              url: result.secure_url
            });
            resolve(result);
          }
        );
        uploadStream.end(fileData);
      });
    }
    // Se è una stringa (URL o data URI), usa il metodo standard
    else {
      const result = await cloudinary.uploader.upload(fileData, {
        folder: 'profile-images',
        transformation: [
          { width: 400, height: 400, crop: "fill" },
          { quality: 'auto' }
        ]
      });

      console.log('Upload successful:', {
        public_id: result.public_id,
        url: result.secure_url
      });

      return result;
    }
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      console.log('Attempting to delete image:', publicId);
      await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted successfully:', publicId);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Funzione di test
export const testCloudinaryConnection = async () => {
  try {
    console.log('Testing Cloudinary connection with config:', {
      url_exists: !!process.env.CLOUDINARY_URL,
      cloud_name: cloudinary.config().cloud_name || 'not set'
    });

    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection error:', error);
    return false;
  }
};

export default cloudinary;
