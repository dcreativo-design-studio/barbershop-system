import Appointment from '../models/Appointment.js';

const timeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    console.log('Invalid time string in timeToMinutes:', timeString);
    return null;
  }

  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.log('Invalid time format:', timeString);
      return null;
    }
    return (hours * 60) + minutes;
  } catch (error) {
    console.error('Error in timeToMinutes:', error);
    return null;
  }
};

const minutesToTime = (minutes) => {
  if (typeof minutes !== 'number' || minutes < 0) {
    console.log('Invalid minutes value:', minutes);
    return null;
  }

  try {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error in minutesToTime:', error);
    return null;
  }
};

const checkSlotOverlap = (slotStart, slotDuration, appointmentStart, appointmentDuration) => {
  if (!slotStart || !slotDuration || !appointmentStart || !appointmentDuration) {
    return true;
  }

  const slotEnd = slotStart + parseInt(slotDuration);
  const appointmentEnd = appointmentStart + parseInt(appointmentDuration);

  // Verifica se c'è sovrapposizione considerando l'inizio esatto
  return (slotStart < appointmentEnd && slotEnd > appointmentStart);
};

const isSlotAvailableForService = (currentMinutes, requestedDuration, appointments, workingHours) => {
  const serviceEnd = currentMinutes + parseInt(requestedDuration);

  // Verifica pausa pranzo
  if (workingHours.hasBreak && workingHours.breakStart && workingHours.breakEnd) {
    const breakStartMinutes = timeToMinutes(workingHours.breakStart);
    const breakEndMinutes = timeToMinutes(workingHours.breakEnd);

    if (currentMinutes < breakEndMinutes && serviceEnd > breakStartMinutes) {
      return false;
    }
  }

  // Verifica sovrapposizioni con altri appuntamenti
  for (const appointment of appointments) {
    const appointmentStart = timeToMinutes(appointment.time);
    if (checkSlotOverlap(
      currentMinutes,
      requestedDuration,
      appointmentStart,
      appointment.duration
    )) {
      return false;
    }
  }

  return true;
};

export async function generateAvailableSlots(barber, date, workingHours, requestedDuration) {
  try {
    // Validazione input
    if (!barber?._id) {
      throw new Error('Barbiere non valido');
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Data non valida');
    }

    if (!workingHours?.startTime || !workingHours?.endTime) {
      throw new Error('Orari di lavoro non validi');
    }

    if (!requestedDuration || isNaN(requestedDuration)) {
      throw new Error('Durata richiesta non valida');
    }

    const slots = [];
    const SLOT_INTERVAL = 15;

    // Converti gli orari di lavoro in minuti
    const workStartMinutes = timeToMinutes(workingHours.startTime);
    const workEndMinutes = timeToMinutes(workingHours.endTime);

    if (!workStartMinutes || !workEndMinutes || workStartMinutes >= workEndMinutes) {
      throw new Error('Intervallo orario di lavoro non valido');
    }

    // Converti la data per la query
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    dayEnd.setHours(23, 59, 59, 999);

    // Ottieni gli appuntamenti esistenti
    const existingAppointments = await Appointment.find({
      barber: barber._id,
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      status: { $in: ['pending', 'confirmed'] }
    }).lean();

    // Ordina gli appuntamenti per orario
    const sortedAppointments = existingAppointments
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    let currentMinutes = workStartMinutes;

    // Genera slot fino alla fine dell'orario di lavoro
    while (currentMinutes + parseInt(requestedDuration) <= workEndMinutes) {
      let isBooked = false;
      let isAvailable = true;
      let isLunchBreak = false;

      const timeString = minutesToTime(currentMinutes);
      if (!timeString) {
        currentMinutes += SLOT_INTERVAL;
        continue;
      }

      // Verifica pausa pranzo
      if (workingHours.hasBreak && workingHours.breakStart && workingHours.breakEnd) {
        const breakStartMinutes = timeToMinutes(workingHours.breakStart);
        const breakEndMinutes = timeToMinutes(workingHours.breakEnd);

        if (breakStartMinutes && breakEndMinutes) {
          if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
            isAvailable = false;
            isLunchBreak = true;
          } else if (currentMinutes < breakStartMinutes &&
                    (currentMinutes + parseInt(requestedDuration)) > breakStartMinutes) {
            isAvailable = false;
          }
        }
      }

      // Verifica sovrapposizioni con appuntamenti esistenti
      if (isAvailable) {
        for (const appointment of sortedAppointments) {
          const appointmentStartMinutes = timeToMinutes(appointment.time);

          if (appointmentStartMinutes && checkSlotOverlap(
            currentMinutes,
            parseInt(requestedDuration),
            appointmentStartMinutes,
            appointment.duration
          )) {
            isBooked = true;
            isAvailable = false;
            break;
          }
        }
      }

      // Verifica slot nel passato
      const slotDateTime = new Date(date);
      const [hours, minutes] = timeString.split(':').map(Number);
      slotDateTime.setHours(hours, minutes);

      if (slotDateTime <= new Date()) {
        isAvailable = false;
      }

      slots.push({
        time: timeString,
        available: isAvailable,
        isBooked: isBooked,
        isLunchBreak: isLunchBreak
      });

      currentMinutes += SLOT_INTERVAL;
    }

    if (slots.length === 0) {
      throw new Error('Nessuno slot disponibile per la data selezionata');
    }

    return slots;

  } catch (error) {
    console.error('Error generating slots:', error);
    throw error;
  }
}
