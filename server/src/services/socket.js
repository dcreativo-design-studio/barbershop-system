import { Server } from 'socket.io';

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "https://barbershop.dcreativo.ch",
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-timezone'
      ]
    },
    // Configurazioni aggiuntive per la produzione
    path: '/socket.io',
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: {
      name: 'io',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  });

  // Middleware per autenticazione (opzionale)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      // Qui puoi implementare la verifica del token se necessario
      next();
    } else {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('newBooking', (data) => {
      console.log('New booking received:', data);
      io.emit('bookingUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}
