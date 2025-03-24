import { apiRequest } from '../config/api';

export const barberApi = {
  // Ottiene i dettagli di un barbiere specifico
  getBarberDetails: async (barberId) => {
    try {
      const response = await apiRequest.get(`/barbers/${barberId}`);
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error fetching barber details:', error);
      throw error;
    }
  },

  // Trova un barbiere per email
  findBarberByEmail: async (email) => {
    try {
      const response = await apiRequest.get('/barbers/find-by-email', {
        params: { email }
      });
      return response.data ? response.data : response; // Gestisce entrambi i possibili formati di risposta
    } catch (error) {
      console.error('Error finding barber by email:', error);
      throw error;
    }
  },

  // Ottiene gli appuntamenti di un barbiere - METODO ORIGINALE
  getBarberAppointments: async (barberId, startDate, endDate) => {
    try {
      const response = await apiRequest.get(`/appointments/calendar/barber/${barberId}`, {
        params: { startDate, endDate }
      });
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error fetching barber appointments:', error);
      return []; // Restituisce un array vuoto invece di propagare l'errore
    }
  },

  // NUOVO METODO - Ottiene gli appuntamenti dal cliente
  getBarberAppointmentsFromClient: async (barberId, startDate, endDate) => {
    try {
      // Convert dates to YYYY-MM-DD format for client API
      const formattedStartDate = typeof startDate === 'string' ? startDate.split('T')[0] : new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = typeof endDate === 'string' ? endDate.split('T')[0] : new Date(endDate).toISOString().split('T')[0];

      // Ottieni gli appuntamenti dal client per questo barbiere
      const response = await apiRequest.get('/appointments/my-appointments');

      console.log('My appointments response:', response);

      // Filtra gli appuntamenti per questo barbiere e nell'intervallo di date
      if (Array.isArray(response)) {
        const filteredAppointments = response.filter(app => {
          if (!app.date || !app.barber) return false;

          // Verifica che il barbiere sia quello richiesto
          const isCorrectBarber = app.barber === barberId ||
                                 (app.barber && app.barber._id === barberId);

          // Verifica che la data sia nell'intervallo
          const appDate = new Date(app.date);
          const start = new Date(formattedStartDate);
          const end = new Date(formattedEndDate);
          end.setHours(23, 59, 59, 999); // Imposta alla fine della giornata

          const isInDateRange = appDate >= start && appDate <= end;

          return isCorrectBarber && isInDateRange;
        });

        return filteredAppointments;
      }

      return [];
    } catch (error) {
      console.error('Error fetching barber appointments from client:', error);
      return []; // Restituisce un array vuoto in caso di errore
    }
  },

  // Aggiorna gli orari di lavoro di un barbiere
  updateBarberWorkingHours: async (barberId, workingHours) => {
    try {
      // Assicuriamoci che gli orari siano formattati correttamente
      const formattedWorkingHours = workingHours.map(hours => ({
        day: hours.day,
        isWorking: Boolean(hours.isWorking),
        startTime: hours.startTime || '',
        endTime: hours.endTime || '',
        hasBreak: Boolean(hours.hasBreak),
        breakStart: hours.hasBreak ? (hours.breakStart || '') : null,
        breakEnd: hours.hasBreak ? (hours.breakEnd || '') : null
      }));

      console.log('Sending working hours update:', { barberId, workingHours: formattedWorkingHours });

      // URL CORRETTO: usa solo /barbers/ senza il prefisso /api/
      const response = await apiRequest.put(`/barbers/${barberId}/working-hours`, {
        workingHours: formattedWorkingHours
      });

      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error updating barber working hours:', error);

      // Log più dettagliato per debug
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }

      throw error;
    }
  },

  // Aggiorna le vacanze di un barbiere
  updateBarberVacations: async (barberId, vacations) => {
    try {
      // Assicuriamoci che le vacanze siano formattate correttamente
      const formattedVacations = vacations.map(vacation => ({
        startDate: vacation.startDate,
        endDate: vacation.endDate
      }));

      // URL CORRETTO: usa solo /barbers/ senza il prefisso /api/
      const response = await apiRequest.put(`/barbers/${barberId}/vacations`, {
        vacations: formattedVacations
      });

      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error updating barber vacations:', error);

      // Log più dettagliato per debug
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }

      throw error;
    }
  },

  // Aggiorna i servizi di un barbiere
  updateBarberServices: async (barberId, services) => {
    try {
      const response = await apiRequest.put(`/barbers/${barberId}/services`, { services });
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error updating barber services:', error);
      throw error;
    }
  },

  // Aggiorna il profilo di un barbiere
  updateBarberProfile: async (barberId, profileData) => {
    try {
      const response = await apiRequest.put(`/barbers/${barberId}`, profileData);
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error updating barber profile:', error);
      throw error;
    }
  },

  // Notifica l'amministratore delle modifiche all'orario
  notifyScheduleUpdate: async (barberId) => {
    try {
      const response = await apiRequest.post(`/notifications/schedule-update`, { barberId });
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error sending schedule update notification:', error);
      throw error;
    }
  },

  // Cambia la password dell'utente
  changePassword: async ({ userId, currentPassword, newPassword }) => {
    try {
      const response = await apiRequest.post('/auth/change-password', {
        userId,
        currentPassword,
        newPassword
      });
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Ottiene le statistiche di un barbiere
  getBarberStats: async (barberId, timeframe = 'month') => {
    try {
      const response = await apiRequest.get(`/barbers/${barberId}/stats`, {
        params: { timeframe }
      });
      return response.data ? response.data : response;
    } catch (error) {
      console.error('Error fetching barber stats:', error);
      throw error;
    }
  }
};

export default barberApi;
