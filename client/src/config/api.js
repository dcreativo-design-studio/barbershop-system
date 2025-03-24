import axios from 'axios';

// Configurazione base per le richieste API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourstyle.dcreativo.ch/api';

// Configurazione di base di axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // timeout di 30 secondi
});

export const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
    'x-timezone': timezone
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Configura gli interceptors
axiosInstance.interceptors.request.use(
  (config) => {
    // Aggiungi headers di default
    config.headers = {
      ...config.headers,
      ...getHeaders(config.data instanceof FormData)
    };

    // Log in development
    if (import.meta.env.DEV) {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Log dettagliato dell'errore
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    return Promise.reject(error);
  }
);

// API calls di base
export const apiRequest = {
  get: async (endpoint, config = {}) => {
    try {
      const response = await axiosInstance.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  post: async (endpoint, data, config = {}) => {
    try {
      const response = await axiosInstance.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  put: async (endpoint, data, config = {}) => {
    try {
      const response = await axiosInstance.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  delete: async (endpoint, config = {}) => {
    try {
      const response = await axiosInstance.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// API specifiche per i servizi
export const servicesApi = {
  getActiveServices: () => apiRequest.get('/services/active'),
  validateService: (serviceName) => apiRequest.post('/services/validate', { serviceName }),
  createService: (serviceData) => apiRequest.post('/services', serviceData),
  updateService: (serviceId, serviceData) => apiRequest.put(`/services/${serviceId}`, serviceData)
};

// API specifiche per i barbieri
export const barberApi = {
  updateBarberServices: (barberId, services) =>
    apiRequest.put(`/barbers/${barberId}/services`, { services }),

  updateBarberWorkingHours: (barberId, workingHours) =>
    apiRequest.put(`/barbers/${barberId}/working-hours`, {
      workingHours: workingHours.map(hours => ({
        ...hours,
        breakStart: hours.hasBreak ? hours.breakStart : null,
        breakEnd: hours.hasBreak ? hours.breakEnd : null
      }))
    }),

  getBarberAvailability: async (barberId, date, duration) => {
    if (!barberId || !date || !duration) {
      throw new Error('Parametri mancanti per la richiesta di disponibilità');
    }

    const queryParams = new URLSearchParams({
      barberId: barberId.toString(),
      date: date.toString(),
      duration: duration.toString()
    });

    const [barberResponse, slotsResponse] = await Promise.all([
      apiRequest.get(`/barbers/${barberId}`),
      apiRequest.get(`/appointments/public/available-slots?${queryParams}`)
    ]);

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = barberResponse.workingHours?.find(h => h.day === dayOfWeek);

    return slotsResponse.map(slot => ({
      ...slot,
      workingHours: {
        hasBreak: workingHours?.hasBreak || false,
        breakStart: workingHours?.breakStart || null,
        breakEnd: workingHours?.breakEnd || null
      }
    }));
  },

  updateBarberVacations: (barberId, vacations) =>
    apiRequest.put(`/barbers/${barberId}/vacations`, { vacations }),

  checkVacation: (barberId, date) =>
    apiRequest.get(`/barbers/${barberId}/check-vacation`, { params: { date } })
};

export default apiRequest;
