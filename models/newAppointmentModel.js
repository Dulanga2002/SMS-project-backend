const mongoose = require('mongoose');

const newAppointmentSchema = new mongoose.Schema(
  {
    customer: {
      customerId: {
        type: String,
        required: true
      },
      customerName: {
        type: String,
        required: true
      }
    },

    staff: {
      staffId: {
        type: String,
        required: true
      },
      staffName: {
        type: String,
        required: true
      }
    },

    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Service'
        },
        serviceName: {
          type: String,
          required: true
        },
        serviceCost: {
          type: Number,
          required: true
        }
      }
    ],

    appointmentDate: {
      type: Date,
      required: true
    },

    appointmentTime: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true
    },

    totalCost: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      maxlength: 500
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);


module.exports = mongoose.model('newAppointment', newAppointmentSchema);
