import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_TIMEZONE } from '../config/timezoneConfig';

// Crea il context con un valore predefinito
const TimezoneContext = createContext({
  timezone: DEFAULT_TIMEZONE,
  setTimezone: () => {}
});

// Wrapper di sicurezza per il Provider
export function TimezoneProvider({ children }) {
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
  );

  const value = React.useMemo(() => ({
    timezone,
    setTimezone
  }), [timezone]);

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

// Hook personalizzato con gestione errori
export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    console.warn('useTimezone must be used within a TimezoneProvider');
    return { timezone: DEFAULT_TIMEZONE, setTimezone: () => {} };
  }
  return context;
}
