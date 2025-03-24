import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Appointment from '../models/Appointment.js';
import { notificationService } from '../services/notificationService.js';

export const runDiagnosticCheck = async () => {
  console.log('Iniziando la diagnostica del sistema di notifiche...');
  const results = {
    database: { success: false, error: null },
    email: { success: false, error: null },
    twilio: { success: false, error: null },
    appointments: { success: false, error: null, data: null }
  };

  // 1. Verifica connessione database
  try {
    console.log('Controllo connessione al database...');
    if (mongoose.connection.readyState === 1) {
      results.database.success = true;
      console.log('✅ Connessione al database OK');
    } else {
      results.database.error = 'Database non connesso';
      console.log('❌ Database non connesso');
    }
  } catch (error) {
    results.database.error = error.message;
    console.log('❌ Errore nella verifica del database:', error);
  }

  // 2. Verifica configurazione email
  try {
    console.log('Controllo configurazione email...');
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      results.email.error = 'Credenziali SMTP mancanti';
      console.log('❌ Credenziali SMTP mancanti');
    } else {
      // Crea un transporter temporaneo per il test
      const testTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verifica le credenziali
      await testTransporter.verify();
      results.email.success = true;
      console.log('✅ Configurazione email OK');

      // Invia email di test al proprio indirizzo
      const testEmail = await testTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: 'Test diagnostico sistema notifiche',
        text: 'Questo è un test del sistema di notifiche. Se ricevi questa email, la configurazione SMTP funziona correttamente.'
      });

      console.log('✅ Email di test inviata:', testEmail.messageId);
    }
  } catch (error) {
    results.email.error = error.message;
    console.log('❌ Errore nella verifica email:', error);
  }

  // 3. Verifica configurazione Twilio
  try {
    console.log('Controllo configurazione Twilio...');
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      results.twilio.error = 'Credenziali Twilio mancanti';
      console.log('❌ Credenziali Twilio mancanti');
    } else {
      // Inizializza client temporaneo
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      // Verifica l'account
      const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

      results.twilio.success = true;
      results.twilio.accountStatus = account.status;
      results.twilio.accountType = account.type;

      console.log('✅ Configurazione Twilio OK');
      console.log('📱 Stato account Twilio:', account.status);
      console.log('📱 Tipo account Twilio:', account.type);

      // Verifica i numeri di telefono configurati
      if (process.env.TWILIO_PHONE_NUMBER) {
        console.log('📱 Numero Twilio per SMS configurato:', process.env.TWILIO_PHONE_NUMBER);
      } else {
        console.log('⚠️ Numero Twilio per SMS non configurato');
      }

      if (process.env.TWILIO_WHATSAPP_NUMBER) {
        console.log('📱 Numero Twilio per WhatsApp configurato:', process.env.TWILIO_WHATSAPP_NUMBER);
      } else {
        console.log('⚠️ Numero Twilio per WhatsApp non configurato');
      }
    }
  } catch (error) {
    results.twilio.error = error.message;
    console.log('❌ Errore nella verifica Twilio:', error);
  }

  // 4. Verifica appuntamenti in arrivo che potrebbero ricevere promemoria
  try {
    console.log('Controllo appuntamenti imminenti per promemoria...');
    if (results.database.success) {
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const upcomingAppointments = await Appointment.find({
        status: { $in: ['confirmed', 'pending'] },
        date: { $gte: now, $lte: in48Hours },
        reminderSent: false
      })
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName')
      .sort({ date: 1, time: 1 })
      .lean();

      // Calcola le ore rimanenti per ogni appuntamento
      const appointmentsWithDetails = upcomingAppointments.map(appointment => {
        try {
          const appointmentDate = new Date(appointment.date);
          const [hours, minutes] = appointment.time.split(':').map(Number);
          appointmentDate.setHours(hours, minutes, 0, 0);
          const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);

          return {
            id: appointment._id,
            client: `${appointment.client?.firstName || 'N/A'} ${appointment.client?.lastName || 'N/A'}`,
            clientPhone: appointment.client?.phone || 'N/A',
            clientEmail: appointment.client?.email || 'N/A',
            date: appointment.date,
            time: appointment.time,
            service: appointment.service,
            hoursRemaining: parseFloat(hoursDifference.toFixed(2)),
            shouldSendReminder: hoursDifference <= 26 && hoursDifference > 23,
            reminderStatus: appointment.reminderSent ? 'Inviato' : 'Non inviato',
            reminderError: appointment.reminderError || null
          };
        } catch (e) {
          console.error('Errore nell\'elaborazione dell\'appuntamento:', e);
          return {
            id: appointment._id,
            error: e.message
          };
        }
      });

      results.appointments.success = true;
      results.appointments.data = appointmentsWithDetails;
      results.appointments.count = appointmentsWithDetails.length;

      console.log(`✅ Trovati ${appointmentsWithDetails.length} appuntamenti nei prossimi 2 giorni`);

      // Mostra quali appuntamenti dovrebbero ricevere promemoria presto
      const reminderDue = appointmentsWithDetails.filter(a => a.shouldSendReminder);
      console.log(`📆 ${reminderDue.length} appuntamenti dovrebbero ricevere promemoria a breve:`);

      reminderDue.forEach(appointment => {
        console.log(`- Appuntamento ${appointment.id}: ${appointment.client}, ${appointment.date} ${appointment.time}, ore rimanenti: ${appointment.hoursRemaining}`);
      });
    } else {
      results.appointments.error = 'Database non disponibile';
      console.log('❌ Impossibile controllare gli appuntamenti: database non disponibile');
    }
  } catch (error) {
    results.appointments.error = error.message;
    console.log('❌ Errore nel controllo degli appuntamenti:', error);
  }

  // Risultato complessivo
  console.log('\n===== RIEPILOGO DIAGNOSTICA =====');
  console.log(`Database: ${results.database.success ? '✅ OK' : '❌ Errore'}`);
  console.log(`Email: ${results.email.success ? '✅ OK' : '❌ Errore'}`);
  console.log(`Twilio: ${results.twilio.success ? '✅ OK' : '❌ Errore'}`);
  console.log(`Appuntamenti: ${results.appointments.success ? '✅ OK' : '❌ Errore'}`);

  if (results.appointments.data && results.appointments.data.length > 0) {
    const nextReminder = results.appointments.data.find(a => a.shouldSendReminder);
    if (nextReminder) {
      console.log(`\n⏰ PROSSIMO PROMEMORIA: appuntamento ${nextReminder.id} (${nextReminder.hoursRemaining.toFixed(2)} ore rimanenti)`);
    } else {
      console.log('\n⏰ Nessun promemoria da inviare nelle prossime ore');
    }
  }

  return results;
};

