import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware per verificare il token
export const authenticateUser = async (req, res, next) => {
  try {
    // Ottieni il token dall'header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token di accesso mancante' });
    }

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trova l'utente
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Utente non trovato' });
    }

    // Aggiungi l'utente alla richiesta
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token scaduto' });
    }
    return res.status(401).json({ message: 'Token non valido' });
  }
};

// Middleware per verificare i permessi di admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Utente non autenticato' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accesso negato: richiesti privilegi di amministratore' });
  }

  next();
};

// Per retrocompatibilità
export const authenticateToken = authenticateUser;
