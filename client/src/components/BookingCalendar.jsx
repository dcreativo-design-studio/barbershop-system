import { addDays, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { apiRequest, barberApi } from '../config/api';
import { appointmentsApi } from '../config/appointmentsApi';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../context/TimezoneContext';
import TimeSlots from './TimeSlots';





function BookingCalendar() {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userAppointments, setUserAppointments] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    barberId: '',
    service: '',
    date: '',
    time: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editConfirmData, setEditConfirmData] = useState(null);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]); // Nuovo stato per i servizi filtrati


  useEffect(() => {
    fetchUserAppointments();
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await apiRequest.get('/barbers');
        setBarbers(response);
      } catch (error) {
        console.error('Errore nel caricamento dei barbieri:', error);
        setError('Errore nel caricamento dei barbieri');
      }
    };

    fetchBarbers();
  }, []);

   // Carica i servizi all'avvio
   useEffect(() => {
    fetchServices();
  }, []);

  // Nuovo useEffect per gestire il filtraggio dei servizi quando cambia il barbiere selezionato
  useEffect(() => {
    if (selectedBarber && services.length > 0) {
      const selectedBarberData = barbers.find(b => b._id === selectedBarber);
      if (selectedBarberData) {
        // Filtra i servizi in base ai servizi offerti dal barbiere
        const filteredServices = services.filter(service =>
          selectedBarberData.services.includes(service.name)
        );
        setAvailableServices(filteredServices);
        // Reset service selection when barber changes
        setSelectedService('');
        setSelectedTime('');
      }
    } else {
      setAvailableServices([]);
    }
  }, [selectedBarber, services, barbers]);







  // useEffect per gli slot di modifica appuntamento
  useEffect(() => {
    if (editFormData.date && editFormData.service && editFormData.barberId) {
      const service = services.find(s => s.id === editFormData.service);
      if (service) {
        appointmentsApi.getAvailableSlots(
          editFormData.date,
          editFormData.barberId,
          service.duration
        ).then(slots => {
          setAvailableSlots(Array.isArray(slots) ? slots : []);
        }).catch(error => {
          console.error('Error fetching slots for edit:', error);
          setError('Errore nel caricamento degli slot disponibili');
        });
      }
    }
  }, [editFormData.date, editFormData.service, editFormData.barberId, services]);


  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !selectedService || !selectedBarber) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Ottieni il servizio
        const service = services.find(s => s.id === selectedService);
        if (!service) {
          console.log('Service not found:', selectedService);
          return;
        }

        // 2. Ottieni i dati del barbiere
        const selectedBarberData = barbers.find(b => b._id === selectedBarber);
        if (!selectedBarberData) {
          throw new Error('Barbiere non trovato');
        }

        // 3. Determina il giorno della settimana e gli orari di lavoro
        const date = new Date(selectedDate);
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[date.getDay()];
        const workingHours = selectedBarberData.workingHours?.find(h => h.day === dayOfWeek);

        // 4. Ottieni gli slot dal server
        const slots = await barberApi.getBarberAvailability(
          selectedBarber,
          selectedDate,
          service.duration
        );

        if (!Array.isArray(slots)) {
          throw new Error('Risposta non valida dal server');
        }

        // 5. Arricchisci gli slot con le informazioni sulle pause
        const enrichedSlots = slots.map(slot => {
          const isLunchBreak = workingHours?.hasBreak && workingHours.breakStart && workingHours.breakEnd && (() => {
            const slotTime = slot.time;
            const [slotHour, slotMinute] = slotTime.split(':').map(Number);
            const [breakStartHour, breakStartMinute] = workingHours.breakStart.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = workingHours.breakEnd.split(':').map(Number);

            const slotMinutes = slotHour * 60 + slotMinute;
            const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

            return slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes;
          })();

          return {
            ...slot,
            isBreak: !!isLunchBreak, // Ensure boolean
            workingHours: {
              hasBreak: !!workingHours?.hasBreak,
              breakStart: workingHours?.breakStart || null,
              breakEnd: workingHours?.breakEnd || null
            }
          };
        });

        console.log('Working hours:', workingHours);
        console.log('Enriched slots:', enrichedSlots);
        setAvailableSlots(enrichedSlots);
        setError('');
      } catch (error) {
        console.error('Error fetching slots:', error);
        setError(error.message || 'Errore nel caricamento degli slot disponibili');
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate && selectedBarber && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedBarber, selectedService, services]);

  // Funzione per caricare i servizi
  const fetchServices = async () => {
    try {
      console.log('Fetching services from API');
      const response = await apiRequest.get('/services/active');  // Nuovo endpoint
      const formattedServices = response.map(service => ({
        id: service._id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description
      }));
      console.log('Formatted services:', formattedServices);
      setServices(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Errore nel caricamento dei servizi');
    }
  };



  const fetchUserAppointments = async () => {
    try {
      const appointments = await appointmentsApi.getMyAppointments();
      if (Array.isArray(appointments)) {
        const localizedAppointments = appointments.map(app => {
          try {
            // Verifica se la data è valida
            const appointmentDate = parseISO(app.date);
            if (isNaN(appointmentDate.getTime())) {
              console.error('Invalid date:', app.date);
              return null;
            }

            return {
              ...app,
              date: format(appointmentDate, 'yyyy-MM-dd', {
                timeZone: timezone || 'Europe/Rome'
              }),
              time: app.time // Mantieni il formato originale dell'ora per ora
            };
          } catch (error) {
            console.error('Error processing appointment:', error);
            return null;
          }
        }).filter(Boolean); // Rimuovi gli appuntamenti invalidi

        setUserAppointments(localizedAppointments);
      } else {
        console.error('Unexpected response format:', appointments);
        setUserAppointments([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento degli appuntamenti:', error.message);
      setUserAppointments([]);
      setError('Errore nel caricamento degli appuntamenti');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) {
        throw new Error('Tutti i campi sono obbligatori');
      }

      const service = services.find(s => s.id === selectedService);
      if (!service) {
        throw new Error('Servizio non valido');
      }

      // Validazione della data e ora
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
      if (isNaN(appointmentDateTime.getTime())) {
        throw new Error('Data o ora non valida');
      }

      // Converti nel fuso orario corretto
      const localDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const utcDate = new Date(localDateTime.toLocaleString('en-US', {
        timeZone: timezone || 'Europe/Rome'
      }));

      const appointmentData = {
        barberId: selectedBarber,
        service: service.name,
        date: format(utcDate, 'yyyy-MM-dd'),
        time: format(utcDate, 'HH:mm'),
        duration: service.duration,
        price: service.price,
        timezone: timezone || 'Europe/Rome'
      };

      console.log('Submitting appointment:', appointmentData);
      const response = await appointmentsApi.createAppointment(appointmentData);
      console.log('Appointment created:', response);

      setSuccess('Prenotazione effettuata con successo!');
      await fetchUserAppointments();

      // Reset form
      setSelectedDate('');
      setSelectedService('');
      setSelectedTime('');
      setSelectedBarber('');
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Errore nella prenotazione');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);

    if (hoursDifference <= 24) {
      setError('Non puoi più cancellare l\'appuntamento perché mancano meno di 24 ore');
      return;
    }

    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    try {
      await appointmentsApi.cancelAppointment(selectedAppointment._id, {
        cancellationReason: cancelReason
      });

      // Aggiorna la lista degli appuntamenti
      await fetchUserAppointments();
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      setSuccess('Appuntamento cancellato con successo');
    } catch (error) {
      setError(error.message || 'Errore nella cancellazione dell\'appuntamento');
    }
  };





  const handleEditClick = (appointment) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);

    if (hoursDifference <= 24) {
      setError('Non puoi più modificare l\'appuntamento perché mancano meno di 24 ore');
      return;
    }

    // Usa services invece di SERVICES
    const service = services.find(s => s.name === appointment.service);
    setEditingAppointment(appointment);
    setEditFormData({
      barberId: appointment.barber._id,
      service: service ? service.id : '',
      date: appointment.date.split('T')[0],
      time: appointment.time
    });
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usa services invece di SERVICES
      const service = services.find(s => s.id === editFormData.service);
      if (!service) {
        throw new Error('Servizio non valido');
      }

      const appointmentData = {
        barberId: editFormData.barberId,
        service: service.name,
        date: editFormData.date,
        time: editFormData.time,
        duration: service.duration,
        price: service.price
      };

      await appointmentsApi.updateAppointment(editingAppointment._id, appointmentData);

      setSuccess('Appuntamento modificato con successo!');
      await fetchUserAppointments();
      setEditingAppointment(null);
    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'Errore nella modifica dell\'appuntamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEdit = () => {
    setEditingAppointment(null);
    setEditFormData({
      barberId: '',
      service: '',
      date: '',
      time: ''
    });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    // Usa services invece di SERVICES
    const service = services.find(s => s.id === editFormData.service);
    if (!service) {
      setError('Servizio non valido');
      return;
    }

    setEditConfirmData({
      oldAppointment: editingAppointment,
      newAppointment: {
        ...editFormData,
        serviceName: service.name,
        price: service.price,
        barberName: barbers.find(b => b._id === editFormData.barberId)?.firstName
      }
    });
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      const service = services.find(s => s.id === editFormData.service);
      if (!service) {
        throw new Error('Servizio non valido');
      }

      const appointmentData = {
        barberId: editFormData.barberId,
        service: service.name,
        date: editFormData.date,
        time: editFormData.time,
        duration: parseInt(service.duration),
        price: parseFloat(service.price)
      };

      await appointmentsApi.updateAppointment(editingAppointment._id, appointmentData);

      setSuccess('Appuntamento modificato con successo!');
      await fetchUserAppointments();
      setEditingAppointment(null);
      setShowConfirmModal(false);
      setEditFormData({
        barberId: '',
        service: '',
        date: '',
        time: ''
      });
    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'Errore nella modifica dell\'appuntamento');
    } finally {
      setLoading(false);
    }
  };

  const getBarberServices = (barberId) => {
    const selectedBarberData = barbers.find(b => b._id === barberId);
    if (!selectedBarberData) return [];

    // Filtra i servizi disponibili per mostrare solo quelli offerti dal barbiere
    return services.filter(service =>
      selectedBarberData.services.includes(service.name)
    );
  };

  // Disabilita date passate e limita le prenotazioni a 30 giorni in avanti
  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = addDays(new Date(), 30).toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Form prenotazione */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--accent)]">
          Prenota il tuo appuntamento
        </h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Barbiere */}
          <div>
            <label className="block text-[var(--accent)] mb-2">Barbiere</label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              required
              className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
            >
              <option value="">Seleziona un barbiere</option>
              {barbers.map(barber => (
                <option key={barber._id} value={barber._id}>
                  {barber.firstName} {barber.lastName}
                </option>
              ))}
            </select>
          </div>

         {/* Servizio */}
