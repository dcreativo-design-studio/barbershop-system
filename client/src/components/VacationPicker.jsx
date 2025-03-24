import { Palmtree } from 'lucide-react';
import React, { useState } from 'react';

const VacationPicker = ({ vacations = [], onChange, onDelete }) => {
  const [newVacation, setNewVacation] = useState({
    startDate: '',
    endDate: ''
  });

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('it-IT');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleAdd = () => {
    if (!newVacation.startDate || !newVacation.endDate) return;

    try {
      const startDate = new Date(newVacation.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(newVacation.endDate);
      endDate.setHours(23, 59, 59, 999);

      if (endDate < startDate) {
        alert('La data di fine deve essere successiva alla data di inizio');
        return;
      }

      onChange([...vacations, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }]);

      setNewVacation({
        startDate: '',
        endDate: ''
      });
    } catch (error) {
      console.error('Error adding vacation:', error);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">Periodo di Vacanza</h4>

      {/* Lista delle vacanze esistenti */}
      {vacations?.length > 0 && (
        <div className="space-y-2">
          {vacations.map((vacation, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded">
              <div className="flex items-center gap-3">
                <Palmtree className="h-5 w-5 text-blue-500" />
                <span>Dal: {formatDateForDisplay(vacation.startDate)}</span>
                <span>Al: {formatDateForDisplay(vacation.endDate)}</span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form per aggiungere nuove vacanze */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data Inizio</label>
          <input
            type="date"
            value={newVacation.startDate}
            min={minDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              setNewVacation(prev => ({
                ...prev,
                startDate: newStartDate,
                endDate: newStartDate > prev.endDate ? '' : prev.endDate
              }));
            }}
            className="date-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Fine</label>
          <input
            type="date"
            value={newVacation.endDate}
            min={newVacation.startDate || minDate}
            onChange={(e) => {
              setNewVacation(prev => ({
                ...prev,
                endDate: e.target.value
              }));
            }}
            className="date-input w-full"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newVacation.startDate || !newVacation.endDate}
            className="w-full h-10 bg-[var(--accent)] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aggiungi Vacanza
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacationPicker;
