import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticateUser, requireAdmin, verifyCurrentPassword } from '../middleware/authMiddleware.js';
import upload from '../middleware/multerConfig.js';

const router = Router();

// Rotte protette da admin
router.post('/promote-admin', authenticateUser, requireAdmin, userController.promoteToAdmin);
router.get('/all', authenticateUser, requireAdmin, userController.getAllUsers);

// Rotte per il profilo utente (richiedono solo autenticazione)
router.get('/profile', authenticateUser, userController.getProfile);
router.put('/profile',
  authenticateUser,           // Prima verifica l'autenticazione
  verifyCurrentPassword,      // Poi verifica la password corrente
  userController.updateProfile  // Infine esegue l'aggiornamento
);

// Rotte per la gestione dell'immagine profilo
router.put('/profile/image',
  authenticateUser,
  upload.single('image'),
  async (req, res, next) => {
    console.log('Request received:', {
      file: req.file,
      auth: req.headers.authorization
    });
    next();
  },
  userController.updateProfileImage
);

router.delete(
  '/profile/image',
  authenticateUser,
  userController.removeProfileImage
);

export default router;
