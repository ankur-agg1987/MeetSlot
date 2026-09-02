const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    eventType: { type: mongoose.Schema.Types.ObjectId, ref: 'EventType', required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // The client (booker) - must be Gmail-authenticated
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    notes: { type: String, default: '' },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, required: true },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    cancelReason: { type: String, default: '' },

    // Google Calendar event created on the organizer's calendar
    googleEventId: { type: String },
    meetLink: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ organizer: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
