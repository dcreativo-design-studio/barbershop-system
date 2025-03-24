import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { authService } from '../services/authService.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accesso negato. È richiesto il ruolo di amministratore.'
      });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorizzato' });
  }
};

export const verifyCurrentPassword = async (req, res, next) => {
  try {
    if (!req.body.currentPassword || !req.body.newPassword) {
      return next();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    console.log('Verifying current password for user:', user.email);
    console.log('Stored hash:', user.password);
    console.log('Provided current password:', req.body.currentPassword);

    const isMatch = await bcryptjs.compare(req.body.currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'La password attuale non è corretta'
      });
    }

    console.log('Current password verified successfully');
    next();
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica della password',
      error: error.message
    });
  }
};
