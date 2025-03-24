import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import twilio from 'twilio';
import Appointment from '../models/Appointment.js';
import {
  sendBarberCancellationNotification,
  sendCancellationEmailToAdmin,
  sendCancellationEmailToClient,
  transporter
} from './emailService.js';

// Debug delle variabili d'ambiente Twilio con maggiori dettagli
console.log('Twilio environment variables check:', {
  ACCOUNT_SID_EXISTS: !!process.env.TWILIO_ACCOUNT_SID,
  ACCOUNT_SID_LENGTH: process.env.TWILIO_ACCOUNT_SID?.length,
  AUTH_TOKEN_EXISTS: !!process.env.TWILIO_AUTH_TOKEN,
  AUTH_TOKEN_LENGTH: process.env.TWILIO_AUTH_TOKEN?.length,
  PHONE_NUMBER_EXISTS: !!process.env.TWILIO_PHONE_NUMBER,
  WHATSAPP_NUMBER_EXISTS: !!process.env.TWILIO_WHATSAPP_NUMBER,
  PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? `${process.env.TWILIO_PHONE_NUMBER.substring(0, 3)}...` : 'Missing',
  WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? `${process.env.TWILIO_WHATSAPP_NUMBER.substring(0, 3)}...` : 'Missing',
});

// Funzione helper migliorata per formattare i numeri di telefono svizzeri
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    console.error('Numero di telefono mancante');
    throw new Error('Phone number is required');
  }

  try {
    console.log('Formattazione numero di telefono:', phoneNumber);

    // Rimuovi tutti i caratteri non numerici
    let cleaned = phoneNumber.replace(/\D/g, '');
    console.log('Numero pulito (solo cifre):', cleaned);

    // Gestione prefisso svizzero
    if (cleaned.startsWith('0')) {
      cleaned = '41' + cleaned.substring(1);
      console.log('Numero con prefisso svizzero aggiunto:', cleaned);
    }

    if (!cleaned.startsWith('41') && !cleaned.startsWith('+41')) {
      // Se non inizia con 41 o +41, verifica se è un numero svizzero
      if (cleaned.length === 9) {
        // Probabilmente è un numero svizzero senza prefisso (es. 79XXXXXXX)
        cleaned = '41' + cleaned;
        console.log('Numero svizzero rilevato, aggiunto prefisso 41:', cleaned);
      }
    }

    // Assicurati che inizi con +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
      console.log('Aggiunto + al numero:', cleaned);
    }

    // Validazione base del formato
    if (cleaned.length < 11 || cleaned.length > 15) {
      console.warn('Lunghezza del numero formatato non standard:', cleaned.length, cleaned);
    }

    console.log('Numero formattato finale:', cleaned);
    return cleaned;
  } catch (error) {
    console.error('Errore nella formattazione del numero di telefono:', error);
    throw error;
  }
};

// Configurazione Twilio (condizionale) con gestione errori migliorata
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client inizializzato con successo');

    // Test della connessione Twilio
    twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID)
      .fetch()
      .then(account => {
        console.log('✅ Twilio account verificato:', {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type
        });
      })
      .catch(error => {
        console.error('❌ Errore verifica account Twilio:', error.message);
      });
  } else {
    console.log('Credenziali Twilio non fornite - le funzionalità SMS/WhatsApp saranno disabilitate');
  }
} catch (error) {
  console.error('Errore inizializzazione client Twilio:', error);
}

