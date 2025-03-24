import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import React from 'react';

export const AppointmentsByDate = ({ date, appointments, onStatusChange }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4 text-[var(--accent)]">
        {format(new Date(date), 'EEEE d MMMM yyyy', { locale: it })}
      </h3>
      <div className="space-y-4">
        {appointments.map(appointment => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
};
