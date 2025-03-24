import bcryptjs from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { testCloudinaryConnection } from './config/cloudinary.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import User from './models/User.js';
import adminRoutes from './routes/adminRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import barberRoutes from './routes/barberRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // Nuova importazione
import serviceRoutes from './routes/serviceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import waitingListRoutes from './routes/waitingListRoutes.js';
import { initializeScheduler } from './services/appointmentScheduler.js';
import setupSocket from './services/socket.js';

// Carica le variabili d'ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurazione CORS dinamica basata sull'ambiente
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https:/yourstyle.dcreativo.ch',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-timezone',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['x-timezone'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security headers per produzione
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// Configura i limiti del body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware solo in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.file) {
      console.log('File received:', req.file);
    }
    next();
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Your Style Barber API v1.0',
    endpoints: {
      auth: '/api/auth',
      appointments: '/api/appointments',
      admin: '/api/admin',
      users: '/api/users',
      barbers: '/api/barbers',
      waitingList: '/api/waiting-list',
      services: '/api/services',
      contact: '/api/contact'  // Aggiunto nuovo endpoint
    },
    docs: 'https://docs.yourstyle.dcreativo.ch'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);  // Nuova route per il form di contatto

// Test route solo in development
if (process.env.NODE_ENV !== 'production') {
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal Server Error'
    : err.message;

  console.error('Global Error Handler:', err);

  res.status(status).json({
    status: 'error',
    message
  });
});

// Funzione per inizializzare l'admin
const initializeAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'barbershopyourstyle@gmail.com' });

    if (!existingAdmin) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('2Gbnt2!3', salt);

      const adminUser = new User({
        email: 'barbershopyourstyle@gmail.com',
        password: hashedPassword,
        firstName: 'Santiago',
        lastName: 'Amministratore',
        phone: '0789301599',
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Existing user updated to admin role');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};

// MongoDB connection con retry
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Inizializza l'admin dopo la connessione
    await initializeAdmin();

  } catch (err) {
    if (retries > 0) {
      console.log(`❌ MongoDB connection failed. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Server startup con gestione errori migliorata
const startServer = async () => {
  try {
    await connectDB();

    // Rimosso blocco di verifica email
    // La verifica è già stata effettuata e confermata
    console.log('✅ Email configuration is already verified');

    await initializeScheduler();
    console.log('✅ Appointment scheduler initialized');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server and MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Socket.io setup
    setupSocket(server);

  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
};

// Test Cloudinary connection
testCloudinaryConnection()
  .then(success => {
    if (success) {
      console.log('✅ Cloudinary connected successfully');
    } else {
      console.log('❌ Cloudinary connection failed');
    }
  });

startServer();

export default app;
