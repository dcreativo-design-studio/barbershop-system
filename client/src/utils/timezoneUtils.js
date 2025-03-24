import { format, formatISO, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export const timezoneUtils = {
  // Converti data e ora locali in UTC per invio al server
  toUTC: (date, time) => {
    const localDateTime = `${date}T${time}`;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatISO(zonedTimeToUtc(localDateTime, userTimezone));
  },

  // Converti data UTC dal server in ora locale
  fromUTC: (utcDateTime) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = utcToZonedTime(utcDateTime, userTimezone);

    return {
      date: format(localDate, 'yyyy-MM-dd'),
      time: format(localDate, 'HH:mm')
    };
  },

  // Ottieni il timezone locale del browser
  getUserTimezone: () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Formatta una data per la visualizzazione
  formatDateTime: (dateTime, formatStr = 'dd/MM/yyyy HH:mm') => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = utcToZonedTime(parseISO(dateTime), userTimezone);
    return format(localDate, formatStr);
  }
};
