import bcrypt from 'bcryptjs';
import mongoose from 'mongoose'; // Aggiungi questa riga
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { notificationService } from '../services/notificationService.js';

export const adminController = {
  // Metodi esistenti per gli appuntamenti
  async getAllAppointments(req, res) {
    try {
      const appointments = await Appointment.find()
        .populate('client', 'firstName lastName email phone')
        .sort({ date: 1, time: 1 });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Prima trova l'appuntamento esistente e popola i dati necessari
      const appointment = await Appointment.findById(id)
        .populate('client', 'firstName lastName email phone')
        .populate('barber', 'firstName lastName email');

      if (!appointment) {
        return res.status(404).json({ message: 'Appuntamento non trovato' });
      }

      // Aggiorna lo stato
      appointment.status = status;

      // Se l'appuntamento viene cancellato
      if (status === 'cancelled') {
        appointment.cancelledAt = new Date();
        appointment.cancelledBy = req.user._id;
        appointment.cancellationReason = req.body.cancellationReason || 'Cancellato dall\'amministratore';

        // Crea un array di promesse per l'invio delle email
        const notificationPromises = [
          // Email al cliente
          notificationService.sendCancellationEmail(appointment, appointment.client),
          // Email al barbiere se ha un'email
          appointment.barber?.email ?
            notificationService.sendCancellationEmail(appointment, appointment.barber) :
            Promise.resolve(),
          // Email all'admin
          notificationService.sendAdminCancellationConfirmation(
            appointment,
            req.user, // l'admin che ha effettuato la cancellazione
            appointment.client // il cliente il cui appuntamento è stato cancellato
          )
        ];

        // Esegui tutte le notifiche in parallelo
        try {
          await Promise.all(notificationPromises);
          console.log('All cancellation notifications sent successfully');
        } catch (notificationError) {
          console.error('Error sending cancellation notifications:', notificationError);
          // Non blocchiamo il flusso principale ma logghiamo l'errore
        }
      }

      // Salva l'appuntamento
      await appointment.save({ validateModifiedOnly: true });

      res.json({
        message: 'Stato appuntamento aggiornato con successo',
        appointment
      });
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({
        message: 'Errore nell\'aggiornamento dello stato',
        error: error.message
      });
    }
  },

  async getAppointmentStats(req, res) {
    try {
      const stats = await Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$price' }
          }
        }
      ]);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAppointmentsByDate(req, res) {
    try {
      const { date } = req.query;
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .populate('client', 'firstName lastName email phone')
      .sort({ time: 1 });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getDashboardStats(req, res) {
    try {
      const { timeframe = 'month', barberId } = req.query;
      const today = new Date();
      let startDate;
      let endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      // Calcola la data di inizio in base al timeframe
      switch(timeframe) {
        case 'week':
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setDate(today.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      // Debug log per i parametri ricevuti
      console.log('Date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe,
        barberId
      });

      // Base match condition
      const matchCondition = {
        date: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      };

      // Add barber filter if specified
      if (barberId && barberId !== 'all') {
        try {
          // Verifica validità dell'ID
          if (!mongoose.Types.ObjectId.isValid(barberId)) {
            return res.status(400).json({
              message: 'ID barbiere non valido',
              error: 'Invalid ObjectId format'
            });
          }
          matchCondition.barber = new mongoose.Types.ObjectId(barberId);
          console.log('Added barber filter:', matchCondition.barber);
        } catch (error) {
          console.error('Error converting barberId to ObjectId:', error);
          return res.status(400).json({
            message: 'Errore nella conversione dell\'ID barbiere',
            error: error.message
          });
        }
      }

      // Pipeline per statistiche di base (mensili)
      const monthlyStats = await Appointment.aggregate([
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              ...(timeframe === 'week' ? { day: { $dayOfMonth: '$date' } } : {})
            },
            count: { $sum: 1 },
            revenue: { $sum: '$price' }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            ...(timeframe === 'week' ? { '_id.day': 1 } : {})
          }
        }
      ]);

      // Pipeline per statistiche giornaliere (solo se timeframe è 'month')
      let dailyStats = [];
      let dailyRevenue = [];

      if (timeframe === 'month') {
        dailyStats = await Appointment.aggregate([
          {
            $match: matchCondition
          },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' }
              },
              count: { $sum: 1 },
              revenue: { $sum: '$price' }
            }
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1,
              '_id.day': 1
            }
          },
          {
            $project: {
              day: '$_id.day',
              count: 1,
              _id: 0
            }
          }
        ]);

        dailyRevenue = await Appointment.aggregate([
          {
            $match: matchCondition
          },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' }
              },
              revenue: { $sum: '$price' }
            }
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1,
              '_id.day': 1
            }
          },
          {
            $project: {
              day: '$_id.day',
              revenue: 1,
              _id: 0
            }
          }
        ]);
      }

      // Altre pipeline esistenti
      const peakHours = await Appointment.aggregate([
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: { $substr: ['$time', 0, 2] },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            hour: { $concat: ['$_id', ':00'] },
            count: 1,
            _id: 0
          }
        },
        {
          $sort: { hour: 1 }
        }
      ]);

      const customerRetention = await Appointment.aggregate([
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: '$client',
            visitCount: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$visitCount', 1] }, then: '1 visita' },
                  { case: { $and: [{ $gte: ['$visitCount', 2] }, { $lte: ['$visitCount', 3] }] }, then: '2-3 visite' },
                  { case: { $gte: ['$visitCount', 4] }, then: '4+ visite' }
                ],
                default: 'altro'
              }
            },
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            name: '$_id',
            value: 1,
            _id: 0
          }
        }
      ]);

      const serviceStats = await Appointment.aggregate([
        {
          $match: matchCondition
        },
        {
          $group: {
            _id: '$service',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            name: '$_id',
            count: 1,
            _id: 0
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

      // Formatta i dati
      let formattedStats;
      if (timeframe === 'week') {
        formattedStats = monthlyStats.map(stat => ({
          month: `${stat._id.day}/${stat._id.month}`,
          count: stat.count,
          revenue: stat.revenue
        }));
      } else {
        const allMonths = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const monthIndex = currentDate.getMonth();
          const existingStat = monthlyStats.find(s =>
            s._id.month === monthIndex + 1 &&
            s._id.year === currentDate.getFullYear()
          );

          allMonths.push({
            month: months[monthIndex],
            count: existingStat?.count || 0,
            revenue: existingStat?.revenue || 0
          });

          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        formattedStats = allMonths;
      }

      // Ritorna tutti i dati formattati, includendo i dati giornalieri quando il timeframe è 'month'
      res.json({
        appointmentsByMonth: formattedStats,
        revenueByMonth: formattedStats,
        // Aggiungi statistiche giornaliere se timeframe è 'month'
        ...(timeframe === 'month' && {
          appointmentsByDay: dailyStats,
          revenueByDay: dailyRevenue
        }),
        serviceStats,
        peakHours,
        customerRetention
      });

    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({
        message: 'Errore nel recupero delle statistiche',
        error: error.message
      });
    }
  },

  async getAllServices(req, res) {
    try {
      const services = await Service.find().sort({ name: 1 });
      res.json(services);
    } catch (error) {
      res.status(500).json({
        message: 'Errore nel recupero dei servizi',
        error: error.message
      });
    }
  },

  async createService(req, res) {
    try {
      const { name, price, duration, description } = req.body;

      // Verifica se il servizio esiste già
      const existingService = await Service.findOne({ name });
      if (existingService) {
        return res.status(400).json({ message: 'Un servizio con questo nome esiste già' });
      }

      const service = new Service({
        name,
        price,
        duration,
        description,
        isActive: true
      });

      await service.save();
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({
        message: 'Errore nella creazione del servizio',
        error: error.message
      });
    }
  },

  async updateService(req, res) {
    try {
      const { id } = req.params;
      const { name, price, duration, description, isActive } = req.body;

      // Verifica se esiste un altro servizio con lo stesso nome
      const existingService = await Service.findOne({ name, _id: { $ne: id } });
      if (existingService) {
        return res.status(400).json({ message: 'Un servizio con questo nome esiste già' });
      }

      const service = await Service.findByIdAndUpdate(
        id,
        { name, price, duration, description, isActive },
        { new: true }
      );

      if (!service) {
        return res.status(404).json({ message: 'Servizio non trovato' });
      }

      res.json(service);
    } catch (error) {
      res.status(400).json({
        message: 'Errore nell\'aggiornamento del servizio',
        error: error.message
      });
    }
  },

  async deleteService(req, res) {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);

      if (!service) {
        return res.status(404).json({ message: 'Servizio non trovato' });
      }

      // Soft delete: imposta isActive a false invece di eliminare
      service.isActive = false;
      await service.save();

      res.json({ message: 'Servizio disattivato con successo' });
    } catch (error) {
      res.status(500).json({
        message: 'Errore nella disattivazione del servizio',
        error: error.message
      });
    }
  },

  // Nuovi metodi per la gestione utenti
  async getAllUsers(req, res) {
    try {
      const users = await User.find().select('-password').sort({ firstName: 1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Errore nel recupero degli utenti' });
    }
  },

  async createUser(req, res) {
    try {
      const { email, firstName, lastName, phone, role, password = 'password123' } = req.body;

      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email già registrata' });
      }

      // Hash della password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crea nuovo utente
      const newUser = new User({
        email,
        firstName,
        lastName,
        phone,
        role,
        password: hashedPassword
      });

      await newUser.save();

      // Rimuovi la password dalla risposta
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Errore nella creazione dell\'utente' });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, firstName, lastName, phone, role } = req.body;

      // Verifica se esiste un altro utente con la stessa email
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email già in uso' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { email, firstName, lastName, phone, role },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'utente' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Verifica che non sia l'ultimo admin
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({
            message: 'Impossibile eliminare l\'ultimo amministratore'
          });
        }
      }

      await User.findByIdAndDelete(id);
      res.json({ message: 'Utente eliminato con successo' });
    } catch (error) {
      res.status(500).json({ message: 'Errore nell\'eliminazione dell\'utente' });
    }
  },
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: 'La nuova password è richiesta' });
      }

      // Trova l'utente
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      // Hash della nuova password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Aggiorna la password dell'utente
      user.password = hashedPassword;
      await user.save();

      // Invia email di notifica all'utente
      try {
        // Utilizza il servizio di notifica esistente o il modulo nodemailer direttamente
        await notificationService.sendPasswordResetNotification(
          user,
          newPassword,
          req.user // l'admin che ha effettuato il reset
        );
        console.log(`Password reset notification sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending password reset notification:', emailError);
        // Non blocchiamo il processo se l'invio dell'email fallisce
      }

      res.json({
        message: 'Password ripristinata con successo',
        userEmail: user.email
      });
    } catch (error) {
      console.error('Error in resetUserPassword:', error);
      res.status(500).json({
        message: 'Errore nel ripristino della password',
        error: error.message
      });
    }
  }
};