<div>
  <label className="block text-[var(--accent)] mb-2">Servizio</label>
  <select
    value={selectedService}
    onChange={(e) => setSelectedService(e.target.value)}
    required
    disabled={!selectedBarber}
    className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
  >
    <option value="">Seleziona un servizio</option>
    {availableServices.map(service => (
      <option key={service.id} value={service.id}>
        {service.name} - CHF{service.price} ({service.duration} min)
      </option>
    ))}
  </select>
  {!selectedBarber && (
    <p className="text-sm text-[var(--accent)] mt-1">
      Seleziona prima un barbiere per vedere i servizi disponibili
    </p>
  )}
</div>

          {/* Data */}
          <div>
            <label className="block text-[var(--accent)] mb-2">Data</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
            />
          </div>

          {/* Orario */}
{selectedDate && selectedService && selectedBarber && (
  <div>
    <label className="block text-[var(--accent)] mb-2">Orario</label>
    <TimeSlots
      selectedDate={selectedDate}
      selectedService={services.find(s => s.id === selectedService)}
      availableSlots={availableSlots}
      onSelectTime={setSelectedTime}
      selectedTime={selectedTime}
      selectedBarber={selectedBarber}
      barbers={barbers}
    />
  </div>
)}

          {/* Pulsante Prenota */}
          <button
            type="submit"
            disabled={loading || !selectedTime}
            className="w-full bg-[var(--accent)] text-white font-bold py-3 px-4 rounded transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Prenotazione in corso...' : 'Prenota'}
          </button>
        </form>
      </div>

      {/* Lista appuntamenti con pulsante modifica */}
      {userAppointments?.length > 0 && (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-[var(--accent)]">
            I tuoi appuntamenti
          </h3>
          <div className="space-y-4">
            {userAppointments.map(appointment => {
              const appointmentDate = new Date(appointment.date);
              const [hours, minutes] = appointment.time.split(':').map(Number);
              appointmentDate.setHours(hours, minutes, 0, 0);
              const now = new Date();
              const hoursDifference = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              const canBeModified = hoursDifference > 24;

              return (
                <div key={appointment._id} className="bg-[var(--bg-primary)] p-4 rounded-lg flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <p className="text-lg font-semibold">{appointment.service}</p>
              <p className="text-[var(--text-primary)] opacity-75">
                {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: it })}
                {' alle '}
                {appointment.time}
              </p>
              {appointment.barber && (
                <p className="text-[var(--text-primary)] opacity-75">
                  Barbiere: {appointment.barber.firstName} {appointment.barber.lastName}
                </p>
              )}
              <p className="text-[var(--accent)]">CHF{appointment.price}</p>
              <div className="mt-2">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  appointment.status === 'pending' ? 'bg-yellow-500' :
                  appointment.status === 'confirmed' ? 'bg-green-500' :
                  appointment.status === 'cancelled' ? 'bg-red-500' :
                  appointment.status === 'completed' ? 'bg-blue-500' : ''
                } text-white`}>
                  {appointment.status === 'pending' ? 'In attesa' :
                   appointment.status === 'confirmed' ? 'Confermato' :
                   appointment.status === 'cancelled' ? 'Cancellato' :
                   appointment.status === 'completed' ? 'Completato' : ''}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <>
                        <button
                          onClick={() => handleEditClick(appointment)}
                          disabled={!canBeModified}
                          className="px-4 py-2 bg-blue-500 text-white rounded transition-all duration-300 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          disabled={!canBeModified}
                          className="px-4 py-2 bg-red-500 text-white rounded transition-all duration-300 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancella
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modale di modifica */}
        {/* Modale di modifica */}
{editingAppointment && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full my-8">
      <h3 className="text-xl font-bold mb-4">Modifica appuntamento</h3>
      <form onSubmit={(e) => {
          e.preventDefault();
          handleUpdateSubmit(e);
        }} className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div>
          <label className="block text-[var(--accent)] mb-2">Barbiere</label>
          <select
            value={editFormData.barberId}
            onChange={(e) => setEditFormData({...editFormData, barberId: e.target.value})}
            required
            className="w-full p-3 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
          >
            <option value="">Seleziona un barbiere</option>
            {barbers.map(barber => (
              <option key={barber._id} value={barber._id}>
                {barber.firstName} {barber.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[var(--accent)] mb-2">Servizio</label>
          <select
            value={editFormData.service}
            onChange={(e) => setEditFormData({...editFormData, service: e.target.value})}
            required
            className="w-full p-3 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
          >
            <option value="">Seleziona un servizio</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - CHF{service.price} ({service.duration} min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[var(--accent)] mb-2">Data</label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={editFormData.date}
            onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
            required
            className="w-full p-3 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-[var(--accent)] mb-2">Orario</label>
          <TimeSlots
            selectedDate={editFormData.date}
            selectedService={services.find(s => s.id === editFormData.service)}
            availableSlots={availableSlots}
            onSelectTime={(time) => setEditFormData({...editFormData, time})}
            selectedTime={editFormData.time}
            selectedBarber={editFormData.barberId}
            barbers={barbers}
          />
        </div>

        <div className="sticky bottom-0 bg-[var(--bg-primary)] pt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCloseEdit}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Procedi'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Modale di conferma modifica */}
      {showConfirmModal && editConfirmData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Conferma modifiche</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Dettagli attuali:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Barbiere: {editConfirmData.oldAppointment.barber.firstName}</li>
                  <li>Servizio: {editConfirmData.oldAppointment.service}</li>
                  <li>Data: {editConfirmData.oldAppointment.date.split('T')[0]}</li>
                  <li>Ora: {editConfirmData.oldAppointment.time}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Nuovi dettagli:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Barbiere: {editConfirmData.newAppointment.barberName}</li>
                  <li>Servizio: {editConfirmData.newAppointment.serviceName}</li>
                  <li>Data: {editConfirmData.newAppointment.date}</li>
                  <li>Ora: {editConfirmData.newAppointment.time}</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmUpdate}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Salvataggio...' : 'Conferma modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Modale di cancellazione */}
{showCancelModal && selectedAppointment && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">Conferma cancellazione</h3>
      <p className="mb-4">Sei sicuro di voler cancellare questo appuntamento?</p>
      <textarea
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        placeholder="Motivo della cancellazione (opzionale)"
        className="w-full p-2 rounded mb-4 bg-[var(--bg-secondary)] border border-[var(--accent)]"
        rows="3"
      />
      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedAppointment(null);
          }}
          className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
        >
          Annulla
        </button>
        <button
          onClick={handleCancelConfirm}
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Conferma cancellazione
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default BookingCalendar;
