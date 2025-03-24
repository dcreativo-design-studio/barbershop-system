import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BarberDashboard from './components/barber/BarberDashboard';
import BookingCalendar from './components/BookingCalendar';
import GuestBooking from './components/GuestBooking';
import HomePage from './components/HomePage';
import MarketingBarbershopSystem from './components/MarketingBarbershopSystem';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { TimezoneProvider } from './context/TimezoneContext';
import UserProfile from './pages/UserProfile';
import WaitingList from './pages/WaitingList';

function App() {
  const [theme, setTheme] = useState('dark');
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const renderRoutes = () => (
    <Routes>
      {/* Route pubbliche - accessibili a tutti */}
      <Route path="/" element={<HomePage />} />
      <Route path="/guest-booking" element={<GuestBooking />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/marketing-barber-system" element={<MarketingBarbershopSystem />} /> {/* Rotta pubblica - nessuna autenticazione richiesta */}

      {/* Route protette - richiedono autenticazione */}
      <Route
        path="/booking"
        element={user ? <BookingCalendar /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/waiting-list"
        element={user ? <WaitingList /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/admin"
        element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />}
      />
      {/* Rotta per il pannello barbiere */}
      <Route
        path="/barber"
        element={
          user?.role === 'barber' || user?.role === 'admin'
            ? <BarberDashboard />
            : <Navigate to="/" replace />
        }
      />
      <Route
        path="/profile"
        element={user ? <UserProfile /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );

  return (
    <TimezoneProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] theme-transition">
        <Navbar onThemeToggle={toggleTheme} isDark={theme === 'dark'} />
        <main className="navbar-offset">
          {renderRoutes()}
        </main>
      </div>
    </TimezoneProvider>
  );
}

export default App;
