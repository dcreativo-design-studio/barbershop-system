import React, { useEffect, useState } from 'react';
import { servicesApi } from '../../config/api';

function ServiceManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await servicesApi.getActiveServices();
      setServices(response);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Errore nel caricamento dei servizi');
    } finally {
      setLoading(false);
    }
  };

  const handleNewServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await servicesApi.createService(newService);
      setServices([...services, response]);
      setNewService({ name: '', price: '', duration: '', description: '' });
    } catch (err) {
      console.error('Error creating service:', err);
      setError(err.message || 'Errore nella creazione del servizio');
    }
  };

  const handleUpdateService = async (id) => {
    try {
      setError('');
      const response = await servicesApi.updateService(id, editingService);
      setServices(services.map(service =>
        service._id === id ? response : service
      ));
      setEditingService(null);
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err.message || 'Errore nell\'aggiornamento del servizio');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo servizio?')) return;

    try {
      setError('');
      await apiRequest.delete(`/admin/services/${id}`);
      setServices(services.filter(service => service._id !== id));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message || 'Errore nell\'eliminazione del servizio');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--accent)]">
        Gestione Servizi
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form nuovo servizio */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Aggiungi Nuovo Servizio</h3>
        <form onSubmit={handleNewServiceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome servizio"
              value={newService.name}
              onChange={(e) => setNewService({...newService, name: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
            <input
              type="number"
              placeholder="Prezzo CHF"
              value={newService.price}
              onChange={(e) => setNewService({...newService, price: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Durata (minuti)"
              value={newService.duration}
              onChange={(e) => setNewService({...newService, duration: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
              min="0"
            />
            <input
              type="text"
              placeholder="Descrizione"
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            className="bg-[var(--accent)] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity w-full md:w-auto"
          >
            Aggiungi Servizio
          </button>
        </form>
      </div>

      {/* Lista servizi */}
      <div className="space-y-4">
        {services.map(service => (
          <div
            key={service._id}
            className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-lg"
          >
            {editingService?.id === service._id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingService.name}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      name: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                  />
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      price: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      duration: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    min="0"
                  />
                  <input
                    type="text"
                    value={editingService.description}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      description: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleUpdateService(service._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setEditingService(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-[var(--text-secondary)]">
                    CHF {service.price.toFixed(2)} • {service.duration} min
                  </p>
                  {service.description && (
                    <p className="text-sm mt-1 text-[var(--text-secondary)]">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingService({...service, id: service._id})}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="text-red-500 hover:text-red-600 font-medium"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && !loading && (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            Nessun servizio disponibile. Aggiungine uno nuovo!
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceManager;
