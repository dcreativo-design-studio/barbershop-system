import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const unlinkAsync = promisify(fs.unlink);

export const imageService = {
  async deleteImage(filename) {
    try {
      if (!filename) return;

      // Usa il percorso assoluto alla cartella uploads
      const filepath = path.join(__dirname, '../uploads', filename);

      // Verifica se il file esiste
      if (fs.existsSync(filepath)) {
        await unlinkAsync(filepath);
        console.log(`Image deleted successfully: ${filepath}`);
      } else {
        console.log(`File not found: ${filepath}`);
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
  },

  // Nuovo metodo per verificare se un file è un'immagine valida
  isValidImageType(mimetype) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    return validTypes.includes(mimetype);
  }
};
