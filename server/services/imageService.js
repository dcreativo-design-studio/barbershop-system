import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

export const imageService = {
  async deleteImage(filename) {
    try {
      if (!filename) return;

      const filepath = path.join('uploads', filename);
      // Verifica se il file esiste
      if (fs.existsSync(filepath)) {
        await unlinkAsync(filepath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Genera URL per l'immagine
  getImageUrl(filename) {
    if (!filename) return null;
    return `/uploads/${filename}`;
  },

  // Validazione dimensione immagine
  validateImageSize(fileSize) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return fileSize <= maxSize;
  }
};
