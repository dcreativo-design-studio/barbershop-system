import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });


  const validateImage = (file) => {
    // Controlla dimensione
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('L\'immagine non può superare i 5MB');
    }

    // Controlla tipo
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      throw new Error('Solo immagini JPG e PNG sono permesse');
    }

    return true;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImage(file);
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      // Modifica qui: aggiungi i log per debug
      console.log('Sending request to:', '/users/profile/image');
      console.log('FormData:', formData);

      const response = await apiRequest.put('/users/profile/image', formData);

      if (response?.profileImage) {
        login({ ...user, profileImage: response.profileImage });
        setMessage('Immagine profilo aggiornata con successo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      setError('');
      setMessage('');

      await apiRequest.delete('/users/profile/image');
      login({ ...user, profileImage: null });
      setMessage('Immagine profilo rimossa con successo');
    } catch (error) {
      setError(error.response?.data?.message || 'Errore durante la rimozione dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
        setError('Le nuove password non corrispondono');
        return;
      }

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };

      // Solo se stiamo cambiando la password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
        updateData.email = user.email; // Aggiungiamo l'email per la notifica
      }

      const response = await apiRequest.put('/users/profile', updateData);

      if (response.success) {
        login(response.user);
        setMessage('Profilo aggiornato con successo! Se hai modificato la password, riceverai un\'email di conferma.');
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
      } else {
        throw new Error(response.message || 'Errore durante l\'aggiornamento del profilo');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Errore durante l\'aggiornamento del profilo. Verifica le credenziali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-[var(--accent)]">Il Tuo Profilo</h2>

        {message && (
          <div className="mb-4 p-4 bg-green-500 text-white rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded">
            {error}
          </div>
        )}

        {/* Sezione Immagine Profilo */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[var(--accent)]">
              <img
                src={user?.profileImage?.url || '/default-avatar.png'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 flex space-x-2">
              <label
                className="bg-[var(--accent)] p-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                htmlFor="profile-image"
              >
                {uploading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
              {user?.profileImage?.url && (
                <button
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <input
                type="file"
                id="profile-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        {/* Resto del form esistente */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... codice esistente del form ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Nome</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)] disabled:opacity-50"
              />
            </div>

            {/* Cognome */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Cognome</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)] disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)] opacity-50"
              />
            </div>

            {/* Telefono */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Telefono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sezione Cambio Password */}
      {isEditing && (
        <div className="mt-8 p-6 bg-[var(--bg-primary)] rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-[var(--accent)]">Cambia Password</h3>
          <div className="space-y-4">
            {/* Password Attuale */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Password Attuale</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showCurrentPassword ? (
                    <Eye className="h-5 w-5" aria-label="Nascondi password attuale" />
                  ) : (
                    <EyeOff className="h-5 w-5" aria-label="Mostra password attuale" />
                  )}
                </button>
              </div>
            </div>

            {/* Nuova Password */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Nuova Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showNewPassword ? (
                    <Eye className="h-5 w-5" aria-label="Nascondi nuova password" />
                  ) : (
                    <EyeOff className="h-5 w-5" aria-label="Mostra nuova password" />
                  )}
                </button>
              </div>
            </div>

            {/* Conferma Nuova Password */}
            <div>
              <label className="block text-[var(--text-primary)] mb-2">Conferma Nuova Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <Eye className="h-5 w-5" aria-label="Nascondi conferma password" />
                  ) : (
                    <EyeOff className="h-5 w-5" aria-label="Mostra conferma password" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Pulsanti */}
          <div className="flex justify-end space-x-4 mt-6">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90"
              >
                Modifica Profilo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      currentPassword: '',
                      newPassword: '',
                      confirmNewPassword: ''
                    });
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:opacity-90"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
