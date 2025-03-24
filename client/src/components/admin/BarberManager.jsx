import { Coffee, Palmtree } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiRequest, barberApi, servicesApi } from '../../config/api';
import VacationPicker from '../VacationPicker';

function BarberManager() {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBarber, setEditingBarber] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [vacations, setVacations] = useState([]);

  const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  const [newBarber, setNewBarber] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    services: [],
    vacations: [],
    workingHours: [
      {
        day: 'monday',
        isWorking: true,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'tuesday',
        isWorking: true,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'wednesday',
        isWorking: true,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'thursday',
        isWorking: true,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'friday',
        isWorking: true,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'saturday',
        isWorking: true,
        startTime: '09:00',
        endTime: '17:00',
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '12:30'
      },
      {
        day: 'sunday',
        isWorking: false,
        startTime: '09:00',
        endTime: '19:00',
        hasBreak: false,
        breakStart: '12:00',
        breakEnd: '12:30'
      }
    ]
  });

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchBarbers(), fetchServices()]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    if (!showEditModal) {
      fetchBarbers();
    }
  }, [showEditModal]);

  // Funzione per aggiungere un nuovo barbiere// Funzione helper per formattare le date per l'API

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    // Imposta le ore correttamente
    if (date === d.toISOString().split('T')[0]) { // Se è una data di inizio
      d.setHours(0, 0, 0, 0);
    } else { // Se è una data di fine
      d.setHours(23, 59, 59, 999);
    }

    return d.toISOString();
  };

  // Funzione helper per formattare le vacanze per il display
const formatVacationsForDisplay = (vacations) => {
  if (!vacations) return [];
  return vacations.map(vacation => ({
    startDate: vacation.startDate,
    endDate: vacation.endDate
  }));
};


  const fetchServices = async () => {
    try {
      const activeServices = await servicesApi.getActiveServices();
      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Errore nel caricamento dei servizi');
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await apiRequest.get('/barbers');
      console.log('Barbers data (with working hours):', JSON.stringify(response, null, 2));
      setBarbers(response);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      setError('Errore nel caricamento dei barbieri');
    }
  };

  const handleVacationsChange = (newVacations) => {
    setVacations(newVacations);
  };

  const handleDeleteVacation = (index) => {
    setVacations(vacations.filter((_, i) => i !== index));
  };

  const handleWorkingHoursChange = (dayIndex, field, value) => {
    const updatedHours = [...newBarber.workingHours];
    const currentDay = updatedHours[dayIndex];

    if (field === 'hasBreak') {
      currentDay.hasBreak = value;
      if (value) {
        currentDay.breakStart = currentDay.breakStart || '12:00';
        currentDay.breakEnd = currentDay.breakEnd || '12:30';
      } else {
        currentDay.breakStart = null;
        currentDay.breakEnd = null;
      }
    } else if (field === 'isWorking') {
      currentDay.isWorking = value;
      if (!value) {
        currentDay.hasBreak = false;
        currentDay.breakStart = null;
        currentDay.breakEnd = null;
      }
    } else {
      currentDay[field] = value;
    }

    setNewBarber({ ...newBarber, workingHours: updatedHours });
  };

  const handleServiceToggle = (serviceName) => {
    const updatedServices = newBarber.services.includes(serviceName)
      ? newBarber.services.filter(s => s !== serviceName)
      : [...newBarber.services, serviceName];
    setNewBarber({ ...newBarber, services: updatedServices });
  };

  const handleNewBarberSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedVacations = (newBarber.vacations || [])
        .map(vacation => ({
          startDate: formatDateForAPI(vacation.startDate),
          endDate: formatDateForAPI(vacation.endDate)
        }))
        .filter(vacation => vacation.startDate && vacation.endDate);

      const formattedBarber = {
        ...newBarber,
        phone: formatPhoneNumber(newBarber.phone),
        vacations: formattedVacations
      };


      await apiRequest.post('/barbers', formattedBarber);
      await fetchBarbers();

      // Reset del form
      setNewBarber({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        services: [],
        vacations: [],
        workingHours: [...newBarber.workingHours]
      });
      setError('');
    } catch (error) {
      console.error('Error creating barber:', error);
      setError(error.response?.data?.message || 'Errore nella creazione del barbiere');
    }
  };

  const formatPhoneNumber = (phone) => {
    const cleanNum = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) {
      return `+${cleanNum}`;
    } else if (phone.startsWith('00')) {
      return `+${cleanNum.substring(2)}`;
    }
    return cleanNum.startsWith('0') ? `+41${cleanNum.substring(1)}` : `+41${cleanNum}`;
  };

  const handleDeleteBarber = async (barberId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo barbiere?')) return;
    try {
      await apiRequest.delete(`/barbers/${barberId}`);
      fetchBarbers();
    } catch (error) {
      setError('Errore nell\'eliminazione del barbiere');
    }
  };

  if (loading) return <div className="text-center py-4">Caricamento...</div>;

  // Prima di return nel BarberManager


  const handleEdit = (barber) => {
    const formattedVacations = formatVacationsForDisplay(barber.vacations);
    setEditingBarber({
      ...barber,
      workingHours: barber.workingHours.map(hours => ({...hours})),
      vacations: formattedVacations
    });
    setShowEditModal(true);
  };

