import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Proteggi tutte le rotte admin con middleware globali
router.use(authenticateUser, requireAdmin);

// Rotte per gli appuntamenti
router.get('/appointments', adminController.getAllAppointments);
router.get('/appointments/date', adminController.getAppointmentsByDate);
router.put('/appointments/:id/status', adminController.updateAppointmentStatus);
router.get('/appointments/stats', adminController.getAppointmentStats);

// Rotta per le statistiche generali
router.get('/stats', adminController.getDashboardStats);

// Rotte per la gestione utenti
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
// Nuova rotta per il ripristino della password
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Rotte per i servizi
router.get('/services', adminController.getAllServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

export default router;
