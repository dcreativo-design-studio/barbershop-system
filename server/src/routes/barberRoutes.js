import { Router } from 'express';
import { barberController } from '../controllers/barberController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';
import Barber from '../models/Barber.js';

const router = Router();

// Middleware personalizzato per verificare che un utente sia admin o il barbiere stesso
const isAdminOrSameBarber = async (req, res, next) => {
  try {
    console.log('isAdminOrSameBarber middleware triggered');
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user._id.toString());
    console.log('Requested barberId:', req.params.id);

    // Se l'utente è un admin, permetti sempre l'accesso
    if (req.user.role === 'admin') {
      console.log('User is admin, access granted');
      return next();
    }

    // Se l'utente è un barbiere, verifica che stia modificando solo i propri dati
    if (req.user.role === 'barber') {
      const requestedBarberId = req.params.id;

      // Tenta di trovare il barbiere associato all'utente corrente
      let barberUser;
      try {
        barberUser = await Barber.findOne({
          $or: [
            { _id: req.user._id },
            { _id: requestedBarberId, email: req.user.email }
          ]
        });
        console.log('Found barber:', barberUser ? barberUser._id.toString() : 'not found');
      } catch (err) {
        console.error('Error finding barber:', err);
      }

      // Verifica se l'ID del barbiere trovato corrisponde all'ID richiesto
      const isOwnProfile = barberUser && barberUser._id.toString() === requestedBarberId;

      console.log('Is own profile?', isOwnProfile);

      if (isOwnProfile) {
        console.log('Barbiere modifica i propri dati, accesso consentito');
        return next();
      }
    }

    // Se non è né admin né il barbiere stesso, nega l'accesso
    console.log('Access denied');
    return res.status(403).json({
      message: 'Accesso negato. È richiesto il ruolo di amministratore.'
    });
  } catch (error) {
    console.error('Error in isAdminOrSameBarber middleware:', error);
    return res.status(500).json({ message: 'Errore interno del server' });
  }
};

// Rotte pubbliche (senza autenticazione)
router.get('/public', barberController.getActiveBarbers);
router.get('/public/:id', barberController.getPublicBarberDetails);
router.get('/:id/check-vacation', barberController.checkVacation);

// Rotta pubblica per trovare un barbiere tramite email
router.get('/find-by-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email richiesta' });
    }

    const barber = await Barber.findOne({
      email: email.toLowerCase(),
      isActive: true
    }).select('_id firstName lastName email services workingHours');

    if (!barber) {
      return res.status(404).json({ message: 'Barbiere non trovato' });
    }

    res.json(barber);
  } catch (error) {
    console.error('Error finding barber by email:', error);
    res.status(500).json({ message: 'Errore server' });
  }
});

// Rotte che richiedono autenticazione
router.use(authenticateUser);

// Rotte per utenti autenticati
router.get('/', barberController.getAllBarbers);
router.get('/:id', barberController.getBarber);
router.get('/:id/schedule', barberController.getBarberSchedule);
router.get('/:id/availability', barberController.getBarberAvailability);

// Rotte protette (solo admin)
router.post('/', requireAdmin, barberController.createBarber);
router.put('/:id', requireAdmin, barberController.updateBarber);
router.delete('/:id', requireAdmin, barberController.deactivateBarber);

// MODIFICA: Route per vacanze (admin o barbiere stesso)
router.put('/:id/vacations', isAdminOrSameBarber, barberController.updateVacations);

// MODIFICA: Rotte per gli orari di lavoro (admin o barbiere stesso)
router.put('/:id/working-hours/:day', isAdminOrSameBarber, barberController.updateWorkingHours);

// MODIFICA: Le nuove rotte per servizi e orari completi (admin o barbiere stesso per working-hours)
if (barberController.updateAllWorkingHours) {
  router.put('/:id/working-hours', isAdminOrSameBarber, barberController.updateAllWorkingHours);
}

// I servizi possono essere gestiti sia dagli admin che dai barbieri (per i propri servizi)
if (barberController.updateBarberServices) {
  router.put('/:id/services', isAdminOrSameBarber, barberController.updateBarberServices);
}

// Statistiche (visibili solo agli admin)
// Nel file barberRoutes.js, la rotta deve apparire esattamente così:
router.get('/:id/stats', isAdminOrSameBarber, barberController.getBarberStats);

export default router;
