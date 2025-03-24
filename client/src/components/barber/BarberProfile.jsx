import { AlertCircle, Check, Eye, EyeOff, Lock, LogOut, Mail, Phone, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { barberApi } from '../../config/barberApi';
import { useAuth } from '../../context/AuthContext';

function BarberProfile({ barberId }) {
  const { user, logout, updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barber, setBarber] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (barberId) {
      fetchBarberData();
    }
  }, [barberId]);

  // Auto-hide success message after a few seconds
  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // Hide after 5 seconds
    }
    return () => clearTimeout(timer);
  }, [success]);

  const fetchBarberData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await barberApi.getBarberDetails(barberId);

      setBarber(response);
      setFormData({
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        email: response.email || '',
        phone: response.phone || '',
        bio: response.bio || ''
      });

    } catch (error) {
      console.error('Error fetching barber data:', error);
      setError('Errore nel caricamento dei dati del barbiere. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validazione
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError('Tutti i campi contrassegnati con * sono obbligatori.');
        setSaving(false);
        return;
      }

      // Validazione email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Inserisci un indirizzo email valido.');
        setSaving(false);
        return;
      }

      // Validazione telefono (formato internazionale)
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
        setError('Inserisci un numero di telefono valido (formato internazionale).');
        setSaving(false);
        return;
      }

      // Salva i dati del profilo
      await barberApi.updateBarberProfile(barberId, formData);

      // Aggiorna anche i dati dell'utente nel contesto di autenticazione
      if (updateUserInfo) {
        updateUserInfo({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        });
      }

      setSuccess('Profilo aggiornato con successo!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Errore durante l\'aggiornamento del profilo. Riprova più tardi.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validazione
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('Tutti i campi sono obbligatori.');
        setSaving(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Le nuove password non corrispondono.');
        setSaving(false);
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('La nuova password deve essere di almeno 8 caratteri.');
        setSaving(false);
        return;
      }

      // Invia richiesta di cambio password
      await barberApi.changePassword({
        userId: user._id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Mostra messaggio di successo con animazione
      setSuccess('Password cambiata con successo! Una email di conferma è stata inviata al tuo indirizzo email.');

      // Reset del form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Nascondi il form della password
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        setError('La password attuale non è corretta.');
      } else {
        setError('Errore durante il cambio della password. Riprova più tardi.');
      }
    } finally {
      setSaving(false);
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
      <h2 className="text-2xl font-bold text-[var(--accent)]">
        Profilo Barbiere
      </h2>

      {/* Messaggi di errore e successo migliorati */}
      {error && (
        <div className="notification-error">
          <AlertCircle className="notification-icon w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="notification-success animate-fadeInSlideDown">
          <Check className="notification-icon w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      {/* Sezione Informazioni Personali */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Informazioni Personali
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Inserisci il tuo nome"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cognome *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Inserisci il tuo cognome"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Inserisci la tua email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Telefono *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="+41791234567"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Bio (opzionale)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
              placeholder="Inserisci una breve descrizione di te..."
              rows="4"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
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
          </div>
        </form>
      </div>

      {/* Sezione Sicurezza */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Sicurezza
        </h3>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors flex items-center"
          >
            <Lock className="w-4 h-4 mr-2" />
            Cambia Password
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Password Attuale *
              </label>
              <div className="relative password-field-focus">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={passwordVisibility.currentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Inserisci la tua password attuale"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('currentPassword')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 password-toggle-icon"
                >
                  {passwordVisibility.currentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nuova Password *
              </label>
              <div className="relative password-field-focus">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={passwordVisibility.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Inserisci la nuova password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 password-toggle-icon"
                >
                  {passwordVisibility.newPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                La password deve essere di almeno 8 caratteri.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Conferma Nuova Password *
              </label>
              <div className="relative password-field-focus">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={passwordVisibility.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--accent)]"
                  placeholder="Conferma la nuova password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 password-toggle-icon"
                >
                  {passwordVisibility.confirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Cambia Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sezione Logout */}
      <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </h3>

        <p className="mb-4 text-sm text-gray-400">
          Clicca il pulsante sottostante per effettuare il logout dalla tua sessione.
        </p>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default BarberProfile;
