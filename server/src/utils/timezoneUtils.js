// timezoneUtils.js (versione aggiornata)
import { format, parseISO } from 'date-fns';
import { format as formatTz, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { it } from 'date-fns/locale';

export const timezoneUtils = {
  // Converti data/ora locale in UTC
  toUTC: (dateTime, timezone) => {
    const zonedDate = zonedTimeToUtc(dateTime, timezone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  },

  // Converti UTC in ora locale
  fromUTC: (utcDateTime, timezone) => {
    const zonedDate = utcToZonedTime(utcDateTime, timezone);
    return formatTz(zonedDate, 'HH:mm', { timeZone: timezone });
  },

  // Formatta la data per la visualizzazione
  formatDateTime: (dateTime, timezone) => {
    const zonedDate = utcToZonedTime(parseISO(dateTime), timezone);
    return format(zonedDate, 'EEEE d MMMM yyyy HH:mm', { locale: it });
  },

  // Validazione slot temporale
  isValidTimeSlot: (date, time, timezone) => {
    const now = new Date();
    const slotDate = utcToZonedTime(
      new Date(`${date}T${time}`),
      timezone
    );
    return slotDate > now;
  }
};

// Middleware per gestire il timezone
export const timezoneMiddleware = (req, res, next) => {
  req.timezone = req.headers['x-timezone'] || 'Europe/Rome';
  next();
};
