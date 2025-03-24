import { useCallback, useEffect } from 'react';
import { apiRequest } from '../../config/api';

function ServiceSync({ onServicesUpdate }) {
  const syncServices = useCallback(async () => {
    try {
      const response = await apiRequest.get('/services/active');
      if (response && Array.isArray(response)) {
        onServicesUpdate(response);
      }
    } catch (error) {
      console.error('Error syncing services:', error);
    }
  }, [onServicesUpdate]);

  useEffect(() => {
    syncServices();

    // Imposta un intervallo per sincronizzare i servizi ogni minuto
    const intervalId = setInterval(syncServices, 60000);

    return () => clearInterval(intervalId);
  }, [syncServices]);

  return null; // Componente senza render
}

export default ServiceSync;

// Uso in BarberManager.jsx
function BarberManager() {
  const [services, setServices] = useState([]);

  const handleServicesUpdate = useCallback((updatedServices) => {
    setServices(updatedServices);
  }, []);

  return (
    <div>
      <ServiceSync onServicesUpdate={handleServicesUpdate} />
      {/* Resto del componente */}
    </div>
  );
}
