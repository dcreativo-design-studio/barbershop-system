import bcryptjs from 'bcryptjs'; // Cambiato da bcrypt a bcryptjs
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGuest;
    },
    minLength: 6
  },
  role: {
    type: String,
    enum: ['client', 'admin', 'guest', 'barber'],
    default: 'client'
  },
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
  phone: {
    type: String,
    required: true
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  profileImage: {
    url: String,
    publicId: String
  },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook per hashare la password
userSchema.pre('save', async function(next) {
  // Log per debug
  console.log('Pre-save hook triggered');
  console.log('isModified("password"):', this.isModified('password'));
  console.log('Current password value:', this.password);

  // Skip se l'utente è guest o la password non è stata modificata
  if (this.isGuest || !this.isModified('password')) {
    console.log('Skipping password hash (guest or password not modified)');
    return next();
  }

  // Skip se la password sembra già essere hashata (inizia con $2a$)
  if (this.password.startsWith('$2a$')) {
    console.log('Password appears to be already hashed, skipping hash');
    return next();
  }

  try {
    console.log('Hashing password...');
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    console.log('Password hashed successfully:', this.password);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Post-save hook per logging
userSchema.post('save', function(doc) {
  console.log('Post-save hook triggered');
  console.log('Final password value:', doc.password);
});

// Metodo per comparare le password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGuest) {
    console.log('Guest user cannot login');
    return false;
  }

  try {
    console.log('Comparing passwords for user:', this.email);
    console.log('Stored hash:', this.password);
    const isMatch = await bcryptjs.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

// Metodo statico per resettare la password
userSchema.statics.resetPassword = async function(userId, newPassword) {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    const updatedUser = await this.findByIdAndUpdate(
      userId,
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    console.log('Password reset successful for user:', updatedUser.email);
    return updatedUser;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Metodo per aggiornare la password
userSchema.methods.updatePassword = async function(newPassword) {
  try {
    // No need to hash here, il pre-save hook lo farà
    this.password = newPassword;
    await this.save();
    console.log('Password updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
export default User;
