import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Service from '../models/Service.js';

dotenv.config();

const defaultServices = [
  {
    name: 'Taglio',
    price: 30,
    duration: 30,
    description: 'Taglio di capelli maschile',
    isActive: true
  },
  {
    name: 'Barba',
    price: 20,
    duration: 20,
    description: 'Rifinitura e modellamento barba',
    isActive: true
  },
  {
    name: 'Taglio + Barba',
    price: 45,
    duration: 45,
    description: 'Taglio di capelli e modellamento barba',
    isActive: true
  },
  {
    name: 'Taglio Bambino',
    price: 25,
    duration: 25,
    description: 'Taglio di capelli per bambini',
    isActive: true
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Cerca servizi esistenti
    const existingServices = await Service.find();
    console.log('Existing services:', existingServices);

    // Aggiungi solo i servizi che non esistono già
    for (const service of defaultServices) {
      const existingService = existingServices.find(s => s.name === service.name);
      if (!existingService) {
        console.log(`Adding new service: ${service.name}`);
        await Service.create(service);
      } else {
        console.log(`Service already exists: ${service.name}`);
      }
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedServices();
