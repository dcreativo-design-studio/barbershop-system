import { addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api.js';
import TimeSlots from './TimeSlots';

function GuestBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    selectedBarber: '',
    selectedService: '',
    selectedDate: '',
    selectedTime: ''
  });

  // Carica i barbieri all'avvio
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/appointments/public/barbers`);
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei barbieri');
        }
        const data = await response.json();
        setBarbers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Errore nel caricamento dei barbieri:', error);
        setError('Errore nel caricamento dei barbieri');
      }
    };
    fetchBarbers();
  }, []);

  // Carica i servizi all'avvio
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/active`);
        const data = await response.json();
        const formattedServices = data.map(service => ({
          id: service._id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description
        }));
        setServices(formattedServices);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Errore nel caricamento dei servizi');
      }
    };
    fetchServices();
  }, []);

  // Filtra i servizi quando cambia il barbiere selezionato
  useEffect(() => {
    if (formData.selectedBarber && services.length > 0) {
      const selectedBarberData = barbers.find(b => b._id === formData.selectedBarber);
      if (selectedBarberData) {
        const filteredServices = services.filter(service =>
          selectedBarberData.services.includes(service.name)
        );
        setAvailableServices(filteredServices);
        // Reset servizio selezionato quando cambia il barbiere
        setFormData(prev => ({ ...prev, selectedService: '' }));
      }
    } else {
      setAvailableServices([]);
    }
  }, [formData.selectedBarber, services, barbers]);

  // Fetch degli slot disponibili
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.selectedDate || !formData.selectedService || !formData.selectedBarber) {
        setAvailableSlots([]);
        return;
      }

      try {
        const service = services.find(s => s.id === formData.selectedService);
        if (!service) return;

        const barberResponse = await fetch(
          `${API_BASE_URL}/appointments/public/barbers/${formData.selectedBarber}`
        );
        if (!barberResponse.ok) {
          throw new Error('Errore nel recupero dei dati del barbiere');
        }
        const barberData = await barberResponse.json();

        const slotsResponse = await fetch(
          `${API_BASE_URL}/appointments/public/available-slots?` +
          new URLSearchParams({
            barberId: formData.selectedBarber,
            date: formData.selectedDate,
            duration: service.duration
          })
        );

        if (!slotsResponse.ok) {
          throw new Error('Errore nel caricamento degli slot disponibili');
        }

        const slots = await slotsResponse.json();
        const dayOfWeek = new Date(formData.selectedDate)
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();

        const workingHours = barberData.workingHours.find(wh => wh.day === dayOfWeek);
        const enrichedSlots = slots.map(slot => ({
          ...slot,
          workingHours: {
            hasBreak: workingHours?.hasBreak || false,
            breakStart: workingHours?.breakStart || null,
            breakEnd: workingHours?.breakEnd || null
          }
        }));

        setAvailableSlots(enrichedSlots);
        setError('');
      } catch (error) {
        console.error('Error fetching slots:', error);
        setError(error.message || 'Errore nel caricamento degli slot disponibili');
        setAvailableSlots([]);
      }
    };

    fetchAvailableSlots();
  }, [formData.selectedDate, formData.selectedService, formData.selectedBarber, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const service = services.find(s => s.id === formData.selectedService);
      if (!service) throw new Error('Servizio non trovato');

      const appointmentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        barberId: formData.selectedBarber,
        service: service.name,
        date: formData.selectedDate,
        time: formData.selectedTime,
        duration: service.duration,
        price: service.price
      };

      const response = await fetch(`${API_BASE_URL}/appointments/public/appointments/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore nella prenotazione');
      }

      setSuccess('Prenotazione effettuata con successo! Controlla la tua email per la conferma.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        selectedBarber: '',
        selectedService: '',
        selectedDate: '',
        selectedTime: ''
      });

    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Errore nella prenotazione');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = addDays(new Date(), 30).toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20">
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl animate-slide-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--accent)]">
          Prenota come ospite
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500 text-green-500 rounded-lg animate-fade-in">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--accent)] mb-2">Nome</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
                placeholder="Il tuo nome"
              />
            </div>

            <div>
              <label className="block text-[var(--accent)] mb-2">Cognome</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
                placeholder="Il tuo cognome"
              />
            </div>

            <div>
              <label className="block text-[var(--accent)] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
                placeholder="La tua email"
              />
            </div>

            <div>
              <label className="block text-[var(--accent)] mb-2">Telefono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
                placeholder="Il tuo numero di telefono"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[var(--accent)] mb-2">Barbiere</label>
              <select
                value={formData.selectedBarber}
                onChange={(e) => setFormData({...formData, selectedBarber: e.target.value})}
                required
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] hover-glow"
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
                value={formData.selectedService}
                onChange={(e) => setFormData({...formData, selectedService: e.target.value})}
                required
                disabled={!formData.selectedBarber}
                className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)] hover-glow disabled:opacity-50"
              >
                <option value="">Seleziona un servizio</option>
                {availableServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - CHF{service.price} ({service.duration} min)
                  </option>
                ))}
              </select>
              {!formData.selectedBarber && (
                <p className="text-sm text-[var(--accent)] mt-1 animate-fade-in">
                  Seleziona prima un barbiere per vedere i servizi disponibili
                </p>
              )}
            </div>

          <div>
            <label className="block text-[var(--accent)] mb-2">Data</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={formData.selectedDate}
              onChange={(e) => setFormData({...formData, selectedDate: e.target.value})}
              required
              className="w-full p-3 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--accent)]"
            />
          </div>

          {formData.selectedDate && formData.selectedService && formData.selectedBarber && (
            <div>
              <label className="block text-[var(--accent)] mb-2">Orario</label>
              <TimeSlots
                selectedDate={formData.selectedDate}
                selectedService={services.find(s => s.id === formData.selectedService)}
                availableSlots={availableSlots}
                onSelectTime={(time) => setFormData({...formData, selectedTime: time})}
                selectedTime={formData.selectedTime}
                selectedBarber={formData.selectedBarber}
                barbers={barbers}
              />
            </div>
          )}
          </div>

          <button
            type="submit"
            disabled={loading || !formData.selectedTime}
            className="w-full bg-[var(--accent)] text-white font-bold py-3 px-4 rounded transition-all duration-300 hover:opacity-90 disabled:opacity-50 hover-glow flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Prenotazione in corso...</span>
              </>
            ) : (
              'Prenota'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GuestBooking;
