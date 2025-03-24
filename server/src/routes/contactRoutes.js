import express from 'express';
import contactController from '../controllers/contactController.js';

const router = express.Router();

// Route per l'invio di email dal form di contatto
router.post('/', contactController.sendContactEmail);

export default router;
