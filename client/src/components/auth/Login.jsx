import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [formFocused, setFormFocused] = useState(false);
  // Stati per gestire il focus sui campi
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Attiva l'animazione di ingresso quando il componente monta
    const timer = setTimeout(() => {
      setFormFocused(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email o password non validi');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Mostra l'animazione di successo
      setLoginSuccess(true);
      await login(data.user);

      // Aspetta che l'animazione finisca prima di reindirizzare
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Email o password non validi');
      setLoginSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setResetMessage('');
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore nel reset della password');
      }

      setResetMessage('Password resettata con successo! Controlla la tua email per le istruzioni.');
      setTimeout(() => {
        setShowResetForm(false);
        setResetEmail('');
        setResetMessage('');
      }, 5000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Errore nel reset della password');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleResetForm = (show) => {
    // Aggiungi un'animazione fluida quando si passa tra i form
    setFormFocused(false);
    setTimeout(() => {
      setShowResetForm(show);
      setError('');
      setResetMessage('');
      setTimeout(() => setFormFocused(true), 50);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] theme-transition pt-16 md:pt-20">
      <div
        className={`max-w-md w-full space-y-6 p-8 bg-[var(--bg-secondary)] rounded-lg shadow-lg relative overflow-hidden theme-transition my-8 transition-all duration-500 ${formFocused ? 'scale-100 opacity-100' : 'scale-95 opacity-90'}`}
      >
        {/* Animazione di successo */}
        {loginSuccess && (
          <div className="success-animation absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)] z-10 animate-fadeIn">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounceIn" />
              <p className="text-[var(--text-primary)] text-lg font-semibold animate-fadeUp">
                Accesso effettuato con successo!
              </p>
            </div>
          </div>
        )}

        <div className="transform transition-all duration-500">
          <h2 className={`mt-2 text-center text-3xl font-extrabold text-[var(--accent)] transition-all duration-500 ${formFocused ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {showResetForm ? 'Reset Password' : 'Accedi al tuo account'}
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center animate-shake">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded text-center animate-pulse">
            {resetMessage}
          </div>
        )}

        {!showResetForm ? (
          <form className={`mt-6 space-y-5 transition-all duration-500 ${formFocused ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative group">
                <div className="flex items-center relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center transition-all duration-300 ${emailFocused || email ? 'opacity-40' : 'opacity-70'}`}>
                    <Mail className={`h-5 w-5 text-[var(--text-primary)] transition-colors duration-200 ${emailFocused ? 'text-[var(--accent)]' : ''}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    className="login-input text-[var(--text-primary)] pl-10 w-full transition-all duration-300 focus:border-[var(--accent)] border-[var(--text-primary)] border-opacity-20 rounded-md"
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="relative group password-field-focus">
                <div className="flex items-center relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center transition-all duration-300 ${passwordFocused || password ? 'opacity-40' : 'opacity-70'}`}>
                    <Lock className={`h-5 w-5 text-[var(--text-primary)] transition-colors duration-200 ${passwordFocused ? 'text-[var(--accent)]' : ''}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="login-input text-[var(--text-primary)] pl-10 w-full transition-all duration-300 focus:border-[var(--accent)] border-[var(--text-primary)] border-opacity-20 rounded-md"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-icon"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5 hover:text-[var(--accent)] transition-colors duration-200" />
                    ) : (
                      <EyeOff className="h-5 w-5 hover:text-[var(--accent)] transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--accent)] hover-glow text-white font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 login-button hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Accesso in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Accedi</span>
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => toggleResetForm(true)}
                  className="text-[var(--accent)] hover:opacity-80 text-sm font-medium transition-colors duration-300 hover:underline"
                >
                  Password dimenticata?
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-[var(--accent)] hover:opacity-80 text-sm font-medium transition-colors duration-300 hover:underline"
                >
                  Crea account
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form className={`mt-6 space-y-5 transition-all duration-500 ${formFocused ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} onSubmit={handleResetPassword}>
            <div className="relative group">
              <div className="flex items-center relative">
                <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center transition-all duration-300 ${emailFocused || resetEmail ? 'opacity-40' : 'opacity-70'}`}>
                  <Mail className={`h-5 w-5 text-[var(--text-primary)] transition-colors duration-200 ${emailFocused ? 'text-[var(--accent)]' : ''}`} />
                </div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  className="login-input text-[var(--text-primary)] pl-10 w-full transition-all duration-300 focus:border-[var(--accent)] border-[var(--text-primary)] border-opacity-20 rounded-md"
                  placeholder="Inserisci la tua email"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--accent)] hover-glow text-white font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 login-button hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Invio in corso...</span>
                  </>
                ) : (
                  <span>Ripristina password</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleResetForm(false)}
                className="text-[var(--accent)] hover:opacity-80 text-sm font-medium transition-colors duration-300 hover:underline"
              >
                Torna al login
              </button>
            </div>
          </form>
        )}

        {/* Linee decorative animate */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent opacity-50"></div>
      </div>
    </div>
  );
}

export default Login;
