import mongoose from 'mongoose';
import Service from './Service.js';

const appointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  service: {
    type: String,
    required: true,
    validate: {
      validator: async function(serviceName) {
        // Check if the service exists and is active
        const service = await Service.findOne({
          name: serviceName,
          isActive: true
        });
        return !!service;
      },
      message: props => `${props.value} non è un servizio valido o non è attivo`
    }
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  // Nuovi campi per la gestione SMS
  smsNotifications: [{
    messageSid: String,
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    errorCode: String,
    errorMessage: String
  }],

  // Aggiungi un array simile per le notifiche WhatsApp
  whatsappNotifications: [{
    messageSid: String,
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    errorCode: String,
    errorMessage: String
  }],

  // Aggiungi un array per le notifiche email
  emailNotifications: [{
    messageId: String,
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    error: String
  }],

  // Campi per la gestione dei promemoria
  reminderRetries: {
    type: Number,
    default: 0
  },
  lastReminderAttempt: {
    type: Date
  },
  reminderError: {
    type: String
  },

  // Storia completa delle notifiche
  notificationResults: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'whatsapp'],
      required: true
    },
    success: Boolean,
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageId: String,
    error: String,
    details: mongoose.Schema.Types.Mixed
  }]
});

// Indici per ottimizzare le query
// Indici per ottimizzare le query
appointmentSchema.index({ date: 1, barber: 1 });
appointmentSchema.index({ client: 1, date: -1 });
appointmentSchema.index({ status: 1 });
// Aggiungi questo nuovo indice composto
appointmentSchema.index({ barber: 1, date: 1, status: 1 }); // Nuovo indice per le query filtrate

// Funzioni helper
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
};
// Metodo per verificare se uno slot è disponibile
// Metodi statici aggiornati per il modello Appointment
appointmentSchema.statics.isSlotAvailable = async function(barberId, date, time) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const requestedTimeInMinutes = timeToMinutes(time);

    // Trova tutti gli appuntamenti del giorno
    const existingAppointments = await this.find({
      barber: barberId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    }).lean();

    // Verifica se c'è un appuntamento esattamente allo stesso orario
    const exactTimeConflict = existingAppointments.some(appointment =>
      appointment.time === time
    );

    return !exactTimeConflict;
  } catch (error) {
    console.error('Error in isSlotAvailable:', error);
    throw error;
  }
};

appointmentSchema.statics.checkOverlap = async function(barberId, date, time, duration, excludeAppointmentId = null) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query base per gli appuntamenti esistenti
    const query = {
      barber: barberId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    };

    // Se stiamo aggiornando un appuntamento esistente, escludiamolo dalla verifica
    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await this.find(query).lean();

    const requestedStartMinutes = timeToMinutes(time);
    const requestedEndMinutes = requestedStartMinutes + parseInt(duration);

    // Verifica sovrapposizioni con ogni appuntamento esistente
    for (const appointment of existingAppointments) {
      const existingStartMinutes = timeToMinutes(appointment.time);
      const existingEndMinutes = existingStartMinutes + appointment.duration;

      // Verifica tutte le possibili sovrapposizioni
      const hasOverlap = (
        (requestedStartMinutes >= existingStartMinutes && requestedStartMinutes < existingEndMinutes) ||
        (requestedEndMinutes > existingStartMinutes && requestedEndMinutes <= existingEndMinutes) ||
        (requestedStartMinutes <= existingStartMinutes && requestedEndMinutes >= existingEndMinutes)
      );

      if (hasOverlap) {
        console.log('Overlap detected:', {
          existing: {
            start: appointment.time,
            end: minutesToTime(existingEndMinutes),
            duration: appointment.duration
          },
          requested: {
            start: time,
            end: minutesToTime(requestedEndMinutes),
            duration: duration
          }
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error in checkOverlap:', error);
    throw error;
  }
};

appointmentSchema.statics.getNextAvailableSlot = async function(barberId, date, duration, afterTime = null) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Trova tutti gli appuntamenti del giorno ordinati per orario
    const existingAppointments = await this.find({
      barber: barberId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ time: 1 }).lean();

    let startTimeMinutes = afterTime ? timeToMinutes(afterTime) : 9 * 60; // 9:00 AM default
    const endTimeMinutes = 19 * 60; // 7:00 PM default

    // Trova il primo slot disponibile dopo l'orario specificato
    while (startTimeMinutes + duration <= endTimeMinutes) {
      const currentTime = minutesToTime(startTimeMinutes);

      const hasOverlap = await this.checkOverlap(
        barberId,
        date,
        currentTime,
        duration
      );

      if (!hasOverlap) {
        return currentTime;
      }

      // Incrementa di 30 minuti
      startTimeMinutes += 30;
    }

    return null; // Nessuno slot disponibile trovato
  } catch (error) {
    console.error('Error in getNextAvailableSlot:', error);
    throw error;
  }
};

// Metodo per ottenere tutti gli appuntamenti di un giorno
appointmentSchema.statics.getDayAppointments = async function(date, barberId) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' }
  };

  if (barberId) {
    query.barber = barberId;
  }

  return this.find(query)
    .populate('client', 'firstName lastName email phone')
    .populate('barber', 'firstName lastName')
    .sort('time');
};

