import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AlertCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { waitingListService } from '../services/waitingListService';

const WaitingList = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    selectedBarber: '',
    service: '',
    preferredDays: [],
    preferredTimeSlots: [],
    notes: ''
  });

  const timeSlots = [
    { id: 'morning', label: 'Mattina (9:00 - 12:00)' },
    { id: 'afternoon', label: 'Pomeriggio (13:00 - 17:00)' },
    { id: 'evening', label: 'Sera (17:00 - 19:00)' }
  ];

  const days = [
    { id: 'monday', label: 'Lunedì' },
    { id: 'tuesday', label: 'Martedì' },
    { id: 'wednesday', label: 'Mercoledì' },
    { id: 'thursday', label: 'Giovedì' },
    { id: 'friday', label: 'Venerdì' },
    { id: 'saturday', label: 'Sabato' }
  ];

  // Carica barbieri e servizi all'avvio
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/barbers/public`);
        if (!response.ok) throw new Error('Errore nel caricamento dei barbieri');
        const data = await response.json();
        setBarbers(data);
      } catch (error) {
        console.error('Error fetching barbers:', error);
        setError('Errore nel caricamento dei barbieri');
      }
    };

    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/active`);
        if (!response.ok) throw new Error('Errore nel caricamento dei servizi');
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Errore nel caricamento dei servizi');
      }
    };

    fetchBarbers();
    fetchServices();
  }, []);

  // Filtra i servizi disponibili in base al barbiere selezionato
  const getAvailableServices = () => {
    if (!formData.selectedBarber) return [];
    const selectedBarber = barbers.find(b => b._id === formData.selectedBarber);
    if (!selectedBarber) return [];
    return services.filter(service => selectedBarber.services.includes(service.name));
  };

  // Reset del servizio quando cambia il barbiere
  useEffect(() => {
    setFormData(prev => ({ ...prev, service: '' }));
  }, [formData.selectedBarber]);

  const fetchWaitingList = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await waitingListService.getUserEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError(error.message || 'Errore nel caricamento della lista d\'attesa');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.selectedBarber) {
      setError('Seleziona un barbiere');
      return;
    }

    if (submitting) return; // Previene invii multipli

    try {
      setSubmitting(true);

      const entryData = {
        preferredBarber: formData.selectedBarber,
        service: formData.service,
        preferredDays: formData.preferredDays,
        preferredTimeSlots: formData.preferredTimeSlots,
        notes: formData.notes
      };

      await waitingListService.addEntry(entryData);
      await fetchWaitingList();
      setSuccessMessage('Richiesta aggiunta con successo alla lista d\'attesa');

      // Resetta il form dopo 2 secondi per dare feedback visivo all'utente
      setTimeout(() => {
        setShowForm(false);
        setFormData({
          selectedBarber: '',
          service: '',
          preferredDays: [],
          preferredTimeSlots: [],
          notes: ''
        });
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Errore nell\'aggiunta alla lista d\'attesa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Sei sicuro di voler rimuovere questa richiesta dalla lista d\'attesa?')) {
      return;
    }

    try {
      setDeletingId(entryId);
      setError('');

      console.log('Tentativo di rimozione entry:', entryId);
      await waitingListService.removeEntry(entryId);

      console.log('Entry rimossa con successo');
      setSuccessMessage('Richiesta rimossa con successo');
      await fetchWaitingList();

      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);

      if (error.response) {
        switch (error.response.status) {
          case 403:
            setError('Non hai i permessi per eliminare questa richiesta');
            break;
          case 404:
            setError('Richiesta non trovata');
            break;
          case 405:
            setError('Operazione non permessa. Contatta l\'assistenza.');
            break;
          default:
            setError(error.response.data?.message || 'Errore durante l\'eliminazione della richiesta');
        }
      } else {
        setError(error.message || 'Errore durante l\'eliminazione della richiesta');
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Devi effettuare l'accesso per vedere la lista d'attesa.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--accent)]">Lista d'attesa</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[var(--accent)] text-white px-4 py-2 rounded hover:opacity-90 transition-all"
          >
            Aggiungi alla lista
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selezione Barbiere */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                Barbiere
              </label>
              <select
                value={formData.selectedBarber}
                onChange={(e) => setFormData({...formData, selectedBarber: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Seleziona un barbiere</option>
                {barbers.map(barber => (
                  <option key={barber._id} value={barber._id}>
                    {barber.firstName} {barber.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Selezione Servizio */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                Servizio
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
                required
                disabled={!formData.selectedBarber}
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Seleziona un servizio</option>
                {getAvailableServices().map(service => (
                  <option key={service._id} value={service.name}>
                    {service.name} - {service.duration} min - CHF{service.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                Giorni preferiti
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {days.map(day => (
                  <label key={day.id} className="flex items-center space-x-2 text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={formData.preferredDays.includes(day.id)}
                      onChange={(e) => {
                        const updatedDays = e.target.checked
                          ? [...formData.preferredDays, day.id]
                          : formData.preferredDays.filter(d => d !== day.id);
                        setFormData({...formData, preferredDays: updatedDays});
                      }}
                      className="rounded border-[var(--accent)] text-[var(--accent)]"
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                Fasce orarie preferite
              </label>
              <div className="space-y-2">
                {timeSlots.map(slot => (
                  <label key={slot.id} className="flex items-center space-x-2 text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={formData.preferredTimeSlots.includes(slot.id)}
                      onChange={(e) => {
                        const updatedSlots = e.target.checked
                          ? [...formData.preferredTimeSlots, slot.id]
                          : formData.preferredTimeSlots.filter(s => s !== slot.id);
                        setFormData({...formData, preferredTimeSlots: updatedSlots});
                      }}
                      className="rounded border-[var(--accent)] text-[var(--accent)]"
                    />
                    <span>{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                Note aggiuntive
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                rows="3"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  'Invia richiesta'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

{loading ? (
        <div className="text-center py-8 text-[var(--text-primary)]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Caricamento...
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry._id} className="bg-[var(--bg-secondary)] rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Servizio richiesto</h3>
                  <p>{entry.service}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Stato richiesta</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    entry.status === 'notified' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status === 'pending' ? 'In attesa' :
                     entry.status === 'notified' ? 'Slot disponibile' :
                     'Scaduta'}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Giorni preferiti</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.preferredDays.map(day => (
                      <span key={day} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {days.find(d => d.id === day)?.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Fasce orarie</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.preferredTimeSlots.map(slot => (
                      <span key={slot} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {timeSlots.find(s => s.id === slot)?.label}
                      </span>
                    ))}
                  </div>
                </div>

                {entry.preferredBarber && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Barbiere preferito</h3>
                    <p>{entry.preferredBarber.firstName} {entry.preferredBarber.lastName}</p>
                  </div>
                )}

                {entry.notes && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-2">Note</h3>
                    <p className="text-gray-600">{entry.notes}</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-2">Data richiesta</h3>
                  <p>{format(new Date(entry.requestDate), 'dd MMMM yyyy', { locale: it })}</p>
                </div>

                {entry.status === 'notified' && (
                  <div className="md:col-span-2 bg-green-50 p-4 rounded">
                    <p className="font-medium text-green-800">
                      È disponibile uno slot per il tuo appuntamento!
                      Accedi al sistema di prenotazione per prenotare il tuo appuntamento.
                    </p>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex justify-end mt-4">
                <button
                  onClick={() => handleDelete(entry._id)}
                  disabled={deletingId === entry._id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center"
                >
                  {deletingId === entry._id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rimozione in corso...
                    </>
                  ) : (
                    'Rimuovi dalla lista'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          Non hai richieste in lista d'attesa. Aggiungi una nuova richiesta per essere notificato quando si libera uno slot.
        </div>
      )}
    </div>
  );
};

export default WaitingList;
