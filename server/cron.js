import { processConfirmations, processReminders } from '../services/appointmentScheduler.js';

export default async function handler(req, res) {
  try {
    console.log('Esecuzione cron job Vercel:', new Date().toISOString());

    // Verifica l'autenticazione se necessario
    const authHeader = req.headers.authorization;
    const expectedAuth = process.env.CRON_SECRET ?
      `Bearer ${process.env.CRON_SECRET}` :
      undefined;

    // Se è configurato un segreto, controlla che corrisponda
    if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
      console.error('Autenticazione cron fallita');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Permetti l'accesso se la richiesta proviene dal servizio cron di Vercel
    if (req.headers['x-vercel-cron'] === 'true') {
      console.log('Richiesta autorizzata da Vercel Cron');
    }

    // Elabora i promemoria
    const reminderResults = await processReminders();

    // Elabora le conferme automatiche
    const confirmationResults = await processConfirmations();

    // Restituisci i risultati
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      reminders: reminderResults,
      confirmations: confirmationResults
    });
  } catch (error) {
    console.error('Errore nell\'esecuzione del cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
