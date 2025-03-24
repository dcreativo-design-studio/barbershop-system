import bcryptjs from 'bcryptjs';
import { deleteImage, uploadImage } from '../config/cloudinary.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

export const userController = {
  // Funzioni esistenti
  async promoteToAdmin(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      user.role = 'admin';
      await user.save();

      res.json({
        message: 'Utente promosso ad admin con successo',
        user: {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await User.find({}, '-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Funzioni per il profilo utente
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const { firstName, lastName, phone, currentPassword, newPassword } = req.body;

      console.log('Starting profile update for user:', userId);

      // Trova l'utente
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato'
        });
      }

      // Aggiorna i campi base
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;

      // Se l'utente sta cercando di cambiare la password
      if (currentPassword && newPassword) {
        try {
          console.log('Starting password update process');
          console.log('Current hash in DB:', user.password);

          // Genera il salt e hash della nuova password
          const salt = await bcryptjs.genSalt(10);
          console.log('Generated salt:', salt);

          const hashedPassword = await bcryptjs.hash(newPassword, salt);
          console.log('Generated hash:', hashedPassword);

          // Verifica che l'hash sia stato generato correttamente
          const verifyHash = await bcryptjs.compare(newPassword, hashedPassword);
          console.log('Hash verification:', verifyHash);

          // Salva la password hashata
          user.password = hashedPassword;
          console.log('Hash assigned to user object:', user.password);

          // Verifica subito se la password è stata assegnata correttamente
          const user2 = await User.findById(userId);
          console.log('Immediate DB check - Current hash:', user2.password);

          // Invia email di notifica
          await emailService.sendPasswordChangeEmail(user);
          console.log('Password change email sent');

        } catch (error) {
          console.error('Password update error:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento della password',
            error: error.message
          });
        }
      }

      // Salva le modifiche
      console.log('About to save user. Password hash:', user.password);
      await user.save();
      console.log('User saved successfully');

      // Verifica finale
      const finalCheck = await User.findById(userId);
      console.log('Final DB check - Stored hash:', finalCheck.password);

      // Prepara la risposta
      const userResponse = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage
      };

      res.json({
        success: true,
        message: currentPassword && newPassword ?
          'Profilo aggiornato con successo. Controlla la tua email per la conferma del cambio password.' :
          'Profilo aggiornato con successo.',
        user: userResponse
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'aggiornamento del profilo',
        error: error.message
      });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .select('-password');
        // Commenta temporaneamente il populate finché non sistemiamo il modello
        // .populate('appointments');

      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ message: 'Errore nel recupero del profilo' });
    }
  },

  // Funzione aggiornata per gestire l'immagine profilo localmente invece che su Cloudinary
  async updateProfileImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nessun file caricato' });
      }

      console.log('Processing file:', req.file);
      console.log('Cloudinary config check before upload:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'present' : 'missing',
        api_key: process.env.CLOUDINARY_API_KEY ? 'present' : 'missing',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing'
      });

      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Se esiste già un'immagine, eliminarla da Cloudinary
      if (user.profileImage?.publicId) {
        try {
          await deleteImage(user.profileImage.publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // MODIFICA: Passa direttamente il buffer invece di convertirlo in base64
      const result = await uploadImage(req.file.buffer);

      user.profileImage = {
        url: result.secure_url,
        publicId: result.public_id
      };

      await user.save();

      res.json({
        message: 'Immagine profilo aggiornata con successo',
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error('Update profile image error:', error);
      res.status(500).json({
        message: 'Errore durante l\'aggiornamento dell\'immagine profilo',
        error: error.message
      });
    }
  },


  // Funzione per rimuovere l'immagine profilo
  async removeProfileImage(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Se c'è un'immagine profilo, eliminala da Cloudinary
      if (user.profileImage?.publicId) {
        await deleteImage(user.profileImage.publicId);
      }

      // Rimuovi i riferimenti all'immagine dal profilo utente
      user.profileImage = undefined;
      await user.save();

      res.json({
        message: 'Immagine profilo rimossa con successo'
      });
    } catch (error) {
      console.error('Error removing profile image:', error);
      res.status(500).json({
        message: 'Errore durante la rimozione dell\'immagine profilo',
        error: error.message
      });
    }
  }
};