// Metodo per ottenere gli appuntamenti futuri di un cliente
appointmentSchema.statics.getClientUpcomingAppointments = async function(clientId) {
  return this.find({
    client: clientId,
    date: { $gte: new Date() },
    status: { $nin: ['cancelled', 'completed'] }
  })
  .populate('barber', 'firstName lastName')
  .sort('date time');
};
// Ottieni appuntamenti per range di date
appointmentSchema.statics.getAppointmentsByDateRange = async function(startDate, endDate, barberId = null) {
  try {
    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    if (barberId) {
      query.barber = mongoose.Types.ObjectId(barberId); // Converti barberId in ObjectId
    }

    console.log('Fetching appointments with query:', query);

    return this.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName email') // Aggiungi altri campi del barbiere se necessario
      .sort({ date: 1, time: 1 })
      .lean(); // Usa lean() per prestazioni migliori
  } catch (error) {
    console.error('Error in getAppointmentsByDateRange:', error);
    throw error;
  }
};

// Ottieni appuntamenti settimanali
appointmentSchema.statics.getWeekAppointments = async function(startDate, endDate, barberId = null) {
  try {
    const query = {
      date: {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    if (barberId) {
      query.barber = barberId;
    }

    const appointments = await this.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    // Raggruppa gli appuntamenti per giorno
    const groupedByDay = appointments.reduce((groups, appointment) => {
      const date = appointment.date.toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});

    return groupedByDay;
  } catch (error) {
    console.error('Error in getWeekAppointments:', error);
    throw error;
  }
};

// Ottieni appuntamenti mensili
appointmentSchema.statics.getMonthAppointments = async function(startDate, endDate, barberId = null) {
  try {
    const query = {
      date: {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    if (barberId) {
      query.barber = barberId;
    }

    const appointments = await this.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    // Raggruppa gli appuntamenti per giorno
    const groupedByDay = appointments.reduce((groups, appointment) => {
      const date = appointment.date.toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});

    return groupedByDay;
  } catch (error) {
    console.error('Error in getMonthAppointments:', error);
    throw error;
  }
};

// Ottieni appuntamenti per barbiere
appointmentSchema.statics.getBarberAppointments = async function(barberId, startDate, endDate) {
  try {
    const appointments = await this.find({
      barber: barberId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    })
    .populate('client', 'firstName lastName email phone')
    .populate('barber', 'firstName lastName')
    .sort({ date: 1, time: 1 });

    // Raggruppa gli appuntamenti per data
    const groupedAppointments = appointments.reduce((groups, appointment) => {
      const date = appointment.date.toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});

    return groupedAppointments;
  } catch (error) {
    console.error('Error in getBarberAppointments:', error);
    throw error;
  }
};

// Ottieni statistiche appuntamenti per periodo
appointmentSchema.statics.getAppointmentsStats = async function(startDate, endDate, barberId = null) {
  try {
    const matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    };

    if (barberId) {
      matchStage.barber = mongoose.Types.ObjectId(barberId);
    }

    const stats = await this.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          totalAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    return stats;
  } catch (error) {
    console.error('Error in getAppointmentsStats:', error);
    throw error;
  }
};
appointmentSchema.statics.getFilteredAppointments = async function(params) {
  try {
    const { startDate, endDate, barberId, viewType } = params;

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

    const appointments = await this.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName email')
      .sort({ date: 1, time: 1 })
      .lean();

    // Se viewType è 'day', ritorna gli appuntamenti normalmente
    if (viewType === 'day') {
      return appointments;
    }

    // Per week e month, raggruppa gli appuntamenti per data
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

    return Object.values(groupedAppointments).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );
  } catch (error) {
    console.error('Error in getFilteredAppointments:', error);
    throw error;
  }
};
// Metodo per verificare se l'appuntamento può essere cancellato
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDate = new Date(`${this.date}T${this.time}`);
  const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
  return hoursDifference >= 24;
};

// Metodo per verificare se è il momento di inviare il promemoria
appointmentSchema.methods.shouldSendReminder = function() {
  const now = new Date();
  const appointmentDate = new Date(`${this.date}T${this.time}`);
  const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
  return hoursDifference <= 24 && hoursDifference > 0 && !this.reminderSent;
};

// Metodo per verificare se è il momento di confermare l'appuntamento
appointmentSchema.methods.shouldBeConfirmed = function() {
  const now = new Date();
  const appointmentDate = new Date(`${this.date}T${this.time}`);
  const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
  return hoursDifference <= 24 && this.status === 'pending';
};

// AGGIUNGI QUI I NUOVI METODI HELPER
// Helper per convertire data e ora in Date object
appointmentSchema.methods.getAppointmentDateTime = function() {
  return new Date(`${this.date.toISOString().split('T')[0]}T${this.time}`);
};

// Helper per calcolare la differenza di ore
appointmentSchema.methods.getHoursDifference = function() {
  const now = new Date();
  const appointmentDateTime = this.getAppointmentDateTime();
  return (appointmentDateTime - now) / (1000 * 60 * 60);
};

// Aggiorna i metodi esistenti per usare gli helper
appointmentSchema.methods.canBeCancelled = function() {
  return this.getHoursDifference() >= 24;
};

appointmentSchema.methods.shouldSendReminder = function() {
  const hoursDifference = this.getHoursDifference();
  return hoursDifference <= 24 && hoursDifference > 0 && !this.reminderSent;
};

appointmentSchema.methods.shouldBeConfirmed = function() {
  const hoursDifference = this.getHoursDifference();
  return hoursDifference <= 24 && this.status === 'pending';
};

// FINE DEI NUOVI METODI HELPER

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