const handleEditingHoursChange = (dayIndex, field, value) => {
  const updatedHours = [...editingBarber.workingHours];
  const currentDay = updatedHours[dayIndex];

  if (field === 'hasBreak') {
    currentDay.hasBreak = value;
    if (value) {
      // Se attiviamo la pausa, impostiamo gli orari di default se non presenti
      currentDay.breakStart = currentDay.breakStart || '12:00';
      currentDay.breakEnd = currentDay.breakEnd || '12:30';
    } else {
      // Se disattiviamo la pausa, resettiamo gli orari
      currentDay.breakStart = null;
      currentDay.breakEnd = null;
    }
  } else if (field === 'isWorking') {
    currentDay.isWorking = value;
    if (!value) {
      // Se il giorno non è lavorativo, resettiamo tutto
      currentDay.hasBreak = false;
      currentDay.breakStart = null;
      currentDay.breakEnd = null;
    }
  } else {
    currentDay[field] = value;
  }

  console.log('Updated working hours for', DAYS[dayIndex], ':', currentDay);

  setEditingBarber({ ...editingBarber, workingHours: updatedHours });
};

const handleEditingServiceToggle = (serviceName) => {
  const updatedServices = editingBarber.services.includes(serviceName)
    ? editingBarber.services.filter(s => s !== serviceName)
    : [...editingBarber.services, serviceName];
  setEditingBarber({ ...editingBarber, services: updatedServices });
};

const validateWorkingHours = (workingHours) => {
  for (const hours of workingHours) {
    if (hours.isWorking) {
      if (!hours.startTime || !hours.endTime) {
        throw new Error('Gli orari di apertura e chiusura sono obbligatori per i giorni lavorativi');
      }

      if (hours.hasBreak) {
        if (!hours.breakStart || !hours.breakEnd) {
          throw new Error('Gli orari della pausa pranzo sono obbligatori quando la pausa è attiva');
        }

        // Converti gli orari in minuti per il confronto
        const timeToMinutes = (time) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const start = timeToMinutes(hours.startTime);
        const end = timeToMinutes(hours.endTime);
        const breakStart = timeToMinutes(hours.breakStart);
        const breakEnd = timeToMinutes(hours.breakEnd);

        // Verifica che la pausa sia all'interno dell'orario di lavoro
        if (breakStart < start || breakEnd > end) {
          throw new Error('La pausa pranzo deve essere compresa nell\'orario di lavoro');
        }

        // Verifica che l'inizio della pausa sia prima della fine
        if (breakStart >= breakEnd) {
          throw new Error('L\'orario di inizio pausa deve essere precedente all\'orario di fine pausa');
        }
      }
    }
  }
  return true;
};

// Aggiorna la funzione handleUpdateBarber per includere la validazione

