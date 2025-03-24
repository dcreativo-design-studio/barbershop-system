import { apiRequest } from './api';

export const adminApi = {
  getStats: async (timeframe = 'month', barberId = 'all') => {
    try {
      // Costruisci i parametri della query
      const params = {
        timeframe,
        ...(barberId !== 'all' && { barberId })
      };

      console.log('Requesting stats with params:', params);

      const response = await apiRequest.get('/admin/stats', { params });
      console.log('Stats API response:', response);

      return response;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  getBarbers: async () => {
    try {
      const response = await apiRequest.get('/barbers');
      console.log('Barbers API response:', response);
      return Array.isArray(response.data) ? response.data : response;
    } catch (error) {
      console.error('Error fetching barbers:', error);
      return [];
    }
  },

  // Altri metodi esistenti per l'admin API...
  getAllUsers: async () => {
    try {
      const response = await apiRequest.get('/admin/users');
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await apiRequest.put(`/admin/users/${userId}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
};
