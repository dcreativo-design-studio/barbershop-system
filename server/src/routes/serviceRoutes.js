import express from 'express';
import { serviceController } from '../controllers/serviceController.js';
import { authenticateUser, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rotte pubbliche
router.get('/active', serviceController.getServices);
router.post('/validate', serviceController.validateService); // Aggiunta nuova rotta di validazione

// Rotte protette (solo admin)
router.get('/', authenticateUser, isAdmin, serviceController.getAllServices);
router.post('/', authenticateUser, isAdmin, serviceController.createService);
router.put('/:id', authenticateUser, isAdmin, serviceController.updateService);
router.delete('/:id', authenticateUser, isAdmin, serviceController.deleteService);

export default router;