export const notificationService = {
  // Funzione per gestire cancellazione appuntamenti
  async sendCancellationEmail(appointment, user) {
    try {
      // Invia email al cliente
      await sendCancellationEmailToClient(appointment, user);

      // Invia email al barbiere (se esiste)
      if (appointment.barber && appointment.barber.email) {
        await sendBarberCancellationNotification(appointment, user);
      }

      return true;
    } catch (error) {
      console.error('Errore invio email di cancellazione:', error);
      return false;
    }
  },

  async sendAdminCancellationConfirmation(appointment, admin, client) {
    try {
      await sendCancellationEmailToAdmin(appointment, client);
      return true;
    } catch (error) {
      console.error('Errore invio email di cancellazione all\'admin:', error);
      return false;
    }
  },

  async sendReminderEmail(appointment, user) {
    try {
      if (!user || !user.email) {
        console.error('Email utente mancante per invio promemoria');
        return false;
      }

      console.log(`Invio email di promemoria a ${user.email} per appuntamento ${appointment._id}`);

      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Date(appointment.date).toLocaleDateString('it-IT', dateOptions);

      // Contenuto HTML migliorato
      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">Promemoria Appuntamento</h2>
          </div>
          <div style="padding: 20px;">
            <p>Gentile ${user.firstName},</p>
            <p>Ti ricordiamo che hai un appuntamento domani:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Servizio:</strong> ${appointment.service}</p>
              <p><strong>Data:</strong> ${formattedDate}</p>
              <p><strong>Ora:</strong> ${appointment.time}</p>
              <p><strong>Barbiere:</strong> ${appointment.barber?.firstName || ''} ${appointment.barber?.lastName || ''}</p>
            </div>
            <p style="font-style: italic;">Indirizzo: Via Zurigo 2, Lugano</p>
            <p>Se non puoi presentarti, ti preghiamo di cancellare l'appuntamento con almeno 24 ore di anticipo accedendo al tuo account.</p>
            <p>Ti aspettiamo!</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            <p>Your Style BarberShop</p>
            <p>Via Zurigo 2, Lugano</p>
            <p>&copy; ${new Date().getFullYear()} Your Style Barber Studio. Tutti i diritti riservati.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Promemoria Appuntamento - Your Style BarberShop',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email di promemoria inviata con successo a:', user.email, info.messageId);
      return true;
    } catch (error) {
      console.error('Errore invio email di promemoria:', error);
      return false;
    }
  },

  async sendReminderSMS(appointment, user, retries = 3, delayBase = 2000) {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('SMS di promemoria saltato - Twilio non configurato');
      return false;
    }

    if (!user || !user.phone) {
      console.error('Telefono utente mancante per invio SMS');
      return false;
    }

    let attempt = 0;
    let lastError = null;

    const formatAppointmentMessage = (appointment) => {
      const date = format(new Date(appointment.date), 'd MMMM yyyy', { locale: it });
      const barberInfo = appointment.barber ? `con ${appointment.barber.firstName} ${appointment.barber.lastName}` : '';

      return `Your Style Barber: Promemoria appuntamento per ${date} alle ${appointment.time} ` +
             `${barberInfo} per ${appointment.service}. ` +
             `Indirizzo: Via Example 123, Lugano.`;
    };

    while (attempt < retries) {
      try {
        // Utilizziamo formatPhoneNumber con maggiori controlli
        const formattedPhone = formatPhoneNumber(user.phone);
        console.log(`Tentativo ${attempt + 1}/${retries} - Invio SMS a:`, formattedPhone);

        // Costruisci il messaggio
        const messageBody = formatAppointmentMessage(appointment);
        console.log('Contenuto messaggio SMS:', messageBody);

        // Configurazione debug
        console.log('Configurazione Twilio per SMS:', {
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
          attemptNumber: attempt + 1
        });

        const message = await twilioClient.messages.create({
          body: messageBody,
          to: formattedPhone,
          from: process.env.TWILIO_PHONE_NUMBER,
          statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
        });

        console.log('SMS inviato con successo:', {
          messageId: message.sid,
          status: message.status,
          attempt: attempt + 1
        });

        // Aggiorna l'appuntamento con l'ID del messaggio
        await Appointment.findByIdAndUpdate(appointment._id, {
          $push: {
            smsNotifications: {
              messageSid: message.sid,
              status: message.status,
              timestamp: new Date()
            }
          }
        });

        return true; // Successo

      } catch (error) {
        lastError = error;
        attempt++;

        console.error(`Invio SMS fallito - Tentativo ${attempt}/${retries}:`, {
          error: error.message,
          code: error.code,
          moreInfo: error.moreInfo,
          status: error.status,
          details: error.details
        });

        // Gestione specifica degli errori
        switch (error.code) {
          case 20003:
            console.error('Errore di autenticazione - Controlla le credenziali Twilio');
            await Appointment.findByIdAndUpdate(appointment._id, {
              lastReminderAttempt: new Date(),
              reminderError: 'Errore di autenticazione Twilio'
            });
            return false;

          case 21211:
            console.error('Formato numero di telefono non valido');
            await Appointment.findByIdAndUpdate(appointment._id, {
              lastReminderAttempt: new Date(),
              reminderError: 'Formato numero di telefono non valido'
            });
            return false;

          case 21608:
            console.error('Numero di telefono non nell\'elenco consentito (account di prova)');
            await Appointment.findByIdAndUpdate(appointment._id, {
              lastReminderAttempt: new Date(),
              reminderError: 'Numero di telefono non nell\'elenco consentito'
            });
            return false;

          default:
            // Per altri errori, aspetta prima di riprovare usando exponential backoff
            if (attempt < retries) {
              const delay = delayBase * Math.pow(2, attempt - 1);
              console.log(`Attesa di ${delay}ms prima del prossimo tentativo...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
      }
    }

    // Se arriviamo qui, tutti i tentativi sono falliti
    console.error(`Invio SMS fallito dopo ${retries} tentativi`);

    await Appointment.findByIdAndUpdate(appointment._id, {
      lastReminderAttempt: new Date(),
      reminderError: lastError?.message || 'Tentativi massimi superati'
    });

    return false; // Fallimento dopo tutti i tentativi
  },

  async sendWhatsAppMessage(appointment, user) {
    if (!twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
      console.log('Promemoria WhatsApp saltato - Twilio non configurato');
      return false;
    }

    if (!user || !user.phone) {
      console.error('Telefono utente mancante per invio WhatsApp');
      return false;
    }

    try {
      const formattedPhone = formatPhoneNumber(user.phone);
      console.log('Tentativo di invio promemoria WhatsApp a:', formattedPhone);

      // Costruisci un messaggio più dettagliato
      const date = format(new Date(appointment.date), 'd MMMM yyyy', { locale: it });
      // Aggiungi informazioni sul barbiere se disponibili
      const barberInfo = appointment.barber ? `con ${appointment.barber.firstName} ${appointment.barber.lastName}` : '';

      const messageBody = `Your Style Barber: Promemoria appuntamento per ${date} alle ${appointment.time} ` +
                         `${barberInfo} per ${appointment.service}. ` +
                         `Ti aspettiamo in Via Example 123, Lugano.`;

      console.log('Contenuto messaggio WhatsApp:', messageBody);
      console.log('Configurazione WhatsApp:', {
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`
      });

      const message = await twilioClient.messages.create({
        body: messageBody,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`
      });

      console.log('Messaggio WhatsApp inviato con successo:', {
        messageId: message.sid,
        status: message.status
      });

      // Aggiorna l'appuntamento con l'ID del messaggio
      await Appointment.findByIdAndUpdate(appointment._id, {
        $push: {
          whatsappNotifications: {
            messageSid: message.sid,
            status: message.status,
            timestamp: new Date()
          }
        }
      });

      return true;  // Successo

    } catch (error) {
      console.error('Errore invio messaggio WhatsApp:', error);

      // Dettagli specifici sull'errore
      if (error.code) {
        console.error('Codice errore Twilio:', error.code);
        console.error('Dettagli errore Twilio:', error.moreInfo);
      }

      await Appointment.findByIdAndUpdate(appointment._id, {
        lastReminderAttempt: new Date(),
        reminderError: `Errore WhatsApp: ${error.message}`
      });

      return false;  // Fallimento
    }
  },

  async sendAppointmentUpdateEmail(appointment, user) {
    try {
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Date(appointment.date).toLocaleDateString('it-IT', dateOptions);

      // Contenuto HTML migliorato
      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">Conferma Modifica Appuntamento</h2>
          </div>
          <div style="padding: 20px;">
            <p>Gentile ${user.firstName},</p>
            <p>Il tuo appuntamento è stato modificato. Ecco i nuovi dettagli:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Servizio:</strong> ${appointment.service}</p>
              <p><strong>Data:</strong> ${formattedDate}</p>
              <p><strong>Ora:</strong> ${appointment.time}</p>
              <p><strong>Barbiere:</strong> ${appointment.barber?.firstName || ''} ${appointment.barber?.lastName || ''}</p>
              <p><strong>Prezzo:</strong> CHF${appointment.price}</p>
            </div>
            <p style="font-style: italic;">Indirizzo: Via Example 123, Lugano</p>
            <p>Ricorda che puoi modificare o cancellare l'appuntamento fino a 24 ore prima.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            <p>Your Style Barber Shop</p>
            <p>Via Zurigo 2, Lugano</p>
            <p>&copy; ${new Date().getFullYear()} Your Style Barber Shop. Tutti i diritti riservati.</p>
          </div>
        </div>
      `;

      const emailContent = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Appuntamento Modificato - Your Style Barber',
        html: htmlContent
      };

      const info = await transporter.sendMail(emailContent);
      console.log('Email di conferma modifica inviata con successo:', info.messageId);

      // Se c'è un barbiere associato all'appuntamento, inviamo anche a lui una notifica
      if (appointment.barber && appointment.barber.email) {
        // Contenuto HTML per il barbiere
        const barberHtmlContent = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0; font-size: 24px;">Modifica Appuntamento</h2>
            </div>
            <div style="padding: 20px;">
              <p>Ciao ${appointment.barber.firstName},</p>
              <p>Un appuntamento è stato modificato. Ecco i nuovi dettagli:</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Cliente:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Servizio:</strong> ${appointment.service}</p>
                <p><strong>Data:</strong> ${formattedDate}</p>
                <p><strong>Ora:</strong> ${appointment.time}</p>
                <p><strong>Prezzo:</strong> CHF${appointment.price}</p>
              </div>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p>Your Style Barber Shop</p>
              <p>Via Zurigo 2, Lugano</p>
              <p>&copy; ${new Date().getFullYear()} Your Style Barber Shop. Tutti i diritti riservati.</p>
            </div>
          </div>
        `;

        const barberEmailContent = {
          from: process.env.SMTP_USER,
          to: appointment.barber.email,
          subject: 'Modifica Appuntamento - Your Style Barber',
          html: barberHtmlContent
        };

        await transporter.sendMail(barberEmailContent);
        console.log('Email di notifica modifica inviata al barbiere con successo');
      }

      return info;
    } catch (error) {
      console.error('Errore invio email di conferma modifica:', error);
      return false;
    }
  },

  // Per test e debug
  async testNotificationSystem(phone) {
    const testResults = {
      sms: null,
      whatsapp: null,
      email: null
    };

    console.log('Test sistema di notifica con numero:', phone);

    try {
      // Test SMS
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        const formattedPhone = formatPhoneNumber(phone);
        console.log('Test SMS al numero formattato:', formattedPhone);

        const smsMessage = await twilioClient.messages.create({
          body: 'Questo è un SMS di test dal sistema Your Style Barber',
          to: formattedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        testResults.sms = {
          success: true,
          messageId: smsMessage.sid,
          status: smsMessage.status
        };
        console.log('SMS di test inviato con successo');
      } else {
        testResults.sms = {
          success: false,
          error: 'Twilio non configurato'
        };
      }

      // Test WhatsApp
      if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
        const formattedPhone = formatPhoneNumber(phone);
        console.log('Test WhatsApp al numero formattato:', `whatsapp:${formattedPhone}`);

        const whatsappMessage = await twilioClient.messages.create({
          body: 'Questo è un messaggio WhatsApp di test dal sistema Your Style Barber',
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${formattedPhone}`
        });

        testResults.whatsapp = {
          success: true,
          messageId: whatsappMessage.sid,
          status: whatsappMessage.status
        };
        console.log('WhatsApp di test inviato con successo');
      } else {
        testResults.whatsapp = {
          success: false,
          error: 'Twilio WhatsApp non configurato'
        };
      }
    } catch (error) {
      console.error('Errore nel test del sistema di notifica:', error);
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          moreInfo: error.moreInfo
        }
      };
    }

    return {
      success: true,
      results: testResults
    };
  },

  formatPhoneNumber,

  async sendPasswordResetNotification(user, newPassword, admin) {
    // Controlla se l'utente ha un'email
    if (!user.email) {
      throw new Error('Email utente richiesta per la notifica di reset password');
    }

    const emailSubject = 'La tua password è stata ripristinata';

    // Personalizza il saluto in base al ruolo
    let greeting = 'Gentile Cliente';
    if (user.role === 'barber') {
      greeting = 'Gentile Barbiere';
    } else if (user.role === 'admin') {
      greeting = 'Gentile Amministratore';
    }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
          <h2 style="margin: 0; font-size: 24px;">${emailSubject}</h2>
        </div>
        <div style="padding: 20px;">
          <p>${greeting} ${user.firstName} ${user.lastName},</p>
          <p>Ti informiamo che la tua password è stata ripristinata da un amministratore del sistema.</p>
          <p>Le tue nuove credenziali di accesso sono:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${newPassword}</p>
          </div>
          <p>Ti consigliamo di modificare la password al primo accesso per mantenere sicuro il tuo account.</p>
          <p>Se non hai richiesto questo ripristino o hai domande, ti preghiamo di contattarci immediatamente.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
          <p>Your Style Barber Shop</p>
          <p>Via Zurigo 2, Lugano</p>
          <p>Questo è un messaggio automatico, si prega di non rispondere a questa email.</p>
          <p>&copy; ${new Date().getFullYear()} Your Style Barber Shop. Tutti i diritti riservati.</p>
        </div>
      </div>
    `;

    try {
      // Utilizzo del transporter importato per inviare l'email
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: emailSubject,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email di reset password inviata a ${user.email}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Errore invio email di reset password a ${user.email}:`, error);
      throw error;
    }
  }
};

export default notificationService;
