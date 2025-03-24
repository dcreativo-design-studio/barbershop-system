import { Calendar, Clipboard, Clock, Scissors, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { barberApi } from '../../config/barberApi';
import { useAuth } from '../../context/AuthContext';
import BarberAppointments from './BarberAppointments';
import BarberProfile from './BarberProfile';
import BarberSchedule from './BarberSchedule';
import BarberServices from './BarberServices';
import BarberStats from './BarberStats';

function BarberDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const { user, logout } = useAuth();
  const [barberId, setBarberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBarberDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // Verifica che l'utente sia un barbiere
        if (!user) {
          setError('Utente non autenticato.');
          return;
        }

        if (user?.role !== 'barber') {
          setError('Accesso non autorizzato. Questa pagina è riservata ai barbieri.');
          return;
        }

        if (user?.barberId) {
          console.log("Usando barberId esistente:", user.barberId);
          setBarberId(user.barberId);
        } else {
          // Se il barberId non è ancora collegato all'utente, cerca il barbiere per email
          console.log("Cercando barbiere per email:", user.email);
          try {
            const data = await barberApi.findBarberByEmail(user.email);
            console.log("Risposta findBarberByEmail:", data);

            if (data?._id || data?.id) {
              setBarberId(data._id || data.id);
            } else {
              console.error('Nessun ID barbiere trovato nella risposta:', data);
              setError('Impossibile trovare il profilo barbiere associato a questo account.');
            }
          } catch (findError) {
            console.error('Error in findBarberByEmail:', findError);
            if (findError.response) {
              console.error('Response error:', findError.response.data);
              setError(`Errore nel recupero dei dati del barbiere: ${findError.response.data.message || findError.message}`);
            } else {
              setError('Errore nel recupero dei dati del barbiere per email.');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching barber details:', err);
        setError('Si è verificato un errore nel caricamento dei dati.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBarberDetails();
    }
  }, [user]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-500 text-white p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={logout}
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      );
    }

    if (!barberId) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl text-red-500">Profilo barbiere non trovato</h2>
          <p className="text-gray-300 mb-4">
            Non è stato possibile trovare un profilo barbiere associato al tuo account.
            Contatta l'amministratore per assistenza.
          </p>
          <button
            onClick={logout}
            className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'appointments':
        return <BarberAppointments barberId={barberId} />;
      case 'schedule':
        return <BarberSchedule barberId={barberId} />;
      case 'services':
        return <BarberServices barberId={barberId} />;
      case 'profile':
        return <BarberProfile barberId={barberId} />;
      case 'stats':
        return <BarberStats barberId={barberId} />;
      default:
        return <BarberAppointments barberId={barberId} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 pt-20"> {/* Aggiunto pt-20 */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--accent)] mb-8">
          Pannello Barbiere
          {user && (
            <span className="text-lg ml-2 opacity-70">
              {user.firstName} {user.lastName}
            </span>
          )}
        </h1>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              activeTab === 'appointments'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Appuntamenti
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              activeTab === 'schedule'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Orari e Vacanze
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              activeTab === 'services'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            <Scissors className="w-4 h-4 mr-2" />
            Servizi
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            <Clipboard className="w-4 h-4 mr-2" />
            Statistiche
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Profilo
          </button>
        </div>

        {/* Content */}
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default BarberDashboard;
