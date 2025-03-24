import PropTypes from 'prop-types';
import React from 'react';

export const CalendarHeader = ({
  viewType,
  onViewTypeChange,
  selectedDate,
  onDateChange,
  selectedBarber,
  onBarberChange,
  barbers
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <select
          value={viewType}
          onChange={(e) => onViewTypeChange(e.target.value)}
          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
        >
          <option value="day">Giornaliera</option>
          <option value="week">Settimanale</option>
          <option value="month">Mensile</option>
        </select>

        <select
          value={selectedBarber}
          onChange={(e) => onBarberChange(e.target.value)}
          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
        >
          <option value="">Tutti i barbieri</option>
          {barbers.map(barber => (
            <option key={barber._id} value={barber._id}>
              {barber.firstName} {barber.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
        />
      </div>
    </div>
  );
};

CalendarHeader.propTypes = {
  viewType: PropTypes.oneOf(['day', 'week', 'month']).isRequired,
  onViewTypeChange: PropTypes.func.isRequired,
  selectedDate: PropTypes.string.isRequired,
  onDateChange: PropTypes.func.isRequired,
  selectedBarber: PropTypes.string.isRequired,
  onBarberChange: PropTypes.func.isRequired,
  barbers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired
};

export default CalendarHeader;
