import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Configurazione dell'URL del socket
const SOCKET_URL = 'https://api.barbershop.dcreativo.ch';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Creazione della connessione socket con l'URL di produzione
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Aggiunte opzioni aggiuntive per la sicurezza in produzione
      secure: true,
      rejectUnauthorized: false
    });

    // Gestione degli eventi socket
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Salva l'istanza del socket nello state
    setSocket(newSocket);

    // Cleanup alla disconnessione
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        newSocket.close();
      }
    };
  }, []);

  // Il provider fornisce l'istanza del socket ai componenti figli
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook personalizzato per usare il socket
export const useSocket = () => {
  const socket = useContext(SocketContext);

  if (!socket) {
    console.warn('useSocket must be used within a SocketProvider');
  }

  return socket;
};

// Esporta anche il contesto se necessario in altri file
export default SocketContext;
