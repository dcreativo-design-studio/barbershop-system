import { apiRequest } from '../config/api';

export const waitingListService = {
  addEntry: async (entryData) => {
    try {
      // Debug log per vedere i dati prima della richiesta
      console.log('Data to be sent to API:', entryData);

      const response = await apiRequest.post('/waiting-list', {
        ...entryData,
        preferredBarber: entryData.preferredBarber // Assicuriamoci che questo campo sia presente
      });

      // Debug log per vedere la risposta
      console.log('API Response:', response);

      return response;
    } catch (error) {
      console.error('Error in addEntry:', error);
      throw error;
    }
  },

  getUserEntries: async () => {
    try {
      console.log('Fetching user waiting list entries');
      const response = await apiRequest.get('/waiting-list/my-entries');
      console.log('Received entries:', response);
      return response;
    } catch (error) {
      console.error('Error fetching waiting list entries:', error);
      throw new Error(error.message || 'Errore nel caricamento della lista d\'attesa');
    }
  },


  removeEntry: async (entryId) => {
    try {
      console.log('Removing entry:', entryId);
      const response = await apiRequest.delete(`/waiting-list/${entryId}`);
      console.log('Entry removed successfully:', response);
      return response;
    } catch (error) {
      console.error('Error removing waiting list entry:', error);
      throw new Error(error.message || 'Errore nella rimozione dalla lista d\'attesa');
    }
  }
};

export default waitingListService;
