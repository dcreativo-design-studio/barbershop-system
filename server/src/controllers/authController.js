import bcryptjs from 'bcryptjs'; // Modificato qui
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authService } from '../services/authService.js';
import { sendEmail, sendPasswordChangeEmail, sendRegistrationEmail } from '../services/emailService.js';

export const authController = {
  async register(req, res) {
    try {
      const { user, token } = await authService.register(req.body);

      // Invia email di conferma registrazione
      await sendRegistrationEmail({
        to: user.email,
        user: {
          firstName: user.firstName,
          email: user.email,
          password: req.body.password  // Password in chiaro per l'email
        }
      });

      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      res.json({ user, token });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const user = await authService.verifyToken(token);
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  async getProfile(req, res) {
    try {
      res.json(req.user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const { email } = req.body;

      // Trova l'utente
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Genera una password casuale sicura di 8 caratteri
      const generateSecurePassword = () => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        const all = lowercase + uppercase + numbers + symbols;

        let password = '';
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        for (let i = 0; i < 4; i++) {
          password += all[Math.floor(Math.random() * all.length)];
        }

        return password.split('').sort(() => Math.random() - 0.5).join('');
      };

      const newPassword = generateSecurePassword();
      console.log('New password generated:', newPassword); // Per debug

      // Hash della nuova password usando bcryptjs
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);
      console.log('Password hashed successfully'); // Per debug

      // Aggiorna l'utente nel database con la nuova password hashata
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Errore nell\'aggiornamento della password');
      }

      console.log('User password updated in database'); // Per debug

      // Invia email con la nuova password
      await sendEmail({
        to: email,
        subject: 'Reset Password - Your Style Barber',
        html: `
          <h2>Reset Password</h2>
          <p>Gentile ${user.firstName},</p>
          <p>Come richiesto, abbiamo generato una nuova password per il tuo account.</p>
          <p>La tua nuova password è: <strong>${newPassword}</strong></p>
          <p>Puoi accedere al tuo profilo con questa password, poi potrai modificarla nel profilo cliccando su modifica password.</p>
          <p>Per motivi di sicurezza, ti consigliamo di cambiare questa password appena effettui l'accesso.</p>
          <p>Cordiali saluti,<br>Il team di Your Style Barber Shop</p>
        `
      });

      console.log('Reset password email sent successfully'); // Per debug

      res.json({
        success: true,
        message: 'Password resettata con successo. Controlla la tua email per le istruzioni.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il reset della password',
        error: error.message
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ token, user });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      res.status(500).json({ message: 'Errore nel refresh del token' });
    }
  },

  async me(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .select('-password')
        .populate('appointments');

      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error in me endpoint:', error);
      res.status(500).json({ message: 'Errore nel recupero dati utente' });
    }
  },

  // Funzione changePassword con notifica email aggiornata
  async changePassword(req, res) {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      // Validazione
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({
          message: 'UserId, password attuale e nuova password sono richiesti'
        });
      }

      // Trova l'utente
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Verifica la password attuale
      const isMatch = await bcryptjs.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password attuale non corretta' });
      }

      // Genera hash della nuova password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);

      // Aggiorna la password dell'utente
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();

      // Invia email di conferma del cambio password
      try {
        console.log('Sending password change confirmation email to:', user.email);
        await sendPasswordChangeEmail(user);
        console.log('Password change confirmation email sent successfully');
      } catch (emailError) {
        console.error('Error sending password change confirmation email:', emailError);
        // Non blocchiamo il flusso se l'email fallisce
      }

      res.json({
        success: true,
        message: 'Password cambiata con successo'
      });
    } catch (error) {
      console.error('Error in changePassword:', error);
      res.status(500).json({
        message: 'Errore nel cambio password',
        error: error.message
      });
    }
  }
};