const handleUpdateBarber = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Validazione
    if (editingBarber.services.length === 0) {
      setError('Seleziona almeno un servizio');
      return;
    }

    try {
      validateWorkingHours(editingBarber.workingHours);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    // Formattazione dati
    const formattedVacations = (editingBarber.vacations || [])
      .map(vacation => ({
        startDate: formatDateForAPI(vacation.startDate),
        endDate: formatDateForAPI(vacation.endDate)
      }))
      .filter(vacation => vacation.startDate && vacation.endDate);

    const formattedWorkingHours = editingBarber.workingHours.map(hours => ({
      ...hours,
      breakStart: hours.hasBreak ? hours.breakStart : null,
      breakEnd: hours.hasBreak ? hours.breakEnd : null
    }));

    // Esegui gli aggiornamenti in sequenza
    const updates = [];

    // Aggiorna i servizi
    updates.push(
      barberApi.updateBarberServices(editingBarber._id, editingBarber.services)
        .then(response => {
          console.log('Services updated:', response);
          return response;
        })
    );

    // Aggiorna gli orari di lavoro
    updates.push(
      barberApi.updateBarberWorkingHours(editingBarber._id, formattedWorkingHours)
        .then(response => {
          console.log('Working hours updated:', response);
          return response;
        })
    );

    // Aggiorna le vacanze
    updates.push(
      barberApi.updateBarberVacations(editingBarber._id, formattedVacations)
        .then(response => {
          console.log('Vacations updated:', response);
          return response;
        })
    );

    // Attendi che tutti gli aggiornamenti siano completati
    await Promise.all(updates);

    // Aggiorna lo stato locale e chiudi il modale
    setShowEditModal(false);
    setEditingBarber(null);
    setError('');

    // Ricarica i dati aggiornati
    await fetchBarbers();
  } catch (error) {
    console.error('Error updating barber:', error);
    setError('Errore durante il salvataggio delle modifiche. Riprova.');
  } finally {
    setLoading(false);
  }
};


