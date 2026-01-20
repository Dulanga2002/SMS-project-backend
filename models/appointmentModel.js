const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  staff: {
    type: String,
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent double booking for staff
appointmentSchema.index({ staff: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
