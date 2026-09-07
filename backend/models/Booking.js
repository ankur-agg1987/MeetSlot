const mongoose = require('mongoose');

// A booked career-advisory session. No student login exists, so all of the
// student's details are captured directly on the booking form and stored here.
const bookingSchema = new mongoose.Schema(
  {
    eventType: { type: mongoose.Schema.Types.ObjectId, ref: 'EventType', required: true },
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },

    // Student details, captured at booking time (no student account exists)
    studentName: { type: String, required: true },
    studentId: { type: String, default: '' }, // roll number / registration number
    studentEmail: { type: String, required: true },
    studentPhone: { type: String, default: '' },
    program: { type: String, default: '' }, // e.g. "B.Tech CSE", "MCA"
    yearOrSemester: { type: String, default: '' },
    purpose: { type: String, default: '' }, // e.g. "Resume Review", "Interview Prep"
    message: { type: String, default: '' }, // free-text details of what the student wants to discuss

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, required: true },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    cancelReason: { type: String, default: '' },

    // Whether the notification email to the advisor's Gmail went out successfully
    advisorNotified: { type: Boolean, default: false },
    studentConfirmed: { type: Boolean, default: false },

    // Post-session follow-up: the advisor's notes and any action plan agreed
    // with the student, sent to the student by email once the advisor clicks "Send".
    remarks: { type: String, default: '' },
    actionPlan: { type: String, default: '' },
    remarksSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ advisor: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
