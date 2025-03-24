import { format, isBefore, isThisWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { appointmentService } from '../../services/appointmentService';

function BarberAppointments({ barberId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalToday: 0,
    upcomingToday: 0,
    completedToday: 0,
    totalWeek: 0,
    cancelledToday: 0
  });

  useEffect(() => {
    if (barberId) {
      fetchAppointments();
    }
  }, [barberId, viewMode, selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      let startDate, endDate;

      if (viewMode === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else if (viewMode === 'week') {
        // Start from the beginning of current week
        const currentDay = selectedDate.getDay();
        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (viewMode === 'date') {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      }

      console.log('Fetching appointments for barberId:', barberId, 'from', startDate.toISOString(), 'to', endDate.toISOString());

      try {
        const response = await appointmentService.getBarberAppointments(
          barberId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('Appointments response:', response);

        // Aggiorniamo il formato dei dati ricevuti
        let formattedAppointments = [];

        // Gestisci array diretto di appuntamenti
        if (Array.isArray(response)) {
          formattedAppointments = response;
        }
        // Gestisci appointments raggruppati con struttura nidificata
        else if (response && response.appointments && typeof response.appointments === 'object') {
          const datesKeys = Object.keys(response.appointments);
          console.log('Dates keys:', datesKeys);

          if (datesKeys.length > 0) {
            datesKeys.forEach(date => {
              if (response.appointments[date] && Array.isArray(response.appointments[date].appointments)) {
                const dayAppointments = response.appointments[date].appointments;
                formattedAppointments = [...formattedAppointments, ...dayAppointments];
              }
            });
          }
        }
        // Gestisci appuntamenti come proprietà diretta
        else if (response && Array.isArray(response.appointments)) {
          formattedAppointments = response.appointments;
        }

        console.log('Formatted appointments:', formattedAppointments);

        // Se non ci sono appuntamenti, mostriamo solo un array vuoto
        if (!formattedAppointments || formattedAppointments.length === 0) {
          setAppointments([]);
          calculateStats([]);
          return;
        }

        // Ordinamento degli appuntamenti per data e ora
        formattedAppointments.sort((a, b) => {
          if (!a || !b || !a.date || !a.time || !b.date || !b.time) return 0;
          try {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
          } catch (e) {
            console.error('Error sorting appointments:', e);
            return 0;
          }
        });

        setAppointments(formattedAppointments);
        calculateStats(formattedAppointments);
      } catch (apiError) {
        console.error('API error fetching appointments:', apiError);
        setError('Errore nella comunicazione con il server. Riprova più tardi.');
        setAppointments([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error in fetchAppointments function:', error);
      setError('Errore nel caricamento degli appuntamenti. Riprova più tardi.');
      setAppointments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointments) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const todayAppointments = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate.toDateString() === today.toDateString();
    });

    const completedToday = todayAppointments.filter(app => app.status === 'completed').length;
    const cancelledToday = todayAppointments.filter(app => app.status === 'cancelled').length;
    const upcomingToday = todayAppointments.filter(app =>
      app.status !== 'completed' && app.status !== 'cancelled'
    ).length;

    const weekAppointments = appointments.filter(app =>
      isThisWeek(new Date(app.date)) && app.status !== 'cancelled'
    );

    setStats({
      totalToday: todayAppointments.length,
      upcomingToday,
      completedToday,
      cancelledToday,
      totalWeek: weekAppointments.length
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    }
    setSelectedDate(newDate);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'In attesa';
      case 'confirmed': return 'Confermato';
      case 'completed': return 'Completato';
      case 'cancelled': return 'Cancellato';
      default: return 'Sconosciuto';
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        { status: newStatus }
      );

      // Aggiorna lo stato localmente
      setAppointments(appointments.map(app =>
        app._id === appointmentId
          ? { ...app, status: newStatus }
          : app
      ));

      // Ricalcola le statistiche
      calculateStats(appointments.map(app =>
        app._id === appointmentId
          ? { ...app, status: newStatus }
          : app
      ));
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Errore nell\'aggiornamento dello stato dell\'appuntamento.');
    }
  };

  const renderDateNavigation = () => (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => navigateDate('prev')}
        className="p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="text-center">
        {viewMode === 'week' ? (
          <div className="font-medium">
            {format(
              new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 1),
              'd MMMM',
              { locale: it }
            )} - {format(
              new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 7),
              'd MMMM yyyy',
              { locale: it }
            )}
          </div>
        ) : (
          <div className="font-medium">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
          </div>
        )}
      </div>

      <button
        onClick={() => navigateDate('next')}
        className="p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Appuntamenti oggi</p>
        <p className="text-xl font-bold">{stats.totalToday}</p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
        <p className="text-sm text-gray-400">In programma oggi</p>
        <p className="text-xl font-bold">{stats.upcomingToday}</p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Completati oggi</p>
        <p className="text-xl font-bold">{stats.completedToday}</p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Cancellati oggi</p>
        <p className="text-xl font-bold">{stats.cancelledToday}</p>
      </div>
      <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Questa settimana</p>
        <p className="text-xl font-bold">{stats.totalWeek}</p>
      </div>
    </div>
  );

  const renderViewSelector = () => (
    <div className="flex mb-6 space-x-2 bg-[var(--bg-primary)] p-1 rounded-lg inline-flex">
      <button
        onClick={() => {
          setViewMode('today');
          setSelectedDate(new Date());
        }}
        className={`px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'today'
            ? 'bg-[var(--accent)] text-white'
            : 'hover:bg-[var(--bg-secondary)]'
        }`}
      >
        Oggi
      </button>
      <button
        onClick={() => {
          setViewMode('week');
          setSelectedDate(new Date());
        }}
        className={`px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'week'
            ? 'bg-[var(--accent)] text-white'
            : 'hover:bg-[var(--bg-secondary)]'
        }`}
      >
        Settimana
      </button>
      <button
        onClick={() => setViewMode('date')}
        className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
          viewMode === 'date'
            ? 'bg-[var(--accent)] text-white'
            : 'hover:bg-[var(--bg-secondary)]'
        }`}
      >
        <Calendar className="w-4 h-4 mr-2" />
        Data
      </button>
      {viewMode === 'date' && (
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="ml-2 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--accent)]"
        />
      )}
    </div>
  );

  const renderAppointmentCard = (appointment) => {
    const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
    const isPast = isBefore(appointmentTime, new Date());
    const isToday = new Date(appointment.date).toDateString() === new Date().toDateString();

    return (
      <div
        key={appointment._id}
        className={`bg-[var(--bg-primary)] p-4 rounded-lg mb-4 border-l-4 ${
          appointment.status === 'cancelled'
            ? 'border-red-500 opacity-60'
            : isPast && appointment.status !== 'completed'
            ? 'border-yellow-500'
            : isToday
            ? 'border-[var(--accent)]'
            : 'border-blue-500'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">
                {appointment.client?.firstName} {appointment.client?.lastName}
              </h3>
              <span
                className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(appointment.status)} text-white`}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>

            <p className="text-sm text-gray-400">
              {appointment.client?.email} • {appointment.client?.phone || 'N/A'}
            </p>

            <div className="mt-3">
              <p className="font-medium">{appointment.service}</p>
              <p className="text-sm text-gray-400">
                {format(new Date(appointment.date), 'EEEE d MMMM', { locale: it })} •{' '}
                {appointment.time} • {appointment.duration} min
              </p>
              <p className="mt-1 font-medium text-[var(--accent)]">
                CHF {appointment.price?.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {appointment.status !== 'cancelled' && (
              <div className="flex gap-2">
                {appointment.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(appointment._id, 'completed')}
                    className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Completato
                  </button>
                )}
                {appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                    className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Cancella
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--accent)]">
        Appuntamenti
      </h2>

      {renderViewSelector()}

      {renderStats()}

      {viewMode !== 'today' && renderDateNavigation()}

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map(appointment => renderAppointmentCard(appointment))}
        </div>
      ) : (
        <div className="text-center py-10 bg-[var(--bg-primary)] rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-400">
            Nessun appuntamento {viewMode === 'today' ? 'per oggi' : 'in questo periodo'}
          </p>
        </div>
      )}
    </div>
  );
}

export default BarberAppointments;
