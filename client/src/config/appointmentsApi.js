import { apiRequest } from './api';

export const appointmentsApi = {
  getAvailableSlots: async (date, barberId, duration, serviceId) => {
    try {
      // Debug log prima della chiamata
      console.log('appointmentsApi getAvailableSlots called with:', {
        date,
        barberId,
        duration,
        serviceId
      });

      // Validazione parametri
      if (!date || !barberId || !duration) {
        console.error('Missing parameters:', { date, barberId, duration });
        throw new Error('Parametri mancanti per la richiesta degli slot');
      }

      // Costruisci i parametri della query
      const params = new URLSearchParams({
        date,
        barberId,
        duration,
        ...(serviceId && { serviceId })
      });

      const url = `/appointments/public/available-slots?${params}`;
      console.log('Making request to:', url);

      const response = await apiRequest.get(url);
      console.log('Response received:', response);

      return response;
    } catch (error) {
      console.error('getAvailableSlots error:', error);
      throw new Error(error.response?.data?.message || 'Errore nel caricamento degli slot disponibili');
    }
  },


  // Crea un nuovo appuntamento
  createAppointment: async (appointmentData) => {
    try {
      console.log('Creating appointment with:', appointmentData);
      const response = await apiRequest.post('/appointments', appointmentData);
      return response;
    } catch (error) {
      console.error('createAppointment error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Errore nella creazione dell\'appuntamento');
    }
  },

  // Altri metodi rimangono invariati
  cancelAppointment: async (appointmentId, data = {}) => {
    try {
      const response = await apiRequest.put(`/appointments/${appointmentId}/cancel`, data);
      return response;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error(error.response?.data?.message || 'Errore nella cancellazione dell\'appuntamento');
    }
  },

  // Aggiorna il metodo getMyAppointments per includere più informazioni
  getMyAppointments: async () => {
    try {
      const response = await apiRequest.get('/appointments/my-appointments');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new Error('Errore nel caricamento dei tuoi appuntamenti');
    }
  },
  updateAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await apiRequest.put(`/appointments/${appointmentId}`, appointmentData);
      return response;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }
};