return (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-[var(--accent)]">Gestione Barbieri</h2>

    {error && (
      <div className="bg-red-500 text-white p-3 rounded">{error}</div>
    )}

    {/* Form nuovo barbiere */}
    <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Aggiungi Nuovo Barbiere</h3>
      <form onSubmit={handleNewBarberSubmit} className="space-y-6">
        {/* Dati personali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome"
              value={newBarber.firstName}
              onChange={(e) => setNewBarber({...newBarber, firstName: e.target.value})}
              required
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            />
            <input
              type="text"
              placeholder="Cognome"
              value={newBarber.lastName}
              onChange={(e) => setNewBarber({...newBarber, lastName: e.target.value})}
              required
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            />
            <input
              type="email"
              placeholder="Email"
              value={newBarber.email}
              onChange={(e) => setNewBarber({...newBarber, email: e.target.value})}
              required
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            />
            <input
              type="tel"
              placeholder="Telefono (es: +41791234567)"
              value={newBarber.phone}
              onChange={(e) => setNewBarber({...newBarber, phone: e.target.value})}
              required
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            />
          </div>

          {/* Servizi */}
          <div>
            <h4 className="font-semibold mb-2">Servizi Offerti</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {services.map(service => (
                <label key={service._id} className="flex items-center space-x-2 p-2 bg-[var(--bg-secondary)] rounded">
                  <input
                    type="checkbox"
                    checked={newBarber.services.includes(service.name)}
                    onChange={() => handleServiceToggle(service.name)}
                    className="rounded border-[var(--accent)]"
                  />
                  <span className="text-sm">{service.name}</span>
                </label>
              ))}
            </div>
          </div>

                          {/* Orari di lavoro e pausa pranzo */}
          <div>
            <h4 className="font-semibold mb-4">Orari di Lavoro e Pausa Pranzo</h4>
            <div className="space-y-4">
              {newBarber.workingHours.map((hours, index) => (
                                <div key={hours.day} className="bg-[var(--bg-primary)] p-4 rounded-lg">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Giorno e attivazione */}
                                    <div className="flex items-center space-x-4">
                                      <div className="font-medium min-w-[100px]">{DAYS[index]}</div>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={hours.isWorking}
                                          onChange={(e) => handleWorkingHoursChange(index, 'isWorking', e.target.checked)}
                                          className="rounded border-[var(--accent)]"
                                        />
                                        <span>Attivo</span>
                                      </label>
                                    </div>

                                    {/* Orari di lavoro */}
                                    {hours.isWorking && (
                                      <>
                                        <div className="flex space-x-4">
                                          <div>
                                            <label className="block text-sm mb-1">Apertura</label>
                                            <input
                                              type="time"
                                              value={hours.startTime}
                                              onChange={(e) => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                                              className="p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm mb-1">Chiusura</label>
                                            <input
                                              type="time"
                                              value={hours.endTime}
                                              onChange={(e) => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                                              className="p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                                            />
                                          </div>
                                        </div>

                                        {/* Pausa pranzo */}
                                        <div className="space-y-2">
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={hours.hasBreak}
                                              onChange={(e) => handleWorkingHoursChange(index, 'hasBreak', e.target.checked)}
                                              className="rounded border-[var(--accent)]"
                                            />
                                            <span className="flex items-center space-x-1">
                                              <Coffee className="h-4 w-4" />
                                              <span>Pausa Pranzo</span>
                                            </span>
                                          </label>

                                          {hours.hasBreak && (
                                            <div className="flex space-x-4 mt-2">
                                              <div>
                                                <label className="block text-sm mb-1">Inizio Pausa</label>
                                                <input
                                                  type="time"
                                                  value={hours.breakStart}
                                                  onChange={(e) => handleWorkingHoursChange(index, 'breakStart', e.target.value)}
                                                  className="p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm mb-1">Fine Pausa</label>
                                                <input
                                                  type="time"
                                                  value={hours.breakEnd}
                                                  onChange={(e) => handleWorkingHoursChange(index, 'breakEnd', e.target.value)}
                                                  className="p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                         {/* Sezione Vacanze */}
          <div className="mt-8 bg-[var(--bg-primary)] p-4 rounded-lg">
            <VacationPicker
              vacations={newBarber.vacations}
              onChange={(newVacations) => setNewBarber({
                ...newBarber,
                vacations: newVacations
              })}
              onDelete={(index) => {
                const updatedVacations = [...newBarber.vacations];
                updatedVacations.splice(index, 1);
                setNewBarber({
                  ...newBarber,
                  vacations: updatedVacations
                });
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-[var(--accent)] text-white font-bold py-2 px-4 rounded hover:opacity-90"
          >
            Aggiungi Barbiere
          </button>
        </form>
      </div>



     {/* Lista barbieri */}
     <div className="space-y-4">
        {barbers.map(barber => (
          <div key={barber._id} className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold">
            {barber.firstName} {barber.lastName}
          </h3>
          <p className="text-sm text-gray-400">
            {barber.email} • {barber.phone}
          </p>
          <div className="mt-2">
            <h4 className="font-semibold">Servizi:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {barber.services.map(service => (
                <span
                  key={service}
                  className="px-2 py-1 bg-[var(--accent)] text-white text-sm rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Orari di lavoro:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {barber.workingHours.map((hours, index) => (
                  hours.isWorking && (
                    <div key={hours.day} className="text-sm">
                      <span className="font-medium">{DAYS[index]}: </span>
                      <span>{hours.startTime} - {hours.endTime}</span>
                      {hours.hasBreak && hours.breakStart && hours.breakEnd && (
                        <div className="flex items-center text-orange-400 gap-1 ml-4">
                          <Coffee className="h-4 w-4" />
                          <span>
                            Pausa: {hours.breakStart} - {hours.breakEnd}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
            {/* Sezione Vacanze */}
            {barber.vacations && barber.vacations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">Periodi di Vacanza:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {barber.vacations.map((vacation, index) => (
                    <div
                      key={index}
                      className="text-sm flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg"
                    >
                      <Palmtree className="h-4 w-4 text-blue-500" />
                      <span>
                        Dal {new Date(vacation.startDate).toLocaleDateString('it-IT')} al{' '}
                        {new Date(vacation.endDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(barber)}
            className="px-4 py-2 text-[var(--accent)] hover:text-opacity-70"
          >
            Modifica
          </button>
          <button
            onClick={() => handleDeleteBarber(barber._id)}
            className="text-red-500 hover:text-red-700 px-4 py-2"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Modal di modifica */}
      {showEditModal && editingBarber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Contenuto del modale */}
              <div className="relative bg-[var(--bg-primary)] rounded-lg w-full max-w-4xl mx-auto my-6 shadow-xl">
                {/* Header del modale */}
                <div className="sticky top-0 bg-[var(--bg-primary)] rounded-t-lg border-b border-[var(--accent)] p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Modifica Barbiere</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBarber(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

         {/* Corpo del modale */}
         <div className="p-6">
                  <form onSubmit={handleUpdateBarber} className="space-y-6">
              {/* Dati personali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nome</label>
                  <input
                    type="text"
                    value={editingBarber.firstName}
                    onChange={(e) => setEditingBarber({...editingBarber, firstName: e.target.value})}
                    required
                    className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Cognome</label>
                  <input
                    type="text"
                    value={editingBarber.lastName}
                    onChange={(e) => setEditingBarber({...editingBarber, lastName: e.target.value})}
                    required
                    className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={editingBarber.email}
                    onChange={(e) => setEditingBarber({...editingBarber, email: e.target.value})}
                    required
                    className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Telefono</label>
                  <input
                    type="tel"
                    value={editingBarber.phone}
                    onChange={(e) => setEditingBarber({...editingBarber, phone: e.target.value})}
                    required
                    className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Servizi */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Servizi Offerti</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {services.map(service => (
                    <label key={service._id} className="flex items-center space-x-2 p-2 bg-[var(--bg-secondary)] rounded">
                      <input
                        type="checkbox"
                        checked={editingBarber.services.includes(service.name)}
                        onChange={() => handleEditingServiceToggle(service.name)}
                        className="rounded border-[var(--accent)]"
                      />
                      <span className="text-sm">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Orari di lavoro e pausa pranzo */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Orari di Lavoro e Pausa Pranzo</h4>
                <div className="space-y-4">
                  {editingBarber.workingHours.map((hours, index) => (
                    <div key={hours.day} className="bg-[var(--bg-secondary)] p-4 rounded-lg">
                      <div className="space-y-4">
                        {/* Giorno e attivazione */}
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{DAYS[index]}</div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hours.isWorking}
                              onChange={(e) => handleEditingHoursChange(index, 'isWorking', e.target.checked)}
                              className="rounded border-[var(--accent)]"
                            />
                            <span>Attivo</span>
                          </label>
                        </div>

                        {hours.isWorking && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Orari di lavoro */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm mb-1">Apertura</label>
                                  <input
                                    type="time"
                                    value={hours.startTime}
                                    onChange={(e) => handleEditingHoursChange(index, 'startTime', e.target.value)}
                                    className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm mb-1">Chiusura</label>
                                  <input
                                    type="time"
                                    value={hours.endTime}
                                    onChange={(e) => handleEditingHoursChange(index, 'endTime', e.target.value)}
                                    className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Pausa pranzo */}
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={hours.hasBreak}
                                  onChange={(e) => handleEditingHoursChange(index, 'hasBreak', e.target.checked)}
                                  className="rounded border-[var(--accent)]"
                                />
                                <span className="flex items-center space-x-1">
                                  <Coffee className="h-4 w-4" />
                                  <span>Pausa Pranzo</span>
                                </span>
                              </label>

                              {hours.hasBreak && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-sm mb-1">Inizio Pausa</label>
                                    <input
                                      type="time"
                                      value={hours.breakStart}
                                      onChange={(e) => handleEditingHoursChange(index, 'breakStart', e.target.value)}
                                      className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm mb-1">Fine Pausa</label>
                                    <input
                                      type="time"
                                      value={hours.breakEnd}
                                      onChange={(e) => handleEditingHoursChange(index, 'breakEnd', e.target.value)}
                                      className="w-full p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                                    />
                                  </div>

                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Sezione Vacanze nel modale */}
              <div className="space-y-4 border-t border-[var(--accent)] pt-6 mt-6">
                      <h4 className="text-lg font-semibold">Gestione Vacanze</h4>
                      <VacationPicker
                        vacations={editingBarber.vacations || []}
                        onChange={(newVacations) => setEditingBarber({
                          ...editingBarber,
                          vacations: newVacations
                        })}
                        onDelete={(index) => {
                          const updatedVacations = [...(editingBarber.vacations || [])];
                          updatedVacations.splice(index, 1);
                          setEditingBarber({
                            ...editingBarber,
                            vacations: updatedVacations
                          });
                        }}
                      />
                    </div>

                    {/* Footer con pulsanti */}
                    <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--accent)] p-4 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingBarber(null);
                        }}
                        className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90"
                      >
                        Salva Modifiche
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberManager;
