import { Calendar, Clock, LogOut, Menu, Moon, Settings, Sun, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

function Navbar({ onThemeToggle, isDark }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    // Controlla se siamo nella homepage
    const isHomePage = location.pathname === '/';

    useEffect(() => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const mouseY = window.event?.clientY ?? 0;

        // Aggiorna lo stato di trasparenza/solido della navbar
        if (currentScrollY > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }

        // Gestione della visibilità
        if (currentScrollY > lastScrollY && currentScrollY > 50 && mouseY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('mousemove', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleScroll);
      };
    }, [lastScrollY]);

    const handleLogout = () => {
      logout();
      navigate('/login');
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
    };

    // Chiude i menu quando si cambia rotta
    useEffect(() => {
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
    }, [location]);

    // Determina la classe di background della navbar basata sulla posizione di scroll e se è la homepage
    const getNavbarClass = () => {
      let baseClass = 'fixed top-0 w-full z-50 transition-all duration-300 ';

      // Aggiungi classe di trasformazione basata sulla visibilità
      baseClass += isVisible ? 'translate-y-0 ' : '-translate-y-full ';

      // Aggiungi classe di background basata su scroll e homepage
      if (isHomePage && !isScrolled) {
        baseClass += 'bg-transparent '; // Trasparente quando in cima alla homepage
      } else {
        baseClass += 'bg-[var(--bg-secondary)] shadow-lg '; // Solido in altri casi
      }

      return baseClass;
    };

    return (
      <nav className={getNavbarClass()}>
        <div className="mx-auto px-4 h-16">
          <div className="flex justify-between items-center h-full">
            <Link to="/" className="h-10 flex items-center">
              <img
                src={logo}
                alt="Your Style Barber Logo"
                className="h-full object-contain hover:opacity-80 transition-opacity"
              />
            </Link>

            <div className="flex items-center">
              {/* Menu desktop */}
              <div className="hidden md:flex items-center space-x-6">
                {user ? (
                  <>
                    <Link
                      to="/booking"
                      className="text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                    >
                      Prenota
                    </Link>
                    <Link
                      to="/waiting-list"
                      className="text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                    >
                      Lista d'attesa
                    </Link>

                    {(user?.role === 'admin' || user?.role === 'barber') && (
                      <Link
                        to={user?.role === 'admin' ? "/admin" : "/barber"}
                        className="text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                      >
                        {user?.role === 'admin' ? "Pannello Admin" : "Pannello Barbiere"}
                      </Link>
                    )}

                    {/* Menu utente desktop */}
                    <div className="relative group">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                      >
                        <span className="text-[var(--accent)]">{user.firstName}</span>
                        <div className="w-8 h-8 bg-[var(--accent)] text-white rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      </button>

                      {/* Dropdown menu */}
                      {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-gray-700">
                          <Link
                            to="/profile"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--accent)]"
                          >
                            <User className="w-4 h-4" />
                            <span>Profilo</span>
                          </Link>
                          <Link
                            to="/booking"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--accent)]"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>I miei appuntamenti</span>
                          </Link>
                          <Link
                            to="/waiting-list"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--accent)]"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Lista d'attesa</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Menu per utenti non loggati
                  <>
                    <Link
                      to="/login"
                      className="text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                    >
                      Accedi
                    </Link>
                    <Link
                      to="/register"
                      className="text-[var(--text-primary)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                    >
                      Registrati
                    </Link>
                    <Link
                      to="/guest-booking"
                      className="bg-[var(--accent)] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      Prenota
                    </Link>
                  </>
                )}
              </div>

              {/* Theme Switcher */}
              <button
                onClick={onThemeToggle}
                className="ml-6 p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Mobile Menu Button */}
              <button className="ml-4 md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-[var(--text-primary)]" />
                ) : (
                  <Menu className="w-6 h-6 text-[var(--text-primary)]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden bg-[var(--bg-secondary)] backdrop-blur-sm transition-all duration-300 ${
          isMenuOpen ? 'max-h-screen border-t border-gray-700' : 'max-h-0'
        } overflow-hidden shadow-lg`}>
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                {/* User info in mobile menu */}
                <div className="flex items-center space-x-3 py-3 border-b border-gray-700 mb-2">
                  <div className="w-10 h-10 bg-[var(--accent)] text-white rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[var(--accent)] font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-[var(--text-primary)] opacity-70">{user.email}</p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center space-x-3 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>Il mio profilo</span>
                </Link>

                <Link
                  to="/booking"
                  className="flex items-center space-x-3 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Prenota appuntamento</span>
                </Link>

                <Link
                  to="/waiting-list"
                  className="flex items-center space-x-3 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Clock className="w-5 h-5" />
                  <span>Lista d'attesa</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-3 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Pannello Admin</span>
                  </Link>
                )}

                {user?.role === 'barber' && (
                  <Link
                    to="/barber"
                    className="flex items-center space-x-3 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Pannello Barbiere</span>
                  </Link>
                )}

                {/* Logout button in mobile menu */}
                <div className="pt-2 mt-2 border-t border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 py-3 text-red-500 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              // Menu mobile per utenti non loggati
              <>
                <Link
                  to="/login"
                  className="block py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link
                  to="/register"
                  className="block py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrati
                </Link>
                <Link
                  to="/guest-booking"
                  className="block py-3 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Prenota come ospite
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
}

export default Navbar;
