import { Eye, EyeOff, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const textSecondaryClass = "text-opacity-70 text-[var(--text-primary)]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Errore durante la registrazione');
      }

      // Successful registration
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Errore durante la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] theme-transition pt-16 md:pt-24">
      <div className="max-w-md w-full space-y-6 p-8 bg-[var(--bg-secondary)] rounded-lg shadow-lg theme-transition my-8">
        <h2 className="text-3xl font-bold text-center text-[var(--accent)]">
          Crea il tuo account
        </h2>

        {error && (
          <div className="error-message p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Nome</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="Nome"
                required
                className="login-input text-[var(--text-primary)] w-full"
              />
            </div>
            <div>
              <label htmlFor="lastName" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Cognome</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Cognome"
                required
                className="login-input text-[var(--text-primary)] w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Email"
              required
              className="login-input text-[var(--text-primary)] w-full"
            />
          </div>

          <div>
            <label htmlFor="phone" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Telefono</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Telefono"
              required
              className="login-input text-[var(--text-primary)] w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Password</label>
            <div className="relative password-field-focus">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Password"
                required
                className="login-input text-[var(--text-primary)] w-full"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-icon"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>Conferma Password</label>
            <div className="relative password-field-focus">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Conferma Password"
                required
                className="login-input text-[var(--text-primary)] w-full"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-icon"
                aria-label={showConfirmPassword ? "Nascondi password di conferma" : "Mostra password di conferma"}
              >
                {showConfirmPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--accent)] hover-glow text-white font-bold py-3 px-4 rounded transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 login-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registrazione in corso...</span>
                </>
              ) : (
                <span>Registrati</span>
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className={textSecondaryClass}>
              Hai già un account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[var(--accent)] hover:opacity-80 font-medium transition-colors"
              >
                Accedi
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
