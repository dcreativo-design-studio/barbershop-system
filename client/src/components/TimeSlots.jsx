import { addMinutes, format, parse } from 'date-fns';
import { Coffee, Palmtree } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const generateTimeSlots = (openingTime, closingTime) => {
  if (!openingTime || !closingTime) {
    console.error('Invalid openingTime or closingTime:', { openingTime, closingTime });
    return [];
  }

  try {
    const slots = [];
    let currentTime = parse(openingTime, 'HH:mm', new Date());
    const endTime = parse(closingTime, 'HH:mm', new Date());
    const baseInterval = 15;

    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');
      slots.push(timeString);
      currentTime = addMinutes(currentTime, baseInterval);
    }

    return slots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    return [];
  }
};

function TimeSlots({
  selectedDate,
  selectedService,
  availableSlots = [],
  onSelectTime,
  selectedTime,
  selectedBarber,
  barbers = []
}) {
  const [localAvailableSlots, setLocalAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [barberWorkingHours, setBarberWorkingHours] = useState(null);
  const [isBarberOnVacation, setIsBarberOnVacation] = useState(false);
  const [vacationInfo, setVacationInfo] = useState(null);

  // Funzione per ottenere il giorno della settimana
  const getDayOfWeek = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    } catch (error) {
      console.error('Error getting day of week:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkBarberVacation = async () => {
      if (!selectedDate || !selectedBarber) {
        console.log('Missing required data:', { selectedDate, selectedBarber });
        return;
      }

      try {
        console.log('Checking vacation for:', {
          date: selectedDate,
          barberId: selectedBarber
        });

        // Aggiornato URL
        const response = await fetch(
          `${API_BASE_URL}/barbers/${selectedBarber}/check-vacation?date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Vacation check full response:', data);

        setIsBarberOnVacation(data.isOnVacation);
        setVacationInfo(data.vacationInfo);

        if (data.isOnVacation) {
          console.log('Barber is on vacation - blocking slot generation');
          setLocalAvailableSlots([]);
          return;
        } else {
          console.log('Barber is not on vacation - proceeding with slot generation');
        }
      } catch (error) {
        console.error('Error checking vacation:', error);
        setError('Errore nel controllo delle vacanze');
        setLocalAvailableSlots([]);
      }
    };

    checkBarberVacation();
  }, [selectedDate, selectedBarber]);

  // Aggiungi questo useEffect per debug
  useEffect(() => {
    console.log('Current vacation state:', {
      isBarberOnVacation,
      vacationInfo,
      selectedDate,
      availableSlots: localAvailableSlots.length
    });
  }, [isBarberOnVacation, vacationInfo, selectedDate, localAvailableSlots]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate || !selectedBarber || !selectedService) {
        return;
      }

      setLoading(true);
      try {
        // Aggiornato primo URL
        const barberResponse = await fetch(
          `${API_BASE_URL}/appointments/public/barbers/${selectedBarber}`
        );

        if (!barberResponse.ok) {
          throw new Error('Errore nel recupero dei dati del barbiere');
        }

        const barberData = await barberResponse.json();
        const dayOfWeek = getDayOfWeek(selectedDate);

        if (!dayOfWeek) {
          throw new Error('Errore nel calcolo del giorno della settimana');
        }

        const workingHours = barberData.workingHours?.find(wh => wh.day === dayOfWeek);
        console.log('Working hours found:', workingHours);

        setBarberWorkingHours(workingHours);

        if (!workingHours?.isWorking || isBarberOnVacation) {
          setLocalAvailableSlots([]);
          return;
        }

        // Aggiornato secondo URL
        const slotsResponse = await fetch(
          `${API_BASE_URL}/appointments/public/available-slots?${new URLSearchParams({
            barberId: selectedBarber,
            date: selectedDate,
            duration: selectedService.duration
          })}`
        );

        if (!slotsResponse.ok) {
          throw new Error('Errore nel caricamento degli slot disponibili');
        }

        const slots = await slotsResponse.json();

        const enrichedSlots = slots.map(slot => ({
          ...slot,
          workingHours: {
            hasBreak: workingHours.hasBreak || false,
            breakStart: workingHours.breakStart || null,
            breakEnd: workingHours.breakEnd || null,
            startTime: workingHours.startTime,
            endTime: workingHours.endTime
          }
        }));

        setLocalAvailableSlots(enrichedSlots);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedBarber, selectedService, isBarberOnVacation]);

  if (loading) {
    return <div className="text-center p-4">Caricamento slot...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  // Controlla prima se il barbiere è in vacanza
  if (isBarberOnVacation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-100 rounded-lg">
        <Palmtree className="h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg font-semibold text-blue-800">
          Il barbiere è in vacanza
        </p>
        {vacationInfo && (
          <p className="text-sm text-blue-600 mt-2">
            Dal {new Date(vacationInfo.startDate).toLocaleDateString('it-IT')} al{' '}
            {new Date(vacationInfo.endDate).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>
    );
  }

  // Se il barbiere non lavora in questo giorno
  if (!barberWorkingHours?.isWorking) {
    const dayName = new Date(selectedDate).toLocaleDateString('it-IT', {
      weekday: 'long'
    });
    return (
      <div className="text-center p-8 bg-gray-100 rounded-lg">
        <p className="text-lg font-semibold text-gray-800 capitalize">
          {dayName} chiuso
        </p>
      </div>
    );
  }

  const isLunchBreak = (time) => {
    if (!time || !barberWorkingHours?.hasBreak) return false;

    try {
      const { breakStart, breakEnd } = barberWorkingHours;
      if (!breakStart || !breakEnd) return false;

      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const currentTime = timeToMinutes(time);
      const breakStartTime = timeToMinutes(breakStart);
      const breakEndTime = timeToMinutes(breakEnd);

      return currentTime >= breakStartTime && currentTime < breakEndTime;
    } catch (error) {
      console.error('Error checking lunch break:', error);
      return false;
    }
  };

  const getSlotClasses = (time) => {
    const baseClasses = "p-2 rounded transition-all flex items-center justify-center gap-1 ";
    const slot = localAvailableSlots.find(s => s.time === time);

    if (!slot) {
      return {
        className: `${baseClasses} bg-gray-600 text-gray-400 cursor-not-allowed`,
        showCoffee: false,
        showLock: false
      };
    }

    const isBreak = isLunchBreak(time);
    const isBooked = slot.isBooked;
    const isPast = new Date(`${selectedDate}T${time}`) <= new Date();

    if (isPast) {
      return {
        className: `${baseClasses} bg-gray-600 text-gray-400 cursor-not-allowed`,
        showCoffee: false,
        showLock: false
      };
    }

    if (isBreak) {
      return {
        className: `${baseClasses} bg-orange-400 text-white cursor-not-allowed`,
        showCoffee: true,
        showLock: false
      };
    }

    if (isBooked) {
      return {
        className: `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`,
        showCoffee: false,
        showLock: true
      };
    }

    return {
      className: `${baseClasses} ${
        selectedTime === time
          ? "bg-[var(--accent)] text-white"
          : "bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white"
      }`,
      showCoffee: false,
      showLock: false
    };
  };

  if (loading) {
    return <div className="text-center p-4">Caricamento slot...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!barberWorkingHours) {
    return <div className="text-center p-4">Nessun orario di lavoro disponibile per questo giorno</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {generateTimeSlots(barberWorkingHours.startTime, barberWorkingHours.endTime).map((time) => {
        const { className, showCoffee, showLock } = getSlotClasses(time);
        const slot = localAvailableSlots.find(s => s.time === time);

        return (
          <button
            key={time}
            type="button"
            onClick={() => slot?.available && onSelectTime(time)}
            disabled={!slot?.available || showCoffee || showLock}
            className={className}
            title={
              showCoffee ? 'Pausa Pranzo' :
              showLock ? 'Slot già prenotato' :
              !slot?.available ? 'Slot non disponibile' : 'Disponibile'
            }
          >
            {time}
            {showCoffee && <Coffee className="h-4 w-4 ml-1" />}
            {showLock && <span className="ml-1">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}

export default TimeSlots;
