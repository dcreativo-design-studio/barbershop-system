import express from 'express';
import { waitingListController } from '../controllers/waitingListController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Proteggi tutte le rotte
router.use(authenticateToken);

router.post('/', waitingListController.addToWaitingList);
router.get('/my-entries', waitingListController.getUserWaitingList);
router.delete('/:id', waitingListController.removeFromWaitingList);

// Rotte admin
router.get('/all', waitingListController.getAllWaitingList);
router.get('/check-availability', waitingListController.checkAvailability);

export default router;
