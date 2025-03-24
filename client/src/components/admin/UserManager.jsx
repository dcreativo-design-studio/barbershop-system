import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassword, setResetPassword] = useState({ userId: null, newPassword: '', showForm: false });
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client',
    password: '' // Campo per la password iniziale
  });

  // Configurazione base per le richieste axios
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Timer per nascondere messaggi di successo dopo 5 secondi
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/users`,
        axiosConfig
      );
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Errore nel caricamento degli utenti');
      setLoading(false);
    }
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/users`,
        newUser,
        axiosConfig
      );
      setUsers([...users, response.data]);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'client',
        password: ''
      });
      setSuccessMessage('Utente creato con successo!');
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Errore nella creazione dell\'utente: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateUser = async (id) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/users/${id}`,
        editingUser,
        axiosConfig
      );
      setUsers(users.map(user =>
        user._id === id ? response.data : user
      ));
      setEditingUser(null);
      setSuccessMessage('Utente aggiornato con successo!');
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Errore nell\'aggiornamento dell\'utente: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/admin/users/${id}`,
        axiosConfig
      );
      setUsers(users.filter(user => user._id !== id));
      setSuccessMessage('Utente eliminato con successo!');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Errore nell\'eliminazione dell\'utente: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePasswordReset = async () => {
    if (!resetPassword.userId || !resetPassword.newPassword) {
      setError('ID utente e nuova password sono richiesti');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/admin/users/${resetPassword.userId}/reset-password`,
        { newPassword: resetPassword.newPassword },
        axiosConfig
      );

      setResetPassword({ userId: null, newPassword: '', showForm: false });
      setSuccessMessage('Password ripristinata con successo. Una email è stata inviata all\'utente.');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Errore nel ripristino della password: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateRandomPassword = () => {
    // Genera una password casuale di 10 caratteri (numeri, lettere e simboli)
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  };

  const openResetPasswordForm = (userId, userName) => {
    const randomPassword = generateRandomPassword();
    setResetPassword({
      userId,
      userName,
      newPassword: randomPassword,
      showForm: true
    });
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return 'Amministratore';
      case 'barber': return 'Barbiere';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-500';
      case 'barber': return 'bg-green-500';
      case 'client': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        <p className="mt-4 text-[var(--text-primary)]">Caricamento utenti...</p>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-[var(--accent)]">
        Gestione Utenti
      </h2>

      {/* Messaggi di successo/errore */}
      {successMessage && (
        <div className="bg-green-500 text-white p-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-3 rounded">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 bg-red-600 px-2 py-1 rounded"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Form ripristino password */}
      {resetPassword.showForm && (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Ripristina Password per {resetPassword.userName}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center">
              <input
                type="text"
                value={resetPassword.newPassword}
                onChange={(e) => setResetPassword({
                  ...resetPassword,
                  newPassword: e.target.value
                })}
                className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)] flex-1"
              />
              <button
                onClick={() => setResetPassword({
                  ...resetPassword,
                  newPassword: generateRandomPassword()
                })}
                className="ml-2 bg-gray-500 text-white px-3 py-2 rounded"
                title="Genera password casuale"
              >
                🔄
              </button>
            </div>
            <p className="text-sm text-gray-400">
              Nota: Una email sarà inviata all'utente con la nuova password
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handlePasswordReset}
                className="bg-[var(--accent)] text-white px-4 py-2 rounded hover:opacity-90"
              >
                Ripristina Password
              </button>
              <button
                onClick={() => setResetPassword({ userId: null, newPassword: '', showForm: false })}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:opacity-90"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form nuovo utente */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Aggiungi Nuovo Utente</h3>
        <form onSubmit={handleNewUserSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
            <input
              type="text"
              placeholder="Nome"
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
            <input
              type="text"
              placeholder="Cognome"
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
            <input
              type="tel"
              placeholder="Telefono"
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
            >
              <option value="client">Cliente</option>
              <option value="barber">Barbiere</option>
              <option value="admin">Amministratore</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[var(--accent)] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Aggiungi Utente
            </button>
          </div>
        </form>
      </div>

      {/* Lista utenti */}
      <div className="grid gap-4">
        {users.map(user => (
          <div
            key={user._id}
            className="bg-[var(--bg-secondary)] p-4 rounded-lg"
          >
            {editingUser?.id === user._id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      firstName: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    placeholder="Nome"
                  />
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      lastName: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    placeholder="Cognome"
                  />
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      email: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      phone: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                    placeholder="Telefono"
                  />
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      role: e.target.value
                    })}
                    className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--accent)]"
                  >
                    <option value="client">Cliente</option>
                    <option value="barber">Barbiere</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleUpdateUser(user._id)}
                    className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {user.email} • {user.phone}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)} text-white`}>
                    {getRoleName(user.role)}
                  </span>
                </div>
                <div className="flex mt-4 md:mt-0 space-x-2">
                  <button
                    onClick={() => setEditingUser({...user, id: user._id})}
                    className="bg-[var(--accent)] text-white px-3 py-1 rounded hover:opacity-90"
                    title="Modifica utente"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => openResetPasswordForm(user._id, `${user.firstName} ${user.lastName}`)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:opacity-90"
                    title="Ripristina password"
                  >
                    Ripristina Password
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:opacity-90"
                    title="Elimina utente"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserManager;
