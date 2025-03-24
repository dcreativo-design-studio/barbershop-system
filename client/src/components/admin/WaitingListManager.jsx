import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../config/api';

function WaitingListManager() {
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWaitingList();
  }, []);

  const fetchWaitingList = async () => {
    try {
      const response = await apiRequest.get('/waiting-list/all');
      setWaitingList(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching waiting list:', error);
      setError('Errore nel caricamento della lista d\'attesa');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'notified':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'In attesa';
      case 'notified':
        return 'Notificato';
      case 'booked':
        return 'Prenotato';
      case 'expired':
        return 'Scaduto';
      default:
        return status;
    }
  };

  // Traduzione delle fasce orarie
  const getTimeSlotLabel = (slot) => {
    switch (slot) {
      case 'morning':
        return 'Mattina (9:00 - 12:00)';
      case 'afternoon':
        return 'Pomeriggio (13:00 - 17:00)';
      case 'evening':
        return 'Sera (17:00 - 19:00)';
      default:
        return slot;
    }
  };

  // Traduzione dei giorni
  const getDayLabel = (day) => {
    const days = {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica'
    };
    return days[day] || day;
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--accent)]">
        Gestione Lista d'Attesa
      </h2>

      {waitingList.length === 0 ? (
        <p className="text-center text-gray-500">
          Nessuna richiesta in lista d'attesa
        </p>
      ) : (
        <div className="grid gap-4">
          {waitingList.map((request) => (
            <div
              key={request._id}
              className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-md"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Cliente</h3>
                  <p>{request.client.firstName} {request.client.lastName}</p>
                  <p className="text-sm text-gray-500">{request.client.email}</p>
                  <p className="text-sm text-gray-500">{request.client.phone}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Stato Richiesta</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                {/* Aggiungiamo la sezione per il barbiere preferito */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Barbiere</h3>
                  <p className={request.preferredBarber ? 'text-[var(--text-primary)]' : 'text-gray-500'}>
                    {request.preferredBarber
                      ? `${request.preferredBarber.firstName} ${request.preferredBarber.lastName}`
                      : 'Nessuna preferenza'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Servizio</h3>
                  <p>{request.service}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Giorni Preferiti</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.preferredDays.map((day, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {getDayLabel(day)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Fasce Orarie</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.preferredTimeSlots.map((slot, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {getTimeSlotLabel(slot)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Date</h3>
                  <p>
                    Richiesta: {format(new Date(request.requestDate), 'dd MMMM yyyy', { locale: it })}
                  </p>
                  <p>
                    Scadenza: {format(new Date(request.expiryDate), 'dd MMMM yyyy', { locale: it })}
                  </p>
                </div>

                {request.notes && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-2">Note</h3>
                    <p className="text-gray-600">{request.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WaitingListManager;
