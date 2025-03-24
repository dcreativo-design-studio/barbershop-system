import mongoose from 'mongoose';

// Define workingHoursSchema first
const workingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isWorking: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} non è un orario valido!`
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} non è un orario valido!`
    }
  },
  hasBreak: {
    type: Boolean,
    default: false
  },
  breakStart: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.hasBreak && this.isWorking) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        }
        return true;
      },
      message: props => `${props.value} non è un orario valido per la pausa!`
    }
  },
  breakEnd: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.hasBreak && this.isWorking) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        }
        return true;
      },
      message: props => `${props.value} non è un orario valido per la pausa!`
    }
  }
});

// Define vacationSchema before using it
const vacationSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v >= this.startDate;
      },
      message: 'La data di fine vacanza deve essere successiva alla data di inizio'
    }
  }
});

// Add middleware pre-save for workingHours
workingHoursSchema.pre('validate', function(next) {
  if (!this.isWorking) {
    this.hasBreak = false;
    this.breakStart = null;
    this.breakEnd = null;
  }

  if (!this.hasBreak) {
    this.breakStart = null;
    this.breakEnd = null;
  }

  next();
});

// Now define the barberSchema using both workingHoursSchema and vacationSchema
const barberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: props => `${props.value} non è un indirizzo email valido!`
    }
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
      },
      message: props => `${props.value} non è un numero di telefono valido!`
    }
  },
  services: [{
    type: String,
    validate: {
      validator: async function(serviceName) {
        const Service = mongoose.model('Service');
        const service = await Service.findOne({ name: serviceName, isActive: true });
        return !!service;
      },
      message: props => `${props.value} non è un servizio valido!`
    }
  }],
  workingHours: [workingHoursSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  vacations: [vacationSchema],
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: props => `${props.value} non è un URL valido!`
    }
  },
  bio: {
    type: String,
    maxLength: 500
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add methods to barberSchema
barberSchema.methods.isAvailable = function(date, time) {
  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const schedule = this.workingHours.find(h => h.day === dayOfWeek);

  if (!schedule || !schedule.isWorking) {
    return false;
  }

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const requestedMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(schedule.startTime);
  const endMinutes = timeToMinutes(schedule.endTime);

  if (schedule.breakStart && schedule.breakEnd) {
    const breakStartMinutes = timeToMinutes(schedule.breakStart);
    const breakEndMinutes = timeToMinutes(schedule.breakEnd);
    if (requestedMinutes >= breakStartMinutes && requestedMinutes <= breakEndMinutes) {
      return false;
    }
  }

  return requestedMinutes >= startMinutes && requestedMinutes <= endMinutes;
};

barberSchema.methods.getWorkingHoursForDay = function(date) {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  return this.workingHours.find(h => h.day === dayOfWeek);
};

// Create indexes
barberSchema.index({ isActive: 1 });
barberSchema.index({ services: 1 });

const Barber = mongoose.model('Barber', barberSchema);

export default Barber;
