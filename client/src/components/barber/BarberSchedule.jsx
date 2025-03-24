import { AlertCircle, Check, Clock, Coffee, Palmtree } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { barberApi } from '../../config/barberApi';
import VacationPicker from '../VacationPicker';

function BarberSchedule({ barberId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barber, setBarber] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    if (barberId) {
      fetchBarberData();
    }
  }, [barberId]);

  const fetchBarberData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await barberApi.getBarberDetails(barberId);
      console.log('Barber data fetched:', response);

      setBarber(response);

      // Inizializza gli orari di lavoro
      let initialWorkingHours = [];

      // Se il barbiere ha già orari di lavoro, usali
      if (response.workingHours && response.workingHours.length === 7) {
        initialWorkingHours = [...response.workingHours];
      } else {
        // Altrimenti crea orari di default
        initialWorkingHours = DAY_KEYS.map(day => ({
          day,
          isWorking: day !== 'sunday',
          startTime: '09:00',
          endTime: day === 'saturday' ? '17:00' : '19:00',
          hasBreak: true,
          breakStart: '12:00',
          breakEnd: '13:00'
        }));
      }

      // Assicura che gli orari siano ordinati correttamente
      initialWorkingHours.sort((a, b) => {
        return DAY_KEYS.indexOf(a.day) - DAY_KEYS.indexOf(b.day);
      });

      // Assicuriamoci che tutti i campi necessari esistano per ciascun giorno
      initialWorkingHours = initialWorkingHours.map(dayData => ({
        day: dayData.day,
        isWorking: Boolean(dayData.isWorking),
        startTime: dayData.startTime || '09:00',
        endTime: dayData.endTime || '18:00',
        hasBreak: Boolean(dayData.hasBreak),
        breakStart: dayData.hasBreak ? (dayData.breakStart || '12:00') : null,
        breakEnd: dayData.hasBreak ? (dayData.breakEnd || '13:00') : null
      }));

      console.log('Initialized working hours:', initialWorkingHours);
      setWorkingHours(initialWorkingHours);

      // Inizializza le vacanze
      if (response.vacations && Array.isArray(response.vacations)) {
        // Formatta le date
        const formattedVacations = response.vacations.map(vacation => ({
          startDate: vacation.startDate.split('T')[0],
          endDate: vacation.endDate.split('T')[0]
        }));
        setVacations(formattedVacations);
      }

    } catch (error) {
      console.error('Error fetching barber data:', error);
      setError('Errore nel caricamento dei dati del barbiere. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Handler per i cambiamenti negli orari di lavoro
  const handleWorkingHoursChange = (dayIndex, field, value) => {
    const updatedHours = [...workingHours];
    const currentDay = updatedHours[dayIndex];

    if (field === 'hasBreak') {
      currentDay.hasBreak = value;
      if (value) {
        currentDay.breakStart = currentDay.breakStart || '12:00';
        currentDay.breakEnd = currentDay.breakEnd || '13:00';
      } else {
        currentDay.breakStart = null;
        currentDay.breakEnd = null;
      }
    } else if (field === 'isWorking') {
      currentDay.isWorking = value;
      if (!value) {
        currentDay.hasBreak = false;
        currentDay.breakStart = null;
        currentDay.breakEnd = null;
      }
    } else {
      currentDay[field] = value;
    }

    console.log('Updated working hours:', updatedHours);
    setWorkingHours(updatedHours);
    setHasChanges(true);
  };

  // Handler per i cambiamenti nelle vacanze
  const handleVacationsChange = (newVacations) => {
    setVacations(newVacations);
    setHasChanges(true);
  };

  // Handler per l'eliminazione di una vacanza
  const handleDeleteVacation = (index) => {
    const updatedVacations = [...vacations];
    updatedVacations.splice(index, 1);
    setVacations(updatedVacations);
    setHasChanges(true);
  };

  // Salva i cambiamenti
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validazione degli orari di lavoro
      for (const hours of workingHours) {
        if (hours.isWorking) {
          if (!hours.startTime || !hours.endTime) {
            setError('Gli orari di inizio e fine sono obbligatori per i giorni lavorativi.');
            setSaving(false);
            return;
          }

          if (hours.hasBreak && (!hours.breakStart || !hours.breakEnd)) {
            setError('Gli orari di inizio e fine pausa sono obbligatori quando la pausa è attiva.');
            setSaving(false);
            return;
          }
        }
      }

      console.log('Saving working hours:', workingHours);

      // Aggiorna gli orari di lavoro - gestisci separatamente
      try {
        await barberApi.updateBarberWorkingHours(barberId, workingHours);
      } catch (workingHoursError) {
        console.error('Error updating working hours:', workingHoursError);
        throw new Error('Errore nell\'aggiornamento degli orari: ' + (workingHoursError.message || 'Errore sconosciuto'));
      }

      console.log('Working hours updated successfully');

      // Aggiorna le vacanze - gestisci separatamente
      try {
        await barberApi.updateBarberVacations(barberId, vacations);
      } catch (vacationsError) {
        console.error('Error updating vacations:', vacationsError);
        throw new Error('Errore nell\'aggiornamento delle vacanze: ' + (vacationsError.message || 'Errore sconosciuto'));
      }

      console.log('Vacations updated successfully');

      setSuccess('Modifiche salvate con successo!');
      setHasChanges(false);

      // Notifica l'amministratore delle modifiche (ma non interrompere il flusso se fallisce)
      try {
        await barberApi.notifyScheduleUpdate(barberId);
        console.log('Admin notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Non interrompiamo il flusso se la notifica fallisce
      }

    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Errore durante il salvataggio delle modifiche: ' + (error.message || 'Riprova più tardi.'));
    } finally {
      setSaving(false);

      // Nascondi il messaggio di successo dopo 3 secondi
      if (success) {
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">Dati del barbiere non trovati. Ricarica la pagina o contatta l'amministratore.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--accent)]">
          Gestione Orari e Vacanze
        </h2>
        {hasChanges && (
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500 text-white p-4 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Orari di lavoro */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Orari di Lavoro
        </h3>

        <div className="space-y-6">
          {workingHours.map((hours, index) => (
            <div key={hours.day} className="bg-[var(--bg-secondary)] p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Giorno e attivazione */}
                <div className="flex items-center space-x-4">
                  <div className="font-medium min-w-[100px]">{DAYS[index]}</div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hours.isWorking}
                      onChange={(e) => handleWorkingHoursChange(index, 'isWorking', e.target.checked)}
                      className="rounded border-[var(--accent)]"
                    />
                    <span>Attivo</span>
                  </label>
                </div>

                {/* Orari di lavoro */}
                {hours.isWorking && (
                  <>
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-sm mb-1">Apertura</label>
                        <input
                          type="time"
                          value={hours.startTime}
                          onChange={(e) => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Chiusura</label>
                        <input
                          type="time"
                          value={hours.endTime}
                          onChange={(e) => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                        />
                      </div>
                    </div>

                    {/* Pausa pranzo */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={hours.hasBreak}
                          onChange={(e) => handleWorkingHoursChange(index, 'hasBreak', e.target.checked)}
                          className="rounded border-[var(--accent)]"
                        />
                        <span className="flex items-center space-x-1">
                          <Coffee className="h-4 w-4" />
                          <span>Pausa Pranzo</span>
                        </span>
                      </label>

                      {hours.hasBreak && (
                        <div className="flex space-x-4 mt-2">
                          <div>
                            <label className="block text-sm mb-1">Inizio Pausa</label>
                            <input
                              type="time"
                              value={hours.breakStart || ''}
                              onChange={(e) => handleWorkingHoursChange(index, 'breakStart', e.target.value)}
                              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Fine Pausa</label>
                            <input
                              type="time"
                              value={hours.breakEnd || ''}
                              onChange={(e) => handleWorkingHoursChange(index, 'breakEnd', e.target.value)}
                              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestione vacanze */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Palmtree className="w-5 h-5 mr-2" />
          Gestione Vacanze
        </h3>

        <VacationPicker
          vacations={vacations}
          onChange={handleVacationsChange}
          onDelete={handleDeleteVacation}
        />
      </div>

      {/* Pulsante di salvataggio fisso in basso */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-[var(--accent)] text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default BarberSchedule;
