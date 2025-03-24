import { AlertCircle, Check, Clock, DollarSign, Plus, Scissors } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { servicesApi } from '../../config/api';
import { barberApi } from '../../config/barberApi';

function BarberServices({ barberId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barber, setBarber] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Aggiungi un intervallo di polling per aggiornare i servizi
  useEffect(() => {
    // Funzione di fetch iniziale
    fetchData();

    // Imposta un intervallo per controllare gli aggiornamenti
    const interval = setInterval(fetchData, 30000); // Controlla ogni 30 secondi

    // Cleanup dell'intervallo quando il componente viene smontato
    return () => clearInterval(interval);
  }, [barberId]);

  // Modifica fetchData per gestire gli aggiornamenti senza disturbare la selezione dell'utente
  const fetchData = async () => {
    try {
      // Carica i dati del barbiere
      const barberData = await barberApi.getBarberDetails(barberId);

      // Carica tutti i servizi disponibili
      const servicesData = await servicesApi.getActiveServices();

      // Aggiorna i servizi selezionati solo se non ci sono modifiche pendenti
      if (!hasChanges) {
        setSelectedServices(barberData.services || []);
      }

      // Aggiorna sempre la lista dei servizi disponibili
      setAvailableServices(servicesData);

      setBarber(barberData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Non mostrare l'errore per gli aggiornamenti automatici
      if (loading) {
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceName) => {
    const updatedServices = selectedServices.includes(serviceName)
      ? selectedServices.filter(s => s !== serviceName)
      : [...selectedServices, serviceName];

    setSelectedServices(updatedServices);
    setHasChanges(true);
  };

  const handleSaveServices = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Verifica che sia selezionato almeno un servizio
      if (selectedServices.length === 0) {
        setError('Seleziona almeno un servizio.');
        setSaving(false);
        return;
      }

      // Salva i servizi selezionati
      await barberApi.updateBarberServices(barberId, selectedServices);

      setSuccess('Servizi aggiornati con successo!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving services:', error);
      setError('Errore durante il salvataggio dei servizi. Riprova più tardi.');
    } finally {
      setSaving(false);

      // Nascondi il messaggio di successo dopo 3 secondi
      if (success) {
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">Dati del barbiere non trovati. Ricarica la pagina o contatta l'amministratore.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--accent)]">
          Gestione Servizi
        </h2>

        {hasChanges && (
          <button
            onClick={handleSaveServices}
            disabled={saving}
            className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salva
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500 text-white p-4 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Lista dei servizi */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Scissors className="w-5 h-5 mr-2" />
          Servizi Disponibili
        </h3>

        {availableServices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Scissors className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nessun servizio disponibile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableServices.map(service => (
              <div
                key={service._id}
                className={`bg-[var(--bg-secondary)] p-4 rounded-lg border-2 transition-colors ${
                  selectedServices.includes(service.name)
                    ? 'border-[var(--accent)]'
                    : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{service.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>CHF {service.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                    {service.description && (
                      <p className="mt-2 text-sm">{service.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleServiceToggle(service.name)}
                    className={`ml-2 p-2 rounded-full ${
                      selectedServices.includes(service.name)
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {selectedServices.includes(service.name) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BarberServices;
