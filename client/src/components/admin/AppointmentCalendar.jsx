import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';

import { useTimezone } from '../../context/TimezoneContext';
import { appointmentService } from '../../services/appointmentService';
import CalendarHeader from '../calendar/CalendarHeader';

const AppointmentCalendar = () => {
  const { timezone } = useTimezone();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('day');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [barbers, setBarbers] = useState([]);

  // Helper functions
  const getStatusBadgeColor = (status) => ({
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }[status] || 'bg-gray-500'); // Default color for unknown status

  const getStatusLabel = (status) => ({
    pending: 'In attesa',
    confirmed: 'Confermato',
    completed: 'Completato',
    cancelled: 'Cancellato'
  }[status] || 'Sconosciuto'); // Default label for unknown status

  // Fetch barbers on component mount
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await appointmentService.getBarbers();
        setBarbers(response);
      } catch (err) {
        console.error('Error fetching barbers:', err);
        setError('Errore nel caricamento dei barbieri');
      }
    };
    fetchBarbers();
  }, []);

  const getDateRange = () => {
    const date = new Date(selectedDate);
    switch (viewType) {
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
      default:
        return {
          start: date,
          end: date
        };
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await appointmentService.getAppointmentsByView(
        viewType,
        selectedDate,
        selectedBarber
      );

      console.log('Received appointments response type:', typeof response);
      console.log('Is response an array?', Array.isArray(response));

      // Ensure we're working with an array
      if (Array.isArray(response)) {
        if (viewType === 'day') {
          // Day view - ensure all appointments have the necessary properties
          const safeAppointments = response.map(app => {
            return {
              ...app,
              client: app.client || { firstName: 'Cliente', lastName: 'Sconosciuto', email: 'N/A', phone: 'N/A' },
              barber: app.barber || { firstName: 'Barbiere', lastName: 'Sconosciuto' }
            };
          });
          setAppointments(safeAppointments);
        } else {
          // Week/month view - process grouped data
          try {
            // Safely process array of appointment groups
            const flattenedAppointments = response.reduce((acc, group) => {
              if (group && Array.isArray(group.appointments)) {
                const safeAppointments = group.appointments.map(app => ({
                  ...app,
                  client: app.client || { firstName: 'Cliente', lastName: 'Sconosciuto', email: 'N/A', phone: 'N/A' },
                  barber: app.barber || { firstName: 'Barbiere', lastName: 'Sconosciuto' }
                }));
                return [...acc, ...safeAppointments];
              } else if (group) {
                // If group doesn't have appointments array property
                const safeGroup = {
                  ...group,
                  client: group.client || { firstName: 'Cliente', lastName: 'Sconosciuto', email: 'N/A', phone: 'N/A' },
                  barber: group.barber || { firstName: 'Barbiere', lastName: 'Sconosciuto' }
                };
                return [...acc, safeGroup];
              }
              return acc;
            }, []);

            setAppointments(flattenedAppointments);
          } catch (e) {
            console.error('Error processing appointments:', e);
            setAppointments([]);
          }
        }
      } else if (response && typeof response === 'object') {
        // Handle non-array response formats
        console.log('Non-array response format detected');

        let processedAppointments = [];

        // Check for nested structure like { appointments: {...} }
        if (response.appointments) {
          const appointmentsByDate = response.appointments;
          Object.values(appointmentsByDate).forEach(dateGroup => {
            if (dateGroup && Array.isArray(dateGroup.appointments)) {
              const safeAppointments = dateGroup.appointments.map(app => ({
                ...app,
                client: app.client || { firstName: 'Cliente', lastName: 'Sconosciuto', email: 'N/A', phone: 'N/A' },
                barber: app.barber || { firstName: 'Barbiere', lastName: 'Sconosciuto' }
              }));
              processedAppointments = [...processedAppointments, ...safeAppointments];
            }
          });
        } else {
          console.warn('Unexpected response format, using empty array');
        }

        setAppointments(processedAppointments);
      } else {
        console.error('Unexpected response format:', response);
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Errore nel caricamento degli appuntamenti: ' + (err.message || 'errore sconosciuto'));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewType, selectedBarber, timezone]);

  // API calls and handlers
  const handleStatusChange = async (appointment, newStatus) => {
    try {
      setError('');

      await appointmentService.updateAppointmentStatus(
        appointment._id,
        {
          status: newStatus,
          cancellationReason: 'Cancellato dall\'amministratore'
        }
      );

      // Reload appointments after update
      await fetchAppointments();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Errore nell\'aggiornamento dello stato: ' +
        (err.response?.data?.message || 'Errore sconosciuto'));
    }
  };

  const getServiceDuration = (serviceName) => {
    const serviceDurations = {
      'Taglio': 30,
      'Barba': 20,
      'Taglio + Barba': 45,
      'Taglio Bambino': 25
    };
    return serviceDurations[serviceName] || 30;
  };

  const handleDateChange = async (newDate) => {
    try {
      setSelectedDate(newDate);
      // We'll let the useEffect trigger the data fetch
    } catch (error) {
      console.error('Error handling date change:', error);
      setError('Errore nella gestione del cambio data');
    }
  };

  const renderAppointmentCard = (appointment) => {
    // Safely access nested properties
    const clientFirstName = appointment?.client?.firstName || 'Cliente';
    const clientLastName = appointment?.client?.lastName || 'Sconosciuto';
    const clientEmail = appointment?.client?.email || 'N/A';
    const clientPhone = appointment?.client?.phone || 'N/A';
    const barberFirstName = appointment?.barber?.firstName || 'Barbiere';
    const barberLastName = appointment?.barber?.lastName || 'Sconosciuto';

    return (
      <div key={appointment._id} className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-[var(--accent)]">
                {clientFirstName} {clientLastName}
              </h3>
              <p className="text-sm text-gray-400">
                {clientEmail} • {clientPhone}
              </p>
            </div>

            <div>
              <p className="text-lg">{appointment.service || 'Servizio non specificato'}</p>
              <p className="text-sm text-gray-400">
                {appointment.date ? format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: it }) : 'Data non specificata'}
                &nbsp;•&nbsp;{appointment.time || 'Orario non specificato'}
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                Barbiere: {barberFirstName} {barberLastName}
              </p>
              <p className="text-[var(--accent)] font-semibold mt-1">
                CHF{appointment.price || '0'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusBadgeColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>

            <select
              value={appointment.status || 'pending'}
              onChange={(e) => handleStatusChange(appointment, e.target.value)}
              className="mt-2 p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)] text-sm"
            >
              <option value="pending">In attesa</option>
              <option value="confirmed">Confermato</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Cancellato</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    if (loading) return <div className="text-center py-4">Caricamento...</div>;

    if (!appointments || appointments.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          Nessun appuntamento {selectedBarber ? 'per questo barbiere' : ''} in questo periodo
        </div>
      );
    }

    if (viewType === 'day') {
      return (
        <div className="grid gap-4">
          {appointments.map((appointment, index) =>
            renderAppointmentCard(appointment)
          )}
        </div>
      );
    }

    // For week/month views, group by date
    try {
      const groupedAppointments = appointments.reduce((groups, appointment) => {
        if (!appointment || !appointment.date) {
          console.warn('Invalid appointment data:', appointment);
          return groups;
        }

        const dateKey = new Date(appointment.date).toISOString().split('T')[0];
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(appointment);
        return groups;
      }, {});

      return (
        <div className="space-y-6">
          {Object.entries(groupedAppointments)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .map(([date, dayAppointments]) => (
              <div key={date} className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-4 text-[var(--accent)]">
                  {format(new Date(date), 'EEEE d MMMM yyyy', { locale: it })}
                </h3>
                <div className="space-y-4">
                  {dayAppointments.map((appointment, index) =>
                    renderAppointmentCard(appointment)
                  )}
                </div>
              </div>
            ))}
        </div>
      );
    } catch (err) {
      console.error('Error rendering grouped appointments:', err);
      return (
        <div className="bg-red-100 text-red-800 p-3 rounded">
          Errore nella visualizzazione degli appuntamenti. Dettagli: {err.message}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[var(--accent)]">
          Calendario Appuntamenti
        </h2>
        <CalendarHeader
          viewType={viewType}
          onViewTypeChange={setViewType}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          selectedBarber={selectedBarber}
          onBarberChange={setSelectedBarber}
          barbers={barbers}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-3 rounded">
          {error}
        </div>
      )}

      {/* Appointments List */}
      {renderAppointments()}
    </div>
  );
};

export default AppointmentCalendar;
