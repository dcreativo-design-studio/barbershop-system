import { Router } from 'express';
import twilio from 'twilio';
import { appointmentController } from '../controllers/appointmentController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';
import Appointment from '../models/Appointment.js'; // Aggiungiamo questa importazione
import Barber from '../models/Barber.js';
import { initializeScheduler } from '../services/appointmentScheduler.js';
import { forceReminderForAppointment, runDiagnosticCheck } from '../services/diagnosticTools.js';
import { notificationService } from '../services/notificationService.js';
const router = Router();

// Log di debug
console.log('Registering Twilio webhook route...');

// ========= ROTTE PUBBLICHE (senza autenticazione) =========
// Disponibilità e slot
router.get('/public/available-slots', appointmentController.getAvailableSlots);
router.get('/public/barber/:barberId/availability', appointmentController.getBarberAvailability);

// Lista barbieri e dettagli (pubblici)
router.get('/public/barbers', appointmentController.getPublicBarbers);          // Lista barbieri
router.get('/public/barbers/:barberId', async (req, res) => {                  // Dettagli barbiere
  try {
    const barber = await Barber.findById(req.params.barberId)
      .select('firstName lastName services workingHours')
      .lean();

    if (!barber) {
      return res.status(404).json({ message: 'Barbiere non trovato' });
    }

    // Normalizza i dati delle pause
    barber.workingHours = barber.workingHours.map(wh => ({
      ...wh,
      day: wh.day.toLowerCase(),
      hasBreak: Boolean(wh.hasBreak),
      breakStart: wh.hasBreak ? wh.breakStart : null,
      breakEnd: wh.hasBreak ? wh.breakEnd : null
    }));

    res.json(barber);
  } catch (error) {
    console.error('Error fetching barber:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Prenotazioni guest
router.post('/public/appointments/guest', appointmentController.createGuestAppointment);

// Endpoint per il cron job esterno
router.all('/public/cron-reminder', async (req, res) => {
  try {
    // Verifica l'API key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey = process.env.REMINDER_API_KEY;

    if (apiKey !== validApiKey) {
      console.log('Tentativo di accesso non autorizzato al job dei promemoria');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    console.log('Esecuzione scheduler dei promemoria via servizio esterno...');

    // Importa le funzioni dal servizio
    const { processReminders, processConfirmations } = await import('../services/appointmentScheduler.js');

    // Elabora i promemoria
    const reminderResults = await processReminders();

    // Elabora le conferme automatiche
    const confirmationResults = await processConfirmations();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'external-cron',
      reminders: reminderResults,
      confirmations: confirmationResults
    });
  } catch (error) {
    console.error('Errore nell\'esecuzione dello scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook Twilio
router.post('/webhook/twilio-status', (req, res) => {
  console.log('Webhook endpoint hit!');
  console.log('Request body:', req.body);

  try {
    const { MessageSid, MessageStatus, To, From } = req.body;
    console.log('Processing webhook data:', {
      MessageSid,
      MessageStatus,
      To,
      From
    });

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========= MIDDLEWARE DI AUTENTICAZIONE =========
router.use(authenticateUser);

// ========= ROTTE AUTENTICATE =========
// Prenotazioni base
router.post('/', appointmentController.create);
router.get('/my-appointments', appointmentController.getUserAppointments);
router.put('/:id/cancel', appointmentController.cancel);
router.put('/:id/reschedule', appointmentController.reschedule);
router.put('/:id', appointmentController.updateAppointment);

// Disponibilità (versioni autenticate)
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/barber/:barberId/availability', appointmentController.getBarberAvailability);

// NUOVO ENDPOINT: Ottiene gli appuntamenti di un barbiere specifico (accessibile a admin e al barbiere stesso)
router.get('/barber/:barberId/appointments', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('User requesting appointments:', {
      userId: req.user._id,
      userRole: req.user.role,
      userBarberId: req.user.barberId || 'undefined',
      requestedBarberId: barberId
    });

    // Verifica che l'utente sia un admin o il barbiere stesso
    // Confronta sia come stringa che come ObjectId per sicurezza
    const isAdmin = req.user.role === 'admin';
    const isBarberOwner = req.user.role === 'barber' &&
      (req.user._id.toString() === barberId ||
       (req.user.barberId && req.user.barberId.toString() === barberId));

    if (!isAdmin && !isBarberOwner) {
      console.log('Access denied. User:', {
        id: req.user._id,
        role: req.user.role,
        barberId: req.user.barberId
      }, 'Requested barberId:', barberId);

      return res.status(403).json({
        message: 'Accesso negato. Puoi visualizzare solo i tuoi appuntamenti.'
      });
    }

    // Validazione dei parametri
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Parametri startDate e endDate richiesti' });
    }

    // Converti le date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Assicurati che end sia alla fine della giornata
    end.setHours(23, 59, 59, 999);

    console.log(`Cercando appuntamenti per barbiere: ${barberId} dal ${start.toISOString()} al ${end.toISOString()}`);

    // Trova gli appuntamenti
    const appointments = await Appointment.find({
      barber: barberId,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).sort({ date: 1, time: 1 })
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName');

    console.log(`Trovati ${appointments.length} appuntamenti`);

    // Organizza gli appuntamenti per data
    const appointmentsByDate = {};
    appointments.forEach(appointment => {
      const dateStr = appointment.date.toISOString().split('T')[0];
      if (!appointmentsByDate[dateStr]) {
        appointmentsByDate[dateStr] = {
          date: dateStr,
          appointments: []
        };
      }
      appointmentsByDate[dateStr].appointments.push(appointment);
    });

    res.json({ appointments: appointmentsByDate });
  } catch (error) {
    console.error('Error fetching barber appointments:', error);
    res.status(500).json({ message: 'Errore nel recupero degli appuntamenti' });
  }
});

// Modifica l'endpoint filtrato per gestire correttamente tutte le viste admin
router.get('/filtered', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, viewType, barberId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate sono richiesti' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Crea la query di base
    const query = {
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    };

    // Aggiungi il filtro per barberId se specificato
    if (barberId) {
      query.barber = barberId;
    }
    // Se l'utente è un barbiere e non admin, può vedere solo i suoi appuntamenti
    else if (req.user.role === 'barber') {
      // Assicurati che un barbiere possa vedere solo i propri appuntamenti
      if (!req.user.barberId && !req.user._id) {
        return res.status(403).json({ message: 'Accesso negato. ID barbiere non trovato.' });
      }
      query.barber = req.user.barberId || req.user._id;
    }
    // Se non è né admin né un barbiere che guarda i propri appuntamenti, nega l'accesso
    else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato.' });
    }

    console.log('MongoDB query:', query);

    // Esegui la query e popola i dati necessari
    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    // Per le chiamate dal pannello admin, basandoci sul viewType
    if (req.user.role === 'admin') {
      if (viewType === 'week' || viewType === 'month') {
        console.log(`Admin endpoint, special response format for ${viewType} view`);

        // Per le viste settimanali e mensili, dobbiamo emulare il formato che il frontend si aspetta
        // Raggruppiamo gli appuntamenti per data
        const groupedAppointments = [];

        // Crea un oggetto per raggruppare gli appuntamenti per data
        const appointmentsByDate = {};

        appointments.forEach(appointment => {
          // Assicuriamoci che tutti i dati necessari siano presenti
          if (!appointment.client) {
            appointment.client = {
              firstName: 'Cliente',
              lastName: 'Sconosciuto',
              email: 'N/A',
              phone: 'N/A'
            };
          }

          if (!appointment.barber) {
            appointment.barber = {
              firstName: 'Barbiere',
              lastName: 'Sconosciuto'
            };
          }

          const dateStr = appointment.date.toISOString().split('T')[0];
          if (!appointmentsByDate[dateStr]) {
            appointmentsByDate[dateStr] = {
              date: dateStr,
              appointments: []
            };
          }
          appointmentsByDate[dateStr].appointments.push(appointment);
        });

        // Converti l'oggetto in un array di gruppi di appuntamenti
        for (const date in appointmentsByDate) {
          groupedAppointments.push(appointmentsByDate[date]);
        }

        // Ordina i gruppi per data
        groupedAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.json(groupedAppointments);
      } else {
        // Per le viste giornaliere e range, restituisci un array diretto
        console.log('Admin endpoint, returning direct array for day/range view');
        return res.json(appointments);
      }
    }

    // Per le chiamate dal pannello barbiere, formatta la risposta come oggetto nidificato
    // Raggruppa gli appuntamenti per data
    const appointmentsByDate = {};

    appointments.forEach(appointment => {
      const dateStr = appointment.date.toISOString().split('T')[0];
      if (!appointmentsByDate[dateStr]) {
        appointmentsByDate[dateStr] = {
          date: dateStr,
          appointments: []
        };
      }
      appointmentsByDate[dateStr].appointments.push(appointment);
    });

    res.json({ appointments: appointmentsByDate });
  } catch (error) {
    console.error('Error in filtered appointments:', error);
    res.status(500).json({ message: 'Errore nel recupero degli appuntamenti' });
  }
});

// ========= ROTTE ADMIN =========
// Gestione appuntamenti
router.get('/', requireAdmin, appointmentController.getAll);
// La rotta filtered è stata sostituita con quella sopra
// router.get('/filtered', requireAdmin, appointmentController.getAllWithDateRange);
router.put('/:id/status', requireAdmin, appointmentController.updateStatus);
router.put('/:id/notes', requireAdmin, appointmentController.updateNotes);
router.get('/stats', requireAdmin, appointmentController.getStats);

// Calendario admin
router.get('/calendar/day', requireAdmin, appointmentController.getDayAppointments);
router.get('/calendar/week', requireAdmin, appointmentController.getWeekAppointments);
router.get('/calendar/month', requireAdmin, appointmentController.getMonthAppointments);
router.get('/calendar/barber/:barberId', requireAdmin, appointmentController.getBarberAppointments);
router.get('/barber/:barberId/schedule', requireAdmin, appointmentController.getBarberSchedule);

// Test e debug (solo admin)
router.post('/test-notification', requireAdmin, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    await notificationService.testWhatsAppNotification(phoneNumber);
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-scheduler', requireAdmin, async (req, res) => {
  try {
    await initializeScheduler();
    res.json({ message: 'Scheduler test triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint di test per le notifiche
router.post('/test-notifications', requireAdmin, async (req, res) => {
  try {
    const { phoneNumber, email, notificationType } = req.body;

    if (!phoneNumber && !email) {
      return res.status(400).json({
        error: 'Almeno un metodo di contatto (email o telefono) è richiesto'
      });
    }

    // Crea un appuntamento fittizio per il test
    const testAppointment = {
      _id: 'test-appointment-id',
      service: 'Test Servizio',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Domani
      time: '14:30',
      barber: {
        firstName: 'Test',
        lastName: 'Barbiere'
      },
      price: 50
    };

    // Crea un utente fittizio per il test
    const testUser = {
      firstName: 'Test',
      lastName: 'Utente',
      email: email || 'test@example.com',
      phone: phoneNumber || '+41791234567'
    };

    let results = {};

    // Invia notifiche in base al tipo richiesto
    switch (notificationType) {
      case 'email':
        results.email = await notificationService.sendReminderEmail(testAppointment, testUser);
        break;
      case 'sms':
        results.sms = await notificationService.sendReminderSMS(testAppointment, testUser);
        break;
      case 'whatsapp':
        results.whatsapp = await notificationService.sendWhatsAppMessage(testAppointment, testUser);
        break;
      case 'all':
      default:
        // Invia tutti i tipi di notifiche
        results.email = email ? await notificationService.sendReminderEmail(testAppointment, testUser) : null;
        results.sms = phoneNumber ? await notificationService.sendReminderSMS(testAppointment, testUser) : null;
        results.whatsapp = phoneNumber ? await notificationService.sendWhatsAppMessage(testAppointment, testUser) : null;
    }

    // Se disponibile, usa la funzione di test completa
    if (notificationService.testNotificationSystem && phoneNumber) {
      results.systemTest = await notificationService.testNotificationSystem(phoneNumber);
    }

    res.json({
      success: true,
      message: 'Test notifiche eseguito',
      results
    });
  } catch (error) {
    console.error('Errore nel test delle notifiche:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Aggiungi anche un endpoint per verificare quali appuntamenti riceveranno promemoria presto
router.get('/upcoming-reminders', requireAdmin, async (req, res) => {
  try {
    // Trova gli appuntamenti che dovrebbero ricevere promemoria nelle prossime 36 ore
    const now = new Date();
    const in36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      status: { $in: ['confirmed', 'pending'] },
      date: { $gte: now, $lte: in36Hours },
      reminderSent: false
    })
    .populate('client', 'firstName lastName email phone')
    .populate('barber', 'firstName lastName')
    .sort({ date: 1, time: 1 })
    .lean();

    // Calcola le ore rimanenti per ogni appuntamento
    const appointmentsWithHours = appointments.map(appointment => {
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);

      return {
        ...appointment,
        hoursRemaining: parseFloat(hoursDifference.toFixed(2)),
        shouldSendReminder: hoursDifference <= 26 && hoursDifference > 23
      };
    });

    res.json({
      success: true,
      currentTime: now,
      count: appointmentsWithHours.length,
      appointments: appointmentsWithHours
    });
  } catch (error) {
    console.error('Errore nel recupero dei promemoria imminenti:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint per la diagnostica del sistema di notifiche
router.get('/system-diagnostic', requireAdmin, async (req, res) => {
  try {
    const diagnosticResults = await runDiagnosticCheck();
    res.json({
      success: true,
      diagnosticResults
    });
  } catch (error) {
    console.error('Errore durante la diagnostica:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint per forzare un promemoria per un appuntamento specifico
router.post('/force-reminder/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await forceReminderForAppointment(id);
    res.json({
      success: true,
      message: 'Promemoria forzato elaborato',
      result
    });
  } catch (error) {
    console.error('Errore nel forzare il promemoria:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint per eseguire manualmente lo scheduler dei promemoria
// Endpoint per eseguire manualmente lo scheduler dei promemoria
router.post('/run-reminder-scheduler', async (req, res) => {
  try {
    console.log('Esecuzione scheduler dei promemoria...');

    // Verifica l'autenticazione
    // Permetti l'accesso se la richiesta proviene da Vercel Cron
    const isVercelCron = req.headers['x-vercel-cron'] === 'true';
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey = process.env.REMINDER_API_KEY;
    const isAdmin = req.user?.role === 'admin';

    if (!isVercelCron && !isAdmin && apiKey !== validApiKey) {
      console.log('Tentativo di accesso non autorizzato al job dei promemoria');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Elabora i promemoria con la nuova funzione
    const reminderResults = await processReminders();

    // Elabora le conferme automatiche con la nuova funzione
    const confirmationResults = await processConfirmations();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: isVercelCron ? 'vercel-cron' : (isAdmin ? 'manual-admin' : 'external-service'),
      reminders: reminderResults,
      confirmations: confirmationResults
    });
  } catch (error) {
    console.error('Errore nell\'esecuzione dello scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook Twilio (solo admin)
router.post('/webhook/twilio-status',
  twilio.webhook({ validate: true }), // In produzione, impostare validate: true
  async (req, res) => {
    try {
      const {
        MessageSid,
        MessageStatus,
        To,
        From,
        ErrorCode,
        ErrorMessage
      } = req.body;

      console.log('Twilio Status Update:', {
        messageSid: MessageSid,
        status: MessageStatus,
        to: To,
        from: From,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage
      });

      const appointment = await Appointment.findOne({
        'smsNotifications.messageSid': MessageSid
      });

      if (appointment) {
        appointment.smsNotifications = appointment.smsNotifications || [];
        appointment.smsNotifications.push({
          messageSid: MessageSid,
          status: MessageStatus,
          timestamp: new Date(),
          errorCode: ErrorCode,
          errorMessage: ErrorMessage
        });

        if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
          appointment.reminderSent = false;
          appointment.reminderRetries = (appointment.reminderRetries || 0) + 1;
        }

        await appointment.save();
        console.log(`Updated appointment ${appointment._id} with SMS status ${MessageStatus}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Error processing Twilio webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error processing webhook'
      });
    }
});

export default router;
