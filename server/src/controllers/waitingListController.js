import WaitingList from '../models/WaitingList.js';
import { transporter } from '../services/emailService.js';
import { notificationService } from '../services/notificationService.js';

export const waitingListController = {
  // Aggiunge un cliente alla lista d'attesa
  async addToWaitingList(req, res) {
    try {
      // Debug log per vedere i dati ricevuti
      console.log('Received request body:', req.body);

      const {
        preferredBarber,
        service,
        preferredDays,
        preferredTimeSlots,
        notes
      } = req.body;

      // Verifica che preferredBarber sia presente
      if (!preferredBarber) {
        return res.status(400).json({
          message: 'Il barbiere è obbligatorio',
          receivedData: req.body
        });
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const waitingListEntry = new WaitingList({
        client: req.user._id,
        preferredBarber,
        service,
        preferredDays,
        preferredTimeSlots,
        notes,
        expiryDate
      });

      // Debug log per vedere l'oggetto prima del salvataggio
      console.log('WaitingList entry before save:', waitingListEntry);

      await waitingListEntry.save();

      // Invia email al cliente
      const clientMailOptions = {
        from: process.env.SMTP_USER,
        to: req.user.email,
        subject: 'Conferma richiesta lista d\'attesa',
        html: `
          <h1>Richiesta Lista d'Attesa Confermata</h1>
          <p>Gentile ${req.user.firstName},</p>
          <p>La tua richiesta per il servizio "${service}" è stata registrata con successo.</p>
          <p>Ti contatteremo quando si libererà uno slot compatibile con le tue preferenze.</p>
          <p>Dettagli della richiesta:</p>
          <ul>
            <li>Servizio: ${service}</li>
            <li>Giorni preferiti: ${preferredDays.join(', ')}</li>
            <li>Fasce orarie: ${preferredTimeSlots.join(', ')}</li>
          </ul>
          <p>La richiesta scadrà il: ${expiryDate.toLocaleDateString()}</p>
        `
      };

      // Invia email all'amministratore
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.BARBER_EMAIL,
        subject: 'Nuova richiesta lista d\'attesa',
        html: `
          <h1>Nuova Richiesta Lista d'Attesa</h1>
          <p>È stata ricevuta una nuova richiesta di lista d'attesa.</p>
          <p>Dettagli cliente:</p>
          <ul>
            <li>Nome: ${req.user.firstName} ${req.user.lastName}</li>
            <li>Email: ${req.user.email}</li>
            <li>Telefono: ${req.user.phone}</li>
          </ul>
          <p>Dettagli richiesta:</p>
          <ul>
            <li>Servizio: ${service}</li>
            <li>Giorni preferiti: ${preferredDays.join(', ')}</li>
            <li>Fasce orarie: ${preferredTimeSlots.join(', ')}</li>
          </ul>
          <p>Note: ${notes || 'Nessuna nota'}</p>
        `
      };

      try {
        // Invia entrambe le email in parallelo
        await Promise.all([
          transporter.sendMail(clientMailOptions),
          transporter.sendMail(adminMailOptions)
        ]);
        console.log('Email di notifica inviate con successo');
      } catch (emailError) {
        console.error('Errore nell\'invio delle email:', emailError);
        // Continuiamo anche se l'invio delle email fallisce
      }

      res.status(201).json(waitingListEntry);
    } catch (error) {
      console.error('Error in addToWaitingList:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Ottiene le entry della lista d'attesa dell'utente
  async getUserWaitingList(req, res) {
    try {
      const entries = await WaitingList.find({
        client: req.user._id,
        status: { $in: ['pending', 'notified'] }
      })
      .populate('preferredBarber', 'firstName lastName')
      .sort({ requestDate: -1 });

      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Ottiene tutte le entry (solo admin)
 // Ottiene tutte le entry (solo admin)
 async getAllWaitingList(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Modifichiamo la query per popolare correttamente il campo preferredBarber
    const entries = await WaitingList.find()
      .populate('client', 'firstName lastName email phone')
      .populate('preferredBarber', 'firstName lastName') // Assicuriamoci di popolare questo campo
      .sort({ requestDate: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

  // Controlla disponibilità per le entry in lista d'attesa
  async checkAvailability(req, res) {
    try {
      const pendingEntries = await WaitingList.find({
        status: 'pending'
      }).populate('client preferredBarber');

      const availabilityChecks = [];

      for (const entry of pendingEntries) {
        // Controlla disponibilità per i prossimi 7 giorni
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        // Implementa la logica di controllo disponibilità qui
        const availableSlots = []; // Popola con gli slot disponibili trovati

        if (availableSlots.length > 0) {
          // Notifica il cliente della disponibilità
          try {
            await notificationService.notifyClientAvailability(entry.client, availableSlots);
            entry.status = 'notified';
            entry.notificationsSent.push({
              date: new Date(),
              type: 'availability',
              success: true,
              message: 'Slot disponibili trovati'
            });
            await entry.save();
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }

        availabilityChecks.push({
          entry: entry._id,
          availableSlots
        });
      }

      res.json({ checks: availabilityChecks });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Cancella una entry dalla lista d'attesa
  async removeFromWaitingList(req, res) {
    try {
      const entry = await WaitingList.findById(req.params.id);

      if (!entry) {
        return res.status(404).json({ message: 'Entry non trovata' });
      }

      if (req.user.role !== 'admin' && entry.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Non autorizzato' });
      }

      entry.status = 'cancelled';
      await entry.save();

      res.json({ message: 'Rimosso dalla lista d\'attesa' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export default waitingListController;
