import { sendEmail } from '../services/emailService.js';

/**
 * Crea il contenuto HTML per l'email di richiesta demo
 */
const createDemoRequestEmail = (data) => {
  return `
  <!DOCTYPE html>
  <html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Richiesta Demo - Sistema di Prenotazioni Barber Shop</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #3b82f6, #4f46e5);
        color: #fff;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
      .header p {
        margin: 10px 0 0;
        font-size: 16px;
        opacity: 0.9;
      }
      .content {
        padding: 30px 20px;
      }
      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: #3b82f6;
        margin-top: 0;
        margin-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .data-table td {
        padding: 10px;
        vertical-align: top;
      }
      .data-table .label {
        width: 35%;
        font-weight: bold;
        color: #4b5563;
      }
      .data-table .value {
        width: 65%;
      }
      .message-box {
        background-color: #f3f4f6;
        border-radius: 6px;
        padding: 15px;
        margin-top: 10px;
      }
      .message-content {
        white-space: pre-line;
      }
      .cta {
        text-align: center;
        margin: 30px 0 10px;
      }
      .cta-button {
        display: inline-block;
        background-color: #3b82f6;
        color: #ffffff;
        font-weight: bold;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 6px;
        text-align: center;
      }
      .footer {
        background-color: #f3f4f6;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #6b7280;
      }
      .footer p {
        margin: 5px 0;
      }
      .social-links {
        margin-top: 10px;
      }
      .social-links a {
        color: #3b82f6;
        text-decoration: none;
        margin: 0 10px;
      }
      .copyright {
        margin-top: 15px;
        font-size: 13px;
      }
      .highlight {
        color: #3b82f6;
        font-weight: bold;
      }
      .offer-badge {
        display: inline-block;
        background-color: #065f46;
        color: white;
        font-size: 12px;
        font-weight: bold;
        padding: 5px 10px;
        border-radius: 20px;
        margin-top: 10px;
      }
      @media screen and (max-width: 550px) {
        .header {
          padding: 20px 15px;
        }
        .content {
          padding: 20px 15px;
        }
        .data-table .label {
          width: 40%;
        }
        .data-table .value {
          width: 60%;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Nuova Richiesta di Demo</h1>
        <p>Sistema di Prenotazioni per Barber Shop</p>
      </div>

      <div class="content">
        <h2 class="section-title">Informazioni Cliente</h2>
        <table class="data-table">
          <tr>
            <td class="label">Nome:</td>
            <td class="value">${data.name}</td>
          </tr>
          <tr>
            <td class="label">Email:</td>
            <td class="value">${data.email}</td>
          </tr>
          <tr>
            <td class="label">Telefono:</td>
            <td class="value">${data.phone}</td>
          </tr>
          <tr>
            <td class="label">Nome Salone:</td>
            <td class="value">${data.salonName || 'Non specificato'}</td>
          </tr>
        </table>

        <h2 class="section-title">Messaggio</h2>
        <div class="message-box">
          <p class="message-content">${data.message || 'Nessun messaggio aggiuntivo.'}</p>
        </div>

        <div class="cta">
          <span class="offer-badge">Offerta Speciale: Sconto 10%</span>
          <p>Questa richiesta è stata inviata dalla pagina di marketing del sistema di prenotazioni.</p>
          <a href="mailto:${data.email}" class="cta-button">Rispondi al Cliente</a>
        </div>
      </div>

      <div class="footer">
        <p><span class="highlight">DCreativo Solutions</span></p>
        <p>Sviluppo Web & App Personalizzati</p>
        <div class="social-links">
          <a href="mailto:info@dcreativo.ch">Email</a> |
          <a href="tel:+41767810194">Telefono</a> |
          <a href="https://www.dcreativo.ch">Website</a>
        </div>
        <p class="copyright">&copy; ${new Date().getFullYear()} DCreativo Solutions. Tutti i diritti riservati.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Crea il contenuto HTML per l'email di conferma al cliente
 */
const createConfirmationEmailToCustomer = (data) => {
  return `
  <!DOCTYPE html>
  <html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma Richiesta Demo - Sistema di Prenotazioni Barber Shop</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #3b82f6, #4f46e5);
        color: #fff;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
      .header p {
        margin: 10px 0 0;
        font-size: 16px;
        opacity: 0.9;
      }
      .content {
        padding: 30px 20px;
      }
      .thank-you {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #3b82f6;
      }
      .next-steps {
        background-color: #f3f4f6;
        border-radius: 6px;
        padding: 20px;
        margin: 20px 0;
      }
      .next-steps h3 {
        margin-top: 0;
        color: #374151;
      }
      .next-steps ol {
        margin-bottom: 0;
        padding-left: 20px;
      }
      .next-steps li {
        margin-bottom: 10px;
      }
      .feature-list {
        margin: 20px 0;
      }
      .feature-item {
        display: flex;
        margin-bottom: 15px;
      }
      .feature-icon {
        width: 24px;
        color: #3b82f6;
        margin-right: 10px;
        font-weight: bold;
      }
      .footer {
        background-color: #f3f4f6;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #6b7280;
      }
      .footer p {
        margin: 5px 0;
      }
      .social-links {
        margin-top: 10px;
      }
      .social-links a {
        color: #3b82f6;
        text-decoration: none;
        margin: 0 10px;
      }
      .copyright {
        margin-top: 15px;
        font-size: 13px;
      }
      .cta-button {
        display: inline-block;
        background-color: #3b82f6;
        color: #ffffff;
        font-weight: bold;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 6px;
        margin-top: 20px;
      }
      @media screen and (max-width: 550px) {
        .header {
          padding: 20px 15px;
        }
        .content {
          padding: 20px 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Conferma Richiesta Demo</h1>
        <p>Sistema di Prenotazioni per Barber Shop</p>
      </div>

      <div class="content">
        <p class="thank-you">Gentile ${data.name},</p>

        <p>Grazie per aver richiesto una demo del nostro Sistema di Prenotazioni per Barber Shop. Abbiamo ricevuto la tua richiesta e ti contatteremo il prima possibile per organizzare una presentazione personalizzata.</p>

        <div class="next-steps">
          <h3>Prossimi Passi:</h3>
          <ol>
            <li>Un nostro consulente ti contatterà entro 24 ore lavorative</li>
            <li>Organizzeremo una demo personalizzata in base alle tue esigenze</li>
            <li>Ti presenteremo tutte le funzionalità e risponderemo alle tue domande</li>
            <li>Riceverai un'offerta personalizzata con uno sconto dedicato</li>
          </ol>
        </div>

        <p>Nel frattempo, puoi dare un'occhiata alla nostra demo live per farti un'idea delle funzionalità del sistema:</p>

        <div style="text-align: center;">
          <a href="https://barbershop.dcreativo.ch/" class="cta-button">Vedi Demo Live</a>
        </div>

        <h3 style="margin-top: 30px;">Principali Funzionalità:</h3>

        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>Sistema di prenotazione intelligente con calcolo automatico degli slot</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>Notifiche automatiche via email, SMS e WhatsApp</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>Dashboard con statistiche e analytics</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>Gestione multi-livello per amministratori, barbieri e clienti</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✓</div>
            <div>Protezione dei dati in conformità con le normative sulla privacy</div>
          </div>
        </div>

        <p>Se hai domande immediate, non esitare a contattarci rispondendo a questa email o chiamandoci al numero +41 76 781 01 94.</p>

        <p>Cordiali saluti,<br>
        Il team di DCreativo Solutions</p>
      </div>

      <div class="footer">
        <p><strong>DCreativo Solutions</strong></p>
        <p>Sviluppo Web & App Personalizzati</p>
        <div class="social-links">
          <a href="mailto:info@dcreativo.ch">Email</a> |
          <a href="tel:+41767810194">Telefono</a> |
          <a href="https://www.dcreativo.ch">Website</a>
        </div>
        <p class="copyright">&copy; ${new Date().getFullYear()} DCreativo Solutions. Tutti i diritti riservati.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const contactController = {
  /**
   * Gestisce l'invio di email dal form di contatto
   */
  async sendContactEmail(req, res) {
    try {
      const { name, email, phone, interest, message } = req.body;

      // Validazione dei dati
      if (!name || !email || !phone || !interest || !message) {
        return res.status(400).json({
          success: false,
          message: 'Tutti i campi sono obbligatori'
        });
      }

      // Mappa dei testi per il tipo di interesse
      const interestText = {
        'booking': 'Sistema di Prenotazioni',
        'booking-demo': 'Demo Sistema di Prenotazioni',
        'website': 'Sito Web',
        'webapp': 'Applicazione Web',
        'ecommerce': 'E-commerce',
        'other': 'Altro'
      };

      // Preparazione del contenuto email in base al tipo di richiesta
      let htmlContent, textContent, subject;

      // Se è una richiesta di demo, usa il template specifico
      if (interest === 'booking-demo') {
        // Estrai il nome del salone dal messaggio
        let salonName = 'Non specificato';
        if (message.includes('Nome salone:')) {
          const match = message.match(/Nome salone:\s*([^\n]*)/);
          if (match && match[1]) {
            salonName = match[1].trim();
          }
        }

        const demoRequestData = {
          name,
          email,
          phone,
          salonName,
          message: message.replace(/Nome salone:[^\n]*\n?/, '').trim()
        };

        htmlContent = createDemoRequestEmail(demoRequestData);
        subject = `Nuova richiesta di demo: ${name} - ${salonName}`;

        textContent = `
          Nuova richiesta di demo

          Nome: ${name}
          Email: ${email}
          Telefono: ${phone}
          Nome salone: ${salonName}

          Messaggio:
          ${message}

          Questa richiesta è stata inviata dalla pagina di marketing del sistema di prenotazioni.
        `;
      } else {
        // Per altre richieste, usa il template standard
        htmlContent = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0; font-size: 24px;">Nuova richiesta di informazioni</h2>
            </div>
            <div style="padding: 20px;">
              <p>È stata ricevuta una nuova richiesta di informazioni dal sito web.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefono:</strong> ${phone}</p>
                <p><strong>Interesse:</strong> ${interestText[interest] || interest}</p>
                <p><strong>Messaggio:</strong></p>
                <p style="white-space: pre-line;">${message}</p>
              </div>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p>Email generata automaticamente dal form di contatto</p>
              <p>&copy; ${new Date().getFullYear()} DCreativo Solutions</p>
            </div>
          </div>
        `;

        subject = `Nuova richiesta di informazioni: ${interestText[interest] || interest}`;

        textContent = `
          Nuova richiesta di informazioni

          Nome: ${name}
          Email: ${email}
          Telefono: ${phone}
          Interesse: ${interestText[interest] || interest}

          Messaggio:
          ${message}

          Email generata automaticamente dal form di contatto.
        `;
      }

      // Invia l'email usando il servizio emailService esistente
      await sendEmail({
        to: 'info@dcreativo.ch',
        subject,
        text: textContent,
        html: htmlContent
      });

      // Invia anche un'email di conferma al mittente
      let confirmationHtml;

      if (interest === 'booking-demo') {
        const demoData = {
          name,
          email,
          phone
        };
        confirmationHtml = createConfirmationEmailToCustomer(demoData);
      } else {
        confirmationHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0; font-size: 24px;">Conferma richiesta ricevuta</h2>
            </div>
            <div style="padding: 20px;">
              <p>Gentile ${name},</p>
              <p>Grazie per averci contattato. Abbiamo ricevuto la tua richiesta di informazioni su ${interestText[interest] || interest}.</p>
              <p>Ti risponderemo il prima possibile all'indirizzo email o al numero di telefono che ci hai fornito.</p>
              <p>Cordiali saluti,<br>Il team di DCreativo Solutions</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p>DCreativo Solutions</p>
              <p>Email: info@dcreativo.ch | Tel: +41 76 781 01 94</p>
              <p><a href="https://www.dcreativo.ch" style="color: #3b82f6; text-decoration: none;">www.dcreativo.ch</a></p>
              <p>&copy; ${new Date().getFullYear()} DCreativo Solutions</p>
            </div>
          </div>
        `;
      }

      try {
        await sendEmail({
          to: email,
          subject: interest === 'booking-demo'
            ? 'Conferma richiesta demo - Sistema di Prenotazioni'
            : 'Conferma richiesta informazioni - DCreativo Solutions',
          text: `Gentile ${name}, grazie per averci contattato. Abbiamo ricevuto la tua richiesta e ti risponderemo il prima possibile.`,
          html: confirmationHtml
        });
      } catch (emailError) {
        console.error('Errore invio email di conferma al cliente:', emailError);
        // Non blocchiamo la risposta se l'email di conferma fallisce
      }

      res.status(200).json({
        success: true,
        message: 'Email inviata con successo'
      });
    } catch (error) {
      console.error('Errore invio email di contatto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'invio dell\'email',
        error: error.message
      });
    }
  }
};

export default contactController;
