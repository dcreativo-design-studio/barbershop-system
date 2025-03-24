import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import { notificationService } from '../services/notificationService.js';
import { generateAvailableSlots } from '../utils/slotGenerator.js';

export const appointmentController = {
  // Crea una nuova prenotazione
  async create(req, res) {
    try {
      const { service, date, time, barberId, duration, price } = req.body;

      console.log('Creating appointment with:', { service, date, time, barberId, userId: req.user._id, duration, price });

      // Verifica che il barbiere esista
      const barber = await Barber.findById(barberId);
      if (!barber) {
        console.log('Barber not found:', barberId);
        return res.status(404).json({
          message: 'Barbiere non trovato'
        });
      }

      // Verifica disponibilità slot
      console.log('Checking slot availability...');
      const isAvailable = await Appointment.isSlotAvailable(barberId, date, time);
      if (!isAvailable) {
        console.log('Slot not available');
        return res.status(400).json({
          message: 'Lo slot selezionato non è più disponibile'
        });
      }

      // Verifica che non ci siano sovrapposizioni
      console.log('Checking for overlaps...');
      const hasOverlap = await Appointment.checkOverlap(
        barberId,
        date,
        time,
        duration
      );
      if (hasOverlap) {
        console.log('Overlap detected');
        return res.status(400).json({
          message: 'Lo slot si sovrappone con un altro appuntamento'
        });
      }

      // Crea l'appuntamento
      const appointmentData = {
        client: req.user._id,
        barber: barberId,
        service,
        price,
        duration,
        date: new Date(date),
        time,
        status: 'pending'
      };

      console.log('Creating appointment with data:', appointmentData);
      const appointment = new Appointment(appointmentData);
      await appointment.save();
      console.log('Appointment saved:', appointment._id);

      // Invia email di conferma
      try {
        await sendBookingConfirmation({
          appointment: {
            ...appointment.toObject(),
            barber: barber.toObject()
          },
          user: req.user
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Non blocchiamo la risposta se l'email fallisce
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // Ottieni tutti gli appuntamenti (solo admin)
  async getAll(req, res) {
    try {
      const appointments = await Appointment.find()
        .populate('client', 'firstName lastName email phone')
        .populate('barber', 'firstName lastName')
        .sort({ date: 1, time: 1 });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Ottieni gli appuntamenti dell'utente corrente
  async getUserAppointments(req, res) {
    try {
      const appointments = await Appointment.find({ client: req.user._id })
        .populate('barber', 'firstName lastName')
        .sort({ date: -1 });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Ottieni slot disponibili per una data e un barbiere
  async getAvailableSlots(req, res) {
    try {
      const { date, barberId, duration } = req.query;

      // Debug log
      console.log('getAvailableSlots called with query:', req.query);

      // Validazione parametri
      if (!date || !barberId || !duration) {
        console.log('Missing parameters in request:', { date, barberId, duration });
        return res.status(400).json({
          message: 'Parametri richiesti mancanti',
          required: { date, barberId, duration },
          received: req.query
        });
      }

      // Verifica che il barbiere esista
      const barber = await Barber.findById(barberId);
      if (!barber) {
        console.log('Barber not found:', barberId);
        return res.status(404).json({ message: 'Barbiere non trovato' });
      }

      // Verifica che la data sia valida
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({ message: 'Data non valida' });
      }

      // Ottieni il giorno della settimana
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Ottieni gli orari di lavoro del barbiere
      const workingHours = barber.workingHours.find(h => h.day === dayOfWeek);

      if (!workingHours || !workingHours.isWorking) {
        return res.json([]);
      }

      // Usa la nuova funzione importata
      const slots = await generateAvailableSlots(
        barber,
        appointmentDate,
        workingHours,
        parseInt(duration)
      );

      console.log(`Generated ${slots.length} slots for date ${date}`);
      res.json(slots);

    } catch (error) {
      console.error('Error in getAvailableSlots:', error);
      res.status(500).json({
        message: 'Errore interno del server',
        error: error.message
      });
    }
  },

  // Aggiorna stato appuntamento
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const appointment = await Appointment.findById(req.params.id)
        .populate('client', 'firstName lastName email')
        .populate('barber', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Appuntamento non trovato' });
      }

      // Solo l'admin può modificare lo stato
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Non autorizzato' });
      }

      appointment.status = status;
      await appointment.save();

      console.log('Verifying saved appointment...');
      const savedAppointment = await Appointment.findById(appointment._id);
      console.log('Found in database:', savedAppointment);

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Cancella appuntamento
  async cancel(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('client', 'firstName lastName email phone')
        .populate('barber', 'firstName lastName email');

      if (!appointment) {
        return res.status(404).json({ message: 'Appuntamento non trovato' });
      }

      // Verifica autorizzazione
      if (req.user.role !== 'admin' && appointment.client._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Non autorizzato' });
      }

      // Verifica limite 24 ore per i clienti
      if (req.user.role !== 'admin' && !appointment.canBeCancelled()) {
        return res.status(400).json({
          message: 'Non è possibile cancellare l\'appuntamento meno di 24 ore prima'
        });
      }

      // Aggiorna i campi per la cancellazione
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = req.user._id;
      appointment.cancellationReason = req.body.cancellationReason || 'Cancellato dal cliente';

      // Salva le modifiche
      await appointment.save({ validateModifiedOnly: true });

      // Invia le notifiche in modo asincrono ma gestisci gli errori
      const notificationPromises = [
        // Email al cliente
        notificationService.sendCancellationEmail(appointment, appointment.client),
        // Email al barbiere se ha un'email
        appointment.barber?.email ?
          notificationService.sendCancellationEmail(appointment, appointment.barber) :
          Promise.resolve(),
        // Email all'admin
        User.findOne({ role: 'admin' }).then(admin => {
          if (admin && admin.email) {
            return notificationService.sendAdminCancellationConfirmation(
              appointment,
              admin,
              appointment.client
            );
          }
          return Promise.resolve();
        })
      ];

      // Gestisci l'invio delle notifiche
      Promise.all(notificationPromises)
        .catch(error => {
          console.error('Error sending cancellation notifications:', error);
          // Non blocchiamo la risposta ma logghiamo l'errore
        });

      res.json({
        message: 'Appuntamento cancellato con successo',
        appointment: {
          id: appointment._id,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          status: appointment.status,
          cancelledAt: appointment.cancelledAt
        }
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({
        message: 'Errore durante la cancellazione dell\'appuntamento',
        error: error.message
      });
    }
  },

// Ottieni il calendario di un barbiere specifico
async getBarberSchedule(req, res) {
  try {
    const { barberId } = req.params;
    const { startDate, endDate } = req.query;

    const appointments = await Appointment.find({
      barber: barberId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    })
    .populate('client', 'firstName lastName email phone')
    .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Ottieni statistiche delle prenotazioni
async getStats(req, res) {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Statistiche mensili
    const monthlyStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Statistiche per barbiere
    const barberStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$barber',
          totalAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    // Popola i dettagli dei barbieri
    const populatedBarberStats = await Barber.populate(barberStats, {
      path: '_id',
      select: 'firstName lastName'
    });

    res.json({
      monthly: monthlyStats,
      byBarber: populatedBarberStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Verifica disponibilità di uno slot specifico
async checkSlotAvailability(req, res) {
  try {
    const { barberId, date, time, duration } = req.query;

    const isAvailable = await Appointment.isSlotAvailable(barberId, date, time) &&
                       !await Appointment.checkOverlap(barberId, date, time, parseInt(duration));

    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Ottieni disponibilità completa di un barbiere
async getBarberAvailability(req, res) {
  try {
    const { barberId } = req.params;
    const { startDate, endDate } = req.query;

    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barbiere non trovato' });
    }

    // Ottieni tutti gli appuntamenti nel periodo
    const appointments = await Appointment.find({
      barber: barberId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    });

    // Genera la disponibilità per ogni giorno
    const availability = {};
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const workingHours = barber.workingHours.find(h => h.day === dayOfWeek);

      if (workingHours?.isWorking) {
        availability[currentDate.toISOString().split('T')[0]] = {
          workingHours: {
            start: workingHours.startTime,
            end: workingHours.endTime
          },
          appointments: appointments.filter(app =>
            app.date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
          )
        };
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Riprogramma un appuntamento
async reschedule(req, res) {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('client', 'firstName lastName email')
      .populate('barber', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica autorizzazione
    if (req.user.role !== 'admin' && appointment.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Verifica disponibilità nuovo slot
    const isAvailable = await Appointment.isSlotAvailable(appointment.barber, date, time) &&
                       !await Appointment.checkOverlap(appointment.barber, date, time, appointment.duration);

    if (!isAvailable) {
      return res.status(400).json({ message: 'Slot non disponibile' });
    }

    // Aggiorna appuntamento
    appointment.date = date;
    appointment.time = time;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

async updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { service, date, time, barberId, duration, price } = req.body;

    console.log('Update request received:', { service, date, time, barberId, duration, price });

    // Trova l'appuntamento
    const appointment = await Appointment.findById(id)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica che l'utente sia autorizzato (cliente stesso o admin)
    if (req.user.role !== 'admin' && appointment.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Verifica che non sia troppo tardi per modificare (24h prima)
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({
        message: 'Non è possibile modificare l\'appuntamento meno di 24 ore prima'
      });
    }

    // Verifica disponibilità nuovo slot
    const isSlotAvailable = await Appointment.isSlotAvailable(
      barberId || appointment.barber._id,
      date || appointment.date,
      time || appointment.time
    );

    if (!isSlotAvailable) {
      return res.status(400).json({
        message: 'Lo slot selezionato non è disponibile'
      });
    }

    // Verifica sovrapposizioni
    const hasOverlap = await Appointment.checkOverlap(
      barberId || appointment.barber._id,
      date || appointment.date,
      time || appointment.time,
      parseInt(duration) || appointment.duration,
      id // Pass the current appointment ID to exclude it from overlap check
    );

    if (hasOverlap) {
      return res.status(400).json({
        message: 'Lo slot si sovrappone con un altro appuntamento'
      });
    }

    // Aggiorna l'appuntamento
    const updateData = {};
    if (service) updateData.service = service;
    if (price) updateData.price = parseFloat(price);
    if (duration) updateData.duration = parseInt(duration);
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (barberId) updateData.barber = barberId;

    console.log('Updating appointment with data:', updateData);

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('client barber');

    // Prova a inviare l'email, ma non bloccare l'operazione se fallisce
    try {
      await notificationService.sendAppointmentUpdateEmail(updatedAppointment, updatedAppointment.client);
    } catch (emailError) {
      console.error('Error sending update email:', emailError);
    }

    res.json({
      message: 'Appuntamento aggiornato con successo',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      message: 'Errore durante l\'aggiornamento dell\'appuntamento',
      error: error.message
    });
  }
},
// Aggiorna note appuntamento
async updateNotes(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    )
    .populate('client', 'firstName lastName email')
    .populate('barber', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},
// Ottieni appuntamenti con filtri per data e barbiere
async getAllWithDateRange(req, res) {
  try {
    const { startDate, endDate, barberId, viewType = 'day' } = req.query;
    console.log('Fetching appointments with filters:', { startDate, endDate, barberId, viewType });

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    // Aggiungi il filtro per barbiere se specificato
    if (barberId) {
      query.barber = new mongoose.Types.ObjectId(barberId);  // Usa new mongoose.Types.ObjectId
    }

    console.log('MongoDB query:', query);

    // Esegui la query con le popolazioni necessarie
    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    // Se è vista giornaliera, ritorna direttamente gli appuntamenti
    if (viewType === 'day') {
      return res.json(appointments);
    }

    // Per viste settimanali e mensili, raggruppa per data
    const groupedAppointments = appointments.reduce((groups, appointment) => {
      const dateKey = new Date(appointment.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          appointments: []
        };
      }
      groups[dateKey].appointments.push(appointment);
      return groups;
    }, {});

    // Converti l'oggetto in array e ordina per data
    const result = Object.values(groupedAppointments)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (error) {
    console.error('Error in getAllWithDateRange:', error);
    res.status(500).json({
      message: 'Errore nel recupero degli appuntamenti',
      error: error.message
    });
  }
},

// Vista giornaliera
async getDayAppointments(req, res) {
  try {
    const { date, barberId } = req.query;
    const query = {
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      }
    };

    if (barberId) {
      query.barber = barberId;
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Vista settimanale
async getWeekAppointments(req, res) {
  try {
    const { startDate, endDate, barberId } = req.query;
    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (barberId) {
      query.barber = barberId;
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Vista mensile
async getMonthAppointments(req, res) {
  try {
    const { startDate, endDate, barberId } = req.query;
    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (barberId) {
      query.barber = barberId;
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

// Appuntamenti per barbiere specifico
async getBarberAppointments(req, res) {
  try {
    const { barberId } = req.params;
    const { startDate, endDate } = req.query;

    // Validation
    if (!barberId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'barberId, startDate e endDate sono richiesti'
      });
    }

    // Query con status check
    const appointments = await Appointment.find({
      barber: barberId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' } // Esclude gli appuntamenti cancellati
    })
    .populate('client', 'firstName lastName email phone')
    .populate('barber', 'firstName lastName email') // Aggiungiamo email se serve
    .sort({ date: 1, time: 1 });

    // Logging per debug
    console.log(`Found ${appointments.length} appointments for barber ${barberId}`);

    // Raggruppa gli appuntamenti per data con formato più dettagliato
    const groupedAppointments = appointments.reduce((groups, appointment) => {
      const date = appointment.date.toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = {
          date,
          appointments: [],
          totalAppointments: 0,
          totalRevenue: 0
        };
      }
      groups[date].appointments.push(appointment);
      groups[date].totalAppointments += 1;
      groups[date].totalRevenue += appointment.price || 0;
      return groups;
    }, {});

    // Converte l'oggetto in array se necessario
    const result = Object.values(groupedAppointments).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      barberId,
      dateRange: { startDate, endDate },
      totalAppointments: appointments.length,
      appointments: result
    });

  } catch (error) {
    console.error('Error in getBarberAppointments:', error);
    res.status(500).json({
      message: 'Errore nel recupero degli appuntamenti',
      error: error.message
    });
  }
},
// Filtro appuntamenti

async getFilteredAppointments(req, res) {
  try {
    const { startDate, endDate, barberId, viewType = 'day' } = req.query;

    console.log('Fetching filtered appointments:', { startDate, endDate, barberId, viewType });

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    if (barberId) {
      query.barber = mongoose.Types.ObjectId(barberId);
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName email')
      .sort({ date: 1, time: 1 });

    if (viewType === 'day') {
      return res.json(appointments);
    }

    // Per viste settimanali e mensili, raggruppa per data
    const groupedAppointments = appointments.reduce((groups, appointment) => {
      const dateKey = appointment.date.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appointment);
      return groups;
    }, {});

    // Converti in array ordinato per data
    const result = Object.entries(groupedAppointments)
      .map(([date, appointments]) => ({
        date,
        appointments
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (error) {
    console.error('Error in getFilteredAppointments:', error);
    res.status(500).json({
      message: 'Errore nel recupero degli appuntamenti',
      error: error.message
    });
  }
},
// creazione appuntamenti come Guest

createGuestAppointment: async (req, res) => {
  try {
    console.log('Received guest appointment request:', req.body);

    const {
      firstName,
      lastName,
      email,
      phone,
      barberId,
      service,
      date,
      time,
      duration,
      price
    } = req.body;

    // Validazione dei dati
    if (!firstName || !lastName || !email || !phone || !service || !date || !time || !barberId) {
      console.log('Missing required fields:', { firstName, lastName, email, phone, service, date, time, barberId });
      return res.status(400).json({
        message: 'Tutti i campi sono obbligatori'
      });
    }

    // Verifica che il barbiere esista
    const barber = await Barber.findById(barberId);
    if (!barber) {
      console.log('Barber not found:', barberId);
      return res.status(404).json({
        message: 'Barbiere non trovato'
      });
    }

    // Verifica che il servizio esista e sia attivo
    const serviceDoc = await Service.findOne({
      name: service,
      isActive: true
    });

    if (!serviceDoc) {
      console.log('Service not found or not active:', service);
      return res.status(400).json({
        message: 'Servizio non valido o non attivo'
      });
    }

    // Verifica che il barbiere offra questo servizio
    if (!barber.services.includes(service)) {
      console.log('Barber does not offer this service:', { barber: barber.firstName, service });
      return res.status(400).json({
        message: 'Il barbiere selezionato non offre questo servizio'
      });
    }

    // Verifica disponibilità slot
    const isAvailable = await Appointment.isSlotAvailable(barberId, date, time);
    if (!isAvailable) {
      console.log('Slot not available');
      return res.status(400).json({
        message: 'Lo slot selezionato non è più disponibile'
      });
    }

    // Verifica sovrapposizioni
    const hasOverlap = await Appointment.checkOverlap(barberId, date, time, parseInt(duration));
    if (hasOverlap) {
      console.log('Overlap detected');
      return res.status(400).json({
        message: 'Lo slot si sovrappone con un altro appuntamento'
      });
    }

    // Trova o crea utente guest
    let guestUser = await User.findOne({ email: email.toLowerCase() });

    if (!guestUser) {
      guestUser = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        role: 'client',
        isGuest: true
      });
      console.log('Creating new guest user');
      await guestUser.save();
    } else if (!guestUser.isGuest) {
      return res.status(400).json({
        message: 'Esiste già un account registrato con questa email. Effettua il login per prenotare.'
      });
    } else {
      console.log('Found existing guest user:', guestUser._id);
      guestUser.firstName = firstName;
      guestUser.lastName = lastName;
      guestUser.phone = phone;
      await guestUser.save();
    }

    // Crea l'appuntamento
    const appointmentData = {
      client: guestUser._id,
      barber: barberId,
      service,
      price: parseFloat(price),
      duration: parseInt(duration),
      date: new Date(date),
      time,
      status: 'pending'
    };

    console.log('Creating appointment with data:', appointmentData);
    const appointment = await Appointment.create(appointmentData);

    // Aggiorna l'array degli appuntamenti dell'utente
    if (!guestUser.appointments) {
      guestUser.appointments = [];
    }
    guestUser.appointments.push(appointment._id);
    await guestUser.save();

    // Invia email di conferma
    try {
      await sendBookingConfirmation({
        appointment: {
          ...appointment.toObject(),
          barber: barber.toObject()
        },
        user: guestUser
      });
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({
      message: 'Prenotazione effettuata con successo',
      appointment: {
        id: appointment._id,
        service,
        date,
        time,
        barber: {
          firstName: barber.firstName,
          lastName: barber.lastName
        }
      }
    });

  } catch (error) {
    console.error('Error creating guest appointment:', error);
    res.status(500).json({
      message: error.message || 'Errore durante la creazione dell\'appuntamento'
    });
  }
},
// metodo per ottenere i barbieri pubblicamente
getPublicBarbers: async (req, res) => {
  try {
    const barbers = await Barber.find({ isActive: true })
      .select('firstName lastName services workingHours');
    res.json(barbers);
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({
      message: 'Errore nel recupero dei barbieri',
      error: error.message
    });
  }
}
};


// Funzione helper per generare gli slot


export default appointmentController;
