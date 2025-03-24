export const DEFAULT_TIMEZONE = 'Europe/Rome';
export const AVAILABLE_TIMEZONES = [
  'Europe/Rome',
  'Europe/Zurich',
  'Europe/London',
  'Europe/Paris'
];

export const formatDateWithTimezone = (date, timezone) => {
  return new Date(date).toLocaleString('it-IT', {
    timeZone: timezone || DEFAULT_TIMEZONE
  });
};
