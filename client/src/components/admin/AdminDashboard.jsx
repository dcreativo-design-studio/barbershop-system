import {
  BarChart2,
  Calendar,
  Clock,
  PanelTop,
  Scissors,
  User,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppointmentCalendar from './AppointmentCalendar';
import BarberManager from './BarberManager';
import ServiceManager from './ServiceManager';
import Stats from './Stats';
import UserManager from './UserManager';
import WaitingListManager from './WaitingListManager';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const { user } = useAuth();

  // Verifica se l'utente è admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl text-red-500">Accesso non autorizzato</h2>
        <p className="text-gray-300">Devi essere un amministratore per accedere a questa pagina.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentCalendar />;
      case 'services':
        return <ServiceManager />;
      case 'users':
        return <UserManager />;
      case 'barbers':
        return <BarberManager />;
      case 'waitinglist':
        return <WaitingListManager />;
      case 'stats':
        return <Stats />;
      default:
        return <AppointmentCalendar />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <PanelTop className="w-8 h-8 mr-3 text-[var(--accent)]" />
          <h1 className="text-3xl font-bold text-[var(--accent)]">
            Pannello Amministrativo
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'appointments'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <Calendar className={`w-5 h-5 mr-2 ${activeTab === 'appointments' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Appuntamenti
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'services'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <Scissors className={`w-5 h-5 mr-2 ${activeTab === 'services' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Servizi
          </button>

          <button
            onClick={() => setActiveTab('barbers')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'barbers'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <Users className={`w-5 h-5 mr-2 ${activeTab === 'barbers' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Barbieri
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'users'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <User className={`w-5 h-5 mr-2 ${activeTab === 'users' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Utenti
          </button>

          <button
            onClick={() => setActiveTab('waitinglist')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'waitinglist'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <Clock className={`w-5 h-5 mr-2 ${activeTab === 'waitinglist' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Lista d'attesa
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg ${
              activeTab === 'stats'
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-opacity-90'
            }`}
          >
            <BarChart2 className={`w-5 h-5 mr-2 ${activeTab === 'stats' ? 'text-white' : 'text-[var(--accent)]'}`} />
            Statistiche
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

export default AdminDashboard;
