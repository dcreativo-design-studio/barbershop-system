import mongoose from 'mongoose';

const waitingListSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    required: true
  },
  preferredBarber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'Il barbiere è obbligatorio']  // Aggiungiamo un messaggio di errore personalizzato
  },
  preferredDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  preferredTimeSlots: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening']
  }],
  requestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'booked', 'expired', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  notificationsSent: [{
    date: Date,
    type: String,
    success: Boolean,
    message: String
  }],
  expiryDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Aggiungere middleware pre-save per la validazione
waitingListSchema.pre('save', function(next) {
  if (!this.preferredBarber) {
    next(new Error('Il barbiere è obbligatorio'));
  }
  next();
});

// Indici per migliorare le performance delle query
waitingListSchema.index({ status: 1, requestDate: 1 });
waitingListSchema.index({ client: 1, status: 1 });

const WaitingList = mongoose.model('WaitingList', waitingListSchema);

export default WaitingList;
