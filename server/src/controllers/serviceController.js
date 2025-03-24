import Service from '../models/Service.js';

export const serviceController = {
  // Ottiene tutti i servizi attivi (per i clienti)
  async getServices(req, res) {
    try {
      console.log('Fetching active services');
      const services = await Service.find({ isActive: true })
        .sort({ name: 1 });
      console.log('Found services:', services);
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Ottiene tutti i servizi (per gli admin)
  async getAllServices(req, res) {
    try {
      console.log('Fetching all services (admin)');
      const services = await Service.find()
        .sort({ name: 1 });
      console.log('Found services:', services);
      res.json(services);
    } catch (error) {
      console.error('Error fetching all services:', error);
      res.status(500).json({ message: error.message });
    }
  },

  async createService(req, res) {
    try {
      console.log('Creating new service with data:', req.body);
      const service = new Service({
        ...req.body,
        isActive: true // Assicurati che i nuovi servizi siano attivi di default
      });
      await service.save();
      console.log('Service created:', service);
      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(400).json({ message: error.message });
    }
  },

  async updateService(req, res) {
    try {
      console.log('Updating service:', req.params.id, 'with data:', req.body);
      const service = await Service.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!service) {
        console.log('Service not found:', req.params.id);
        return res.status(404).json({ message: 'Servizio non trovato' });
      }
      console.log('Service updated:', service);
      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(400).json({ message: error.message });
    }
  },

  async deleteService(req, res) {
    try {
      console.log('Deactivating service:', req.params.id);
      const service = await Service.findById(req.params.id);
      if (!service) {
        console.log('Service not found:', req.params.id);
        return res.status(404).json({ message: 'Servizio non trovato' });
      }
      service.isActive = false;
      await service.save();
      console.log('Service deactivated:', service);
      res.json({ message: 'Servizio disattivato con successo' });
    } catch (error) {
      console.error('Error deactivating service:', error);
      res.status(500).json({ message: error.message });
    }
  },
  async validateService(req, res) {
    try {
      const { serviceName } = req.body;

      if (!serviceName) {
        return res.status(400).json({
          isValid: false,
          message: 'Nome servizio non fornito'
        });
      }

      // Cerca il servizio nel database
      const service = await Service.findOne({
        name: serviceName,
        isActive: true
      });

      res.json({
        isValid: !!service,
        message: service ? 'Servizio valido' : 'Servizio non trovato o non attivo'
      });

    } catch (error) {
      console.error('Error validating service:', error);
      res.status(500).json({
        isValid: false,
        message: 'Errore nella validazione del servizio'
      });
    }
  }
};

export default serviceController;