// Funzione per forzare l'invio immediato di promemoria per test
export const forceReminderForAppointment = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('client', 'firstName lastName email phone')
      .populate('barber', 'firstName lastName');

    if (!appointment) {
      throw new Error('Appuntamento non trovato');
    }

    console.log(`Invio forzato di promemoria per l'appuntamento ${appointmentId}`);

    // Modifica lo stato per permettere l'invio anche se già inviato
    appointment.reminderSent = false;
    await appointment.save();

    // Invia i promemoria manualmente
    const results = {
      email: false,
      sms: false,
      whatsapp: false
    };

    try {
      results.email = await notificationService.sendReminderEmail(appointment, appointment.client);
      console.log(`Email: ${results.email ? '✅ Inviata' : '❌ Fallita'}`);
    } catch (e) {
      console.error('Errore email:', e);
    }

    try {
      results.sms = await notificationService.sendReminderSMS(appointment, appointment.client);
      console.log(`SMS: ${results.sms ? '✅ Inviato' : '❌ Fallito'}`);
    } catch (e) {
      console.error('Errore SMS:', e);
    }

    try {
      results.whatsapp = await notificationService.sendWhatsAppMessage(appointment, appointment.client);
      console.log(`WhatsApp: ${results.whatsapp ? '✅ Inviato' : '❌ Fallito'}`);
    } catch (e) {
      console.error('Errore WhatsApp:', e);
    }

    return {
      success: results.email || results.sms || results.whatsapp,
      appointmentId,
      results
    };
  } catch (error) {
    console.error('Errore nell\'invio forzato del promemoria:', error);
    throw error;
  }
};

export default {
  runDiagnosticCheck,
  forceReminderForAppointment
};
