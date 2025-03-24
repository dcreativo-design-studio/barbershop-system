import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Rotte pubbliche
router.post('/register', authController.register);  // POST, non GET
router.post('/login', authController.login);        // POST, non GET
router.get('/verify', authController.verifyToken);
router.post('/reset-password', authController.resetPassword);  // Nuova rotta per il reset password

// Rotte protette (richiedono autenticazione)
router.get('/profile', authenticateUser, authController.getProfile);

// Nuove rotte per refresh token e me endpoint
router.post('/refresh-token', authenticateUser, authController.refreshToken);
router.get('/me', authenticateUser, authController.me);

// Nuova rotta per il cambio password
router.post('/change-password', authenticateUser, authController.changePassword);

export default router;
